import type { CSSProperties } from "react";
import type { TeamId } from "../../shared/types.ts";
import { useRoom } from "../lib/socket.ts";

type Room = NonNullable<ReturnType<typeof useRoom>["room"]>;

export function ScoreStrip({
  room,
  onTeam,
}: {
  room: Room;
  onTeam?: (id: TeamId) => void;
}) {
  return (
    <div className="scores" style={{ flex: 1, marginTop: 0 }}>
      {room.teams.map((team) => {
        const members = room.players.filter((p) => p.teamId === team.id).map((p) => p.name);
        return (
          <div
            key={team.id}
            className="score"
            style={{ "--team": team.color, cursor: onTeam ? "pointer" : undefined } as CSSProperties}
            onClick={() => onTeam?.(team.id)}
          >
            <b>{team.label}</b>
            <em>${team.score}</em>
            <small>{members.join(" · ") || "—"}</small>
          </div>
        );
      })}
    </div>
  );
}
