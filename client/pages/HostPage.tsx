import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { TeamId } from "../../shared/types.ts";
import { ScoreStrip } from "../components/ScoreStrip.tsx";
import { TeamDesk } from "../components/TeamDesk.tsx";
import { useRoom } from "../lib/socket.ts";

export function HostPage() {
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const { room, error, send } = useRoom();
  const [selected, setSelected] = useState<string | null>(null);
  const [boardUrl, setBoardUrl] = useState(`${location.origin}/board/${roomCode}`);

  useEffect(() => {
    send({ type: "host", code: roomCode }).catch(() => undefined);
  }, [roomCode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const runtime = (await fetch("/api/runtime").then((r) => r.json())) as {
        lanOrigin: string;
      };
      const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const origin = local ? runtime.lanOrigin : location.origin;
      if (!cancelled) setBoardUrl(`${origin}/board/${roomCode}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  function putOnTeam(playerId: string, teamId: TeamId | null) {
    send({ type: "assign", playerId, teamId });
    setSelected(null);
  }

  function onName(playerId: string) {
    if (room?.phase !== "teams" && room?.phase !== "board") return;
    setSelected((cur) => (cur === playerId ? null : playerId));
  }

  function onColumn(teamId: TeamId | null) {
    if (!selected) return;
    putOnTeam(selected, teamId);
  }

  if (!room) {
    return (
      <div className="page-wide host-desk">
        <div className="wordmark">THE DEN · HOST</div>
        <p className="hint">{error ?? "Opening the room…"}</p>
      </div>
    );
  }

  const clue = room.clue;
  const locked = clue ? room.teams.find((t) => t.id === clue.lockedTeamId) : null;

  return (
    <div className="page-wide host-desk">
      <div className="host-banner">
        <div>
          <p className="say">Host — answers stay on this page</p>
          <p className="hint">
            Board: <a href={`/board/${roomCode}`}>{boardUrl.replace(/^https?:\/\//, "")}</a>
          </p>
        </div>
      </div>

      <section className="answer-well">
        <p className="say">Answer</p>
        {clue ? (
          <>
            <p className="host-judge-meta">
              {clue.category} · ${clue.value}
            </p>
            <p className="host-answer">{clue.answer || "…"}</p>
            <p className="hint">The board is showing the question.</p>
            <p className="host-tv-clue">{clue.text}</p>
            <div className="host-bar">
              <span className="live">
                {clue.revealed
                  ? "ANSWER IS ON THE TV"
                  : locked
                    ? `${locked.label} is answering${clue.lockedByName ? ` · ${clue.lockedByName} buzzed` : ""}`
                    : clue.buzzersOpen
                      ? "BUZZERS OPEN"
                      : "GET READY"}
              </span>
              {!clue.revealed && (
                <>
                  <button className="btn btn-gold" type="button" onClick={() => send({ type: "correct" })}>
                    CORRECT
                  </button>
                  <button
                    className="btn btn-wrong"
                    type="button"
                    disabled={!locked}
                    onClick={() => send({ type: "wrong" })}
                  >
                    WRONG — REOPEN
                  </button>
                </>
              )}
              <button className="btn btn-ghost" type="button" onClick={() => send({ type: "reveal" })}>
                REVEAL ON TV
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => send({ type: clue.revealed ? "back-to-board" : "skip" })}
              >
                {clue.revealed ? "CLEAR CLUE" : "SKIP"}
              </button>
            </div>
          </>
        ) : (
          <p className="host-wait">No tile yet. Pick one on the board — the answer lands here.</p>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      {room.phase === "lobby" && (
        <>
          <p className="code">{room.code}</p>
          <div className="names">
            {room.players.length === 0 && <div className="hint">Waiting for phones…</div>}
            {room.players.map((p) => (
              <span key={p.id} className={`chip ${p.connected ? "" : "off"}`}>
                {p.name}
              </span>
            ))}
          </div>
          <button
            className="btn btn-gold"
            type="button"
            disabled={room.players.length < 1}
            onClick={() => send({ type: "make-teams" })}
          >
            WE’RE ALL HERE
          </button>
        </>
      )}

      {room.phase === "teams" && (
        <>
          <p className="mix">Mix a kid and a grown-up. Any phone on the team can buzz.</p>
          <TeamDesk
            room={room}
            selected={selected}
            onName={onName}
            onColumn={onColumn}
            onAdd={() => send({ type: "add-team" })}
            onRemove={(teamId) => send({ type: "remove-team", teamId })}
            interactive
          />
          <button
            className="btn btn-gold"
            type="button"
            style={{ marginTop: 16 }}
            disabled={!room.players.some((p) => p.teamId)}
            onClick={() => send({ type: "start-board" })}
          >
            START THE BOARD
          </button>
        </>
      )}

      {(room.phase === "board" || room.phase === "clue") && (
        <>
          {room.players.some((p) => !p.teamId) && (
            <div className="names" style={{ marginTop: 12 }}>
              <span className="hint">Late arrival — tap a name, then a team score.</span>
              {room.players
                .filter((p) => !p.teamId)
                .map((p) => (
                  <button
                    key={p.id}
                    className={`chip ${selected === p.id ? "sel" : ""}`}
                    type="button"
                    onClick={() => onName(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          )}
          <ScoreStrip room={room} onTeam={selected ? (id) => putOnTeam(selected, id) : undefined} />
        </>
      )}
    </div>
  );
}
