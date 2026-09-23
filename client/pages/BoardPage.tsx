import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import type { TeamId } from "../../shared/types.ts";
import { BoardGrid } from "../components/BoardGrid.tsx";
import { ScoreStrip } from "../components/ScoreStrip.tsx";
import { TeamDesk } from "../components/TeamDesk.tsx";
import { useRoom } from "../lib/socket.ts";

export function BoardPage() {
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const { room, error, send } = useRoom();
  const [qr, setQr] = useState<string>("");
  const [joinUrl, setJoinUrl] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    send({ type: "board", code: roomCode }).catch(() => undefined);
  }, [roomCode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const runtime = (await fetch("/api/runtime").then((r) => r.json())) as {
        joinOrigin: string;
        lanOrigin: string;
      };
      const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const origin = local ? runtime.lanOrigin : location.origin;
      const url = `${origin}/play/${roomCode}`;
      const data = await QRCode.toDataURL(url, {
        margin: 0,
        width: 320,
        color: { dark: "#0C0A08", light: "#F6F0E4" },
      });
      if (!cancelled) {
        setJoinUrl(url);
        setQr(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  const spoken = joinUrl.replace(/^https?:\/\//, "").replace(`/play/${roomCode}`, "");

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
      <div className="page-wide">
        <div className="wordmark">THE DEN</div>
        <p className="hint">{error ?? "Opening the room…"}</p>
      </div>
    );
  }

  if (room.phase === "lobby") {
    return (
      <div className="page-wide">
        <div className="row-between">
          <div className="wordmark">THE DEN</div>
          <div className="hint">Each person, their own phone.</div>
        </div>
        <div className="lobby-mid">
          <div>
            <p className="say">Room code</p>
            <p className="code">{room.code}</p>
            <p className="url">
              On your phone go to <em>{spoken || "this site"}</em> and type those four letters.
            </p>
          </div>
          <div className="qr">{qr ? <img src={qr} alt={`Join ${room.code}`} /> : null}</div>
        </div>
        {error && <div className="error">{error}</div>}
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
      </div>
    );
  }

  if (room.phase === "teams") {
    return (
      <div className="page-wide">
        <div className="row-between">
          <div className="wordmark">THE DEN</div>
          <div className="hint">Tap a name, then a team. Phones can do this too.</div>
        </div>
        <p className="mix">Mix a kid and a grown-up. Any phone on the team can buzz.</p>
        {error && <div className="error">{error}</div>}
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
      </div>
    );
  }

  const clue = room.clue;
  const locked = clue ? room.teams.find((t) => t.id === clue.lockedTeamId) : null;

  return (
    <div className="page-wide">
      <div className="row-between">
        <div className="wordmark">THE DEN</div>
        <ScoreStrip room={room} />
      </div>
      {error && <div className="error">{error}</div>}
      {clue && (
        <div className="board-question">
          <div className="clue-meta">
            <span>{clue.category}</span>
            <span>${clue.value}</span>
          </div>
          <p className="clue-text">{clue.revealed ? clue.answer : clue.text}</p>
          <span className="live">
            {clue.revealed
              ? "ANSWER"
              : locked
                ? `${locked.label} is answering${clue.lockedByName ? ` · ${clue.lockedByName} buzzed` : ""}`
                : clue.buzzersOpen
                  ? "BUZZERS OPEN"
                  : "GET READY"}
          </span>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <BoardGrid
          spent={room.spent}
          onOpen={
            clue
              ? undefined
              : (categoryIndex, rowIndex) => send({ type: "open-clue", categoryIndex, rowIndex })
          }
        />
      </div>
    </div>
  );
}
