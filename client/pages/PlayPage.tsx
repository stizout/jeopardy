import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import type { TeamId } from "../../shared/types.ts";
import { rememberPlayer, savedPlayer } from "../lib/storage.ts";
import { useRoom } from "../lib/socket.ts";

export function PlayPage() {
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const { room, playerId, error, send } = useRoom();
  const saved = savedPlayer(roomCode);
  const [name, setName] = useState(saved.name ?? "");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (saved.playerId && saved.name) {
      setJoining(true);
      send({ type: "join", code: roomCode, name: saved.name, playerId: saved.playerId }).catch(
        () => setJoining(false),
      );
    }
  }, [roomCode]);

  useEffect(() => {
    if (playerId && name) rememberPlayer(roomCode, playerId, name.trim());
  }, [playerId, name, roomCode]);

  async function join(event: FormEvent) {
    event.preventDefault();
    setJoining(true);
    try {
      await send({
        type: "join",
        code: roomCode,
        name: name.trim(),
        playerId: saved.playerId ?? undefined,
      });
    } catch {
      setJoining(false);
    }
  }

  const me = room?.players.find((p) => p.id === playerId);
  const myTeam = room?.teams.find((t) => t.id === me?.teamId);

  if (!room || !playerId || !me) {
    return (
      <div className="page">
        <div className="wordmark">THE DEN · {roomCode}</div>
        <form className="phone" onSubmit={join}>
          <div className="say">Your name</div>
          <h2>What’s your name?</h2>
          <input
            className="name"
            value={name}
            autoComplete="nickname"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            placeholder="Dot"
          />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-gold" type="submit" disabled={!name.trim() || joining}>
            I’M IN
          </button>
        </form>
      </div>
    );
  }

  if (room.phase === "lobby") {
    return (
      <Shell code={roomCode} label={me.name}>
        <div className="wait">You’re in. Look at the TV.</div>
      </Shell>
    );
  }

  if (room.phase === "teams") {
    const others = room.players.filter((p) => p.id !== me.id);
    return (
      <Shell code={roomCode} label={myTeam ? `${myTeam.label} · ${me.name}` : me.name}>
        <div className="say">Assign each other</div>
        <h2>Who’s with you?</h2>
        {error && <div className="error">{error}</div>}
        <div className="pick" style={{ "--team": myTeam?.color ?? "var(--teal)" } as CSSProperties}>
          {others.length === 0 && <p className="hint">Waiting for more phones…</p>}
          {others.map((p) => {
            const same = Boolean(me.teamId && p.teamId === me.teamId);
            return (
              <button
                key={p.id}
                className={same ? "on" : ""}
                type="button"
                onClick={() => send({ type: "claim", otherPlayerId: p.id })}
              >
                {p.name}
                {p.teamId && !same ? " · other team" : ""}
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  if (room.phase === "clue" && room.clue) {
    const { clue } = room;
    const weLocked = clue.lockedTeamId === me.teamId;
    const theyLocked = clue.lockedTeamId && clue.lockedTeamId !== me.teamId;
    const ineligible = me.teamId
      ? clue.ineligibleTeamIds.includes(me.teamId as TeamId)
      : true;
    const canBuzz = Boolean(clue.buzzersOpen && me.teamId && !ineligible && !clue.lockedTeamId);

    if (clue.revealed) {
      return (
        <Shell code={roomCode} label={teamLine(myTeam, me.name)}>
          <div className="wait">Look at the TV.</div>
        </Shell>
      );
    }

    if (weLocked) {
      return (
        <Shell code={roomCode} label="Your team has the floor">
          <div className="wait">
            <div>
              Say it together.
              <div className="you" style={{ "--team": myTeam?.color } as CSSProperties}>
                {myTeam?.label.toUpperCase()}
              </div>
            </div>
          </div>
        </Shell>
      );
    }

    if (theyLocked) {
      const them = room.teams.find((t) => t.id === clue.lockedTeamId);
      return (
        <Shell code={roomCode} label={teamLine(myTeam, me.name)}>
          <div className="wait">{them?.label ?? "They"} {them ? "is" : "are"} answering.</div>
        </Shell>
      );
    }

    return (
      <Shell code={roomCode} label={teamLine(myTeam, me.name)}>
        <div className="wait">
          {canBuzz ? "Look at the TV." : ineligible ? "Not this clue." : "Wait for the clue."}
        </div>
        <button
          className={`buzzer ${myTeam ? "team" : ""}`}
          style={{ "--team": myTeam?.color } as CSSProperties}
          type="button"
          disabled={!canBuzz}
          onClick={() => {
            navigator.vibrate?.(40);
            send({ type: "buzz" });
          }}
        >
          BUZZ
        </button>
      </Shell>
    );
  }

  return (
    <Shell code={roomCode} label={teamLine(myTeam, me.name)}>
      <div className="wait">Look at the TV.</div>
      <button className={`buzzer ${myTeam ? "team" : ""}`} style={{ "--team": myTeam?.color } as CSSProperties} type="button" disabled>
        BUZZ
      </button>
    </Shell>
  );
}

function teamLine(team: { label: string } | undefined, name: string) {
  return team ? `${team.label} · ${name}` : name;
}

function Shell({
  code,
  label,
  children,
}: {
  code: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <div className="row-between">
        <div className="wordmark">THE DEN · {code}</div>
        <div className="hint">{label}</div>
      </div>
      <div className="phone">{children}</div>
    </div>
  );
}
