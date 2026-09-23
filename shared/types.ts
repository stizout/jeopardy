export const TEAM_PALETTE = [
  { label: "Teal", color: "#1FB8A8" },
  { label: "Amber", color: "#E39B2B" },
  { label: "Rose", color: "#E25B7A" },
  { label: "Lime", color: "#A6C84B" },
  { label: "Sky", color: "#4C9BE8" },
  { label: "Grape", color: "#8B5FBF" },
  { label: "Coral", color: "#E36A4A" },
  { label: "Mint", color: "#3DB88A" },
  { label: "Gold", color: "#D4A017" },
  { label: "Navy", color: "#3D5A99" },
  { label: "Blush", color: "#D46A8A" },
  { label: "Moss", color: "#6B8F3C" },
] as const;

export const MAX_TEAMS = TEAM_PALETTE.length;

export type TeamId = string;

export type Phase = "lobby" | "teams" | "board" | "clue";

export type Player = {
  id: string;
  name: string;
  teamId: TeamId | null;
  connected: boolean;
};

export type Team = {
  id: TeamId;
  label: string;
  color: string;
  score: number;
};

export type ClueState = {
  categoryIndex: number;
  rowIndex: number;
  category: string;
  value: number;
  text: string;
  answer: string;
  buzzersOpen: boolean;
  lockedTeamId: TeamId | null;
  lockedByName: string | null;
  ineligibleTeamIds: TeamId[];
  revealed: boolean;
};

export type RoomState = {
  code: string;
  phase: Phase;
  players: Player[];
  teams: Team[];
  spent: string[];
  clue: ClueState | null;
  joinUrl: string;
};

export type ClientMessage =
  | { type: "board"; code: string }
  | { type: "host"; code: string }
  | { type: "join"; code: string; name: string; playerId?: string }
  | { type: "make-teams" }
  | { type: "add-team" }
  | { type: "remove-team"; teamId: TeamId }
  | { type: "assign"; playerId: string; teamId: TeamId | null }
  | { type: "claim"; otherPlayerId: string }
  | { type: "start-board" }
  | { type: "open-clue"; categoryIndex: number; rowIndex: number }
  | { type: "buzz" }
  | { type: "correct" }
  | { type: "wrong" }
  | { type: "reveal" }
  | { type: "skip" }
  | { type: "back-to-board" };

export type ServerMessage =
  | { type: "state"; room: RoomState }
  | { type: "joined"; playerId: string; room: RoomState }
  | { type: "error"; message: string };
