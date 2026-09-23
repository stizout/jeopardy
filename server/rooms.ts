import { randomBytes, randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { BOARD, clueKey } from "./board.ts";
import type {
  ClientMessage,
  ClueState,
  Phase,
  Player,
  RoomState,
  Team,
  TeamId,
} from "../shared/types.ts";
import { MAX_TEAMS, TEAM_PALETTE } from "../shared/types.ts";

const LETTERS = "ABCDEFGHJKMNPQRTUVWXYZ";

export function makeCode() {
  let code = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i++) code += LETTERS[bytes[i] % LETTERS.length];
  return code;
}

export function isValidCode(code: string) {
  const clean = code.trim().toUpperCase();
  return clean.length === 4 && [...clean].every((ch) => LETTERS.includes(ch));
}

type SocketRole = { role: "board" } | { role: "host" } | { role: "player"; playerId: string };

type LiveSocket = WebSocket & { meta?: SocketRole };

export function makeTeam(index: number): Team {
  const swatch = TEAM_PALETTE[index % TEAM_PALETTE.length];
  const wave = Math.floor(index / TEAM_PALETTE.length);
  return {
    id: `t${index + 1}`,
    label: wave === 0 ? swatch.label : `${swatch.label} ${wave + 1}`,
    color: swatch.color,
    score: 0,
  };
}

function defaultTeams(): Team[] {
  return [makeTeam(0), makeTeam(1)];
}

export class Room {
  code: string;
  phase: Phase = "lobby";
  players: Player[] = [];
  teams: Team[] = defaultTeams();
  nextTeamIndex = 2;
  spent = new Set<string>();
  clue: ClueState | null = null;
  joinUrl: string;
  sockets = new Set<LiveSocket>();
  idle: ReturnType<typeof setTimeout> | null = null;

  constructor(code: string, joinUrl: string) {
    this.code = code;
    this.joinUrl = joinUrl;
    this.touch();
  }

  touch() {
    if (this.idle) clearTimeout(this.idle);
    this.idle = setTimeout(() => this.manager?.drop(this.code), 1000 * 60 * 90);
  }

  manager: RoomManager | null = null;

  snapshot(kind: "public" | "host" = "public"): RoomState {
    const showAnswer = kind === "host" || Boolean(this.clue?.revealed);
    return {
      code: this.code,
      phase: this.phase,
      players: this.players.map((p) => ({ ...p })),
      teams: this.teams.map((t) => ({ ...t })),
      spent: [...this.spent],
      clue: this.clue
        ? {
            ...this.clue,
            ineligibleTeamIds: [...this.clue.ineligibleTeamIds],
            answer: showAnswer ? this.clue.answer : "",
          }
        : null,
      joinUrl: this.joinUrl,
    };
  }

  broadcast() {
    this.touch();
    for (const ws of this.sockets) {
      if (ws.readyState !== 1) continue;
      const kind = ws.meta?.role === "host" ? "host" : "public";
      ws.send(JSON.stringify({ type: "state", room: this.snapshot(kind) }));
    }
  }

  attach(ws: LiveSocket) {
    this.sockets.add(ws);
    ws.on("close", () => {
      this.sockets.delete(ws);
      const meta = ws.meta;
      if (meta?.role === "player") {
        const p = this.players.find((x) => x.id === meta.playerId);
        if (p) p.connected = false;
        this.broadcast();
      }
    });
  }

  isHost(ws: LiveSocket) {
    return ws.meta?.role === "host";
  }

  isStage(ws: LiveSocket) {
    return ws.meta?.role === "host" || ws.meta?.role === "board";
  }

  playerOf(ws: LiveSocket) {
    const meta = ws.meta;
    if (meta?.role !== "player") return null;
    return this.players.find((p) => p.id === meta.playerId) ?? null;
  }

  join(ws: LiveSocket, name: string, playerId?: string) {
    const clean = name.trim().replace(/\s+/g, " ").slice(0, 18);
    if (clean.length < 1) throw new Error("Type a name.");

    if (playerId) {
      const byId = this.players.find((p) => p.id === playerId);
      if (byId) {
        byId.connected = true;
        byId.name = clean;
        ws.meta = { role: "player", playerId: byId.id };
        this.attach(ws);
        return byId;
      }
    }

    const byName = this.players.find(
      (p) => p.name.toLowerCase() === clean.toLowerCase(),
    );
    if (byName) {
      if (byName.connected) {
        const stillLive = [...this.sockets].some(
          (s) => s.meta?.role === "player" && s.meta.playerId === byName.id && s.readyState === 1,
        );
        if (stillLive) throw new Error("That name is already in the room.");
      }
      byName.connected = true;
      ws.meta = { role: "player", playerId: byName.id };
      this.attach(ws);
      return byName;
    }

    if (this.phase !== "lobby" && this.phase !== "teams" && this.phase !== "board") {
      throw new Error("Wait for the next clue, then the host can seat you.");
    }

    const player: Player = {
      id: randomUUID(),
      name: clean,
      teamId: this.phase === "lobby" ? null : null,
      connected: true,
    };
    this.players.push(player);
    ws.meta = { role: "player", playerId: player.id };
    this.attach(ws);
    return player;
  }

  assign(playerId: string, teamId: TeamId | null) {
    if (this.phase !== "teams" && this.phase !== "board") {
      throw new Error("Teams are not open yet.");
    }
    if (teamId && !this.teams.some((t) => t.id === teamId)) {
      throw new Error("No such team.");
    }
    const player = this.players.find((p) => p.id === playerId);
    if (!player) throw new Error("No player with that name.");
    player.teamId = teamId;
  }

  claim(fromId: string, otherId: string) {
    if (this.phase !== "teams") throw new Error("Teams are not open yet.");
    const me = this.players.find((p) => p.id === fromId);
    const other = this.players.find((p) => p.id === otherId);
    if (!me || !other) throw new Error("Could not find that person.");
    if (me.id === other.id) return;

    let team = me.teamId ?? other.teamId;
    if (!team) {
      team = this.smallestTeamId();
    }
    me.teamId = team;
    other.teamId = team;
  }

  smallestTeamId(): TeamId {
    if (this.teams.length === 0) this.addTeam();
    let best = this.teams[0].id;
    let bestCount = Infinity;
    for (const team of this.teams) {
      const count = this.players.filter((p) => p.teamId === team.id).length;
      if (count < bestCount) {
        best = team.id;
        bestCount = count;
      }
    }
    return best;
  }

  addTeam() {
    if (this.phase !== "teams" && this.phase !== "board") {
      throw new Error("Teams are not open yet.");
    }
    if (this.teams.length >= MAX_TEAMS) {
      throw new Error(`That's enough teams (${MAX_TEAMS}).`);
    }
    this.teams.push(makeTeam(this.nextTeamIndex++));
  }

  removeTeam(teamId: TeamId) {
    if (this.phase !== "teams") throw new Error("Finish this board before cutting a team.");
    if (this.teams.length <= 1) throw new Error("Keep at least one team.");
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("No such team.");
    for (const player of this.players) {
      if (player.teamId === teamId) player.teamId = null;
    }
    this.teams = this.teams.filter((t) => t.id !== teamId);
  }

  startBoard() {
    const seated = this.players.filter((p) => p.teamId);
    if (seated.length < 1) throw new Error("Put someone on a team first.");
    this.phase = "board";
    this.clue = null;
  }

  openClue(categoryIndex: number, rowIndex: number) {
    if (this.phase !== "board") throw new Error("The board is not up.");
    const key = clueKey(categoryIndex, rowIndex);
    if (this.spent.has(key)) throw new Error("That one is gone.");
    const category = BOARD[categoryIndex];
    const item = category?.clues[rowIndex];
    if (!item) throw new Error("No such clue.");
    this.phase = "clue";
    this.clue = {
      categoryIndex,
      rowIndex,
      category: category.title,
      value: item.value,
      text: item.clue,
      answer: item.answer,
      buzzersOpen: false,
      lockedTeamId: null,
      lockedByName: null,
      ineligibleTeamIds: [],
      revealed: false,
    };
    setTimeout(() => {
      if (this.phase === "clue" && this.clue && this.clue.categoryIndex === categoryIndex && this.clue.rowIndex === rowIndex) {
        this.clue.buzzersOpen = true;
        this.broadcast();
      }
    }, 700);
  }

  buzz(playerId: string) {
    if (this.phase !== "clue" || !this.clue) return;
    if (!this.clue.buzzersOpen || this.clue.lockedTeamId || this.clue.revealed) return;
    const player = this.players.find((p) => p.id === playerId);
    if (!player?.teamId) return;
    if (this.clue.ineligibleTeamIds.includes(player.teamId)) return;
    this.clue.lockedTeamId = player.teamId;
    this.clue.lockedByName = player.name;
    this.clue.buzzersOpen = false;
  }

  finishClue(award: boolean) {
    if (!this.clue) return;
    if (award && this.clue.lockedTeamId) {
      const team = this.teams.find((t) => t.id === this.clue!.lockedTeamId);
      if (team) team.score += this.clue.value;
    }
    this.spent.add(clueKey(this.clue.categoryIndex, this.clue.rowIndex));
    this.clue = null;
    this.phase = "board";
  }

  wrong() {
    if (!this.clue?.lockedTeamId) return;
    this.clue.ineligibleTeamIds.push(this.clue.lockedTeamId);
    this.clue.lockedTeamId = null;
    this.clue.lockedByName = null;
    const liveTeams = new Set(
      this.players.filter((p) => p.teamId).map((p) => p.teamId as TeamId),
    );
    const remaining = [...liveTeams].filter(
      (id) => !this.clue!.ineligibleTeamIds.includes(id),
    );
    if (remaining.length === 0) {
      this.clue.revealed = true;
      this.clue.buzzersOpen = false;
      return;
    }
    this.clue.buzzersOpen = true;
  }

  handle(ws: LiveSocket, msg: ClientMessage) {
    switch (msg.type) {
      case "make-teams":
        if (!this.isStage(ws)) throw new Error("Only the host can open teams.");
        if (this.phase !== "lobby") throw new Error("Already past the lobby.");
        this.phase = "teams";
        break;
      case "add-team":
        if (!this.isStage(ws)) throw new Error("Only the host can add a team.");
        this.addTeam();
        break;
      case "remove-team":
        if (!this.isStage(ws)) throw new Error("Only the host can remove a team.");
        this.removeTeam(msg.teamId);
        break;
      case "assign":
        if (!this.isStage(ws)) throw new Error("Only the host can move people.");
        this.assign(msg.playerId, msg.teamId);
        break;
      case "claim": {
        const me = this.playerOf(ws);
        if (!me) throw new Error("Join before you pick teammates.");
        this.claim(me.id, msg.otherPlayerId);
        break;
      }
      case "start-board":
        if (!this.isStage(ws)) throw new Error("Only the host can start.");
        this.startBoard();
        break;
      case "open-clue":
        if (!this.isStage(ws)) throw new Error("Only the host picks clues.");
        this.openClue(msg.categoryIndex, msg.rowIndex);
        break;
      case "buzz": {
        const me = this.playerOf(ws);
        if (!me) return;
        this.buzz(me.id);
        break;
      }
      case "correct":
        if (!this.isHost(ws)) throw new Error("Only the host scores.");
        this.finishClue(true);
        break;
      case "wrong":
        if (!this.isHost(ws)) throw new Error("Only the host scores.");
        this.wrong();
        break;
      case "reveal":
        if (!this.isHost(ws)) throw new Error("Only the host reveals.");
        if (this.clue) this.clue.revealed = true;
        break;
      case "skip":
        if (!this.isHost(ws)) throw new Error("Only the host can skip.");
        this.finishClue(false);
        break;
      case "back-to-board":
        if (!this.isHost(ws)) return;
        if (this.clue) this.finishClue(false);
        break;
      default:
        break;
    }
    this.broadcast();
  }
}

export class RoomManager {
  rooms = new Map<string, Room>();

  constructor(private joinOrigin: () => string) {}

  create(origin?: string) {
    let code = makeCode();
    while (this.rooms.has(code)) code = makeCode();
    return this.ensure(code, origin);
  }

  ensure(code: string, origin?: string) {
    const existing = this.get(code);
    if (existing) return existing;
    const clean = code.trim().toUpperCase();
    if (!isValidCode(clean)) throw new Error("No room with that code.");
    const base = (origin || this.joinOrigin()).replace(/\/$/, "");
    const room = new Room(clean, `${base}/play/${clean}`);
    room.manager = this;
    this.rooms.set(clean, room);
    return room;
  }

  get(code: string) {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  drop(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    for (const ws of room.sockets) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.rooms.delete(code);
  }
}
