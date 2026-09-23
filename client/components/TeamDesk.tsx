import type { CSSProperties } from "react";
import { MAX_TEAMS, type TeamId } from "../../shared/types.ts";
import type { useRoom } from "../lib/socket.ts";

type Room = NonNullable<ReturnType<typeof useRoom>["room"]>;

export function TeamDesk({
  room,
  selected,
  onName,
  onColumn,
  onAdd,
  onRemove,
  interactive,
}: {
  room: Room;
  selected: string | null;
  onName?: (playerId: string) => void;
  onColumn?: (teamId: TeamId | null) => void;
  onAdd?: () => void;
  onRemove?: (teamId: TeamId) => void;
  interactive: boolean;
}) {
  return (
    <div className="teams">
      {room.teams.map((team) => (
        <div
          key={team.id}
          className="team-col"
          style={{ "--team": team.color } as CSSProperties}
          onClick={() => interactive && onColumn?.(team.id)}
        >
          <div className="team-head">
            <h3>{team.label.toUpperCase()}</h3>
            {interactive && onRemove && room.teams.length > 1 && (
              <button
                className="team-x"
                type="button"
                aria-label={`Remove ${team.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(team.id);
                }}
              >
                ×
              </button>
            )}
          </div>
          {room.players
            .filter((p) => p.teamId === team.id)
            .map((p) =>
              interactive && onName ? (
                <button
                  key={p.id}
                  className={`chip ${selected === p.id ? "sel" : ""} ${p.connected ? "" : "off"}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onName(p.id);
                  }}
                >
                  {p.name}
                </button>
              ) : (
                <span key={p.id} className={`chip ${p.connected ? "" : "off"}`}>
                  {p.name}
                </span>
              ),
            )}
        </div>
      ))}
      {interactive && onAdd && room.teams.length < MAX_TEAMS && (
        <button className="team-col team-add" type="button" onClick={onAdd}>
          <h3>ADD TEAM</h3>
        </button>
      )}
      <div className="team-col" onClick={() => interactive && onColumn?.(null)}>
        <h3>NOT YET</h3>
        {room.players
          .filter((p) => !p.teamId)
          .map((p) =>
            interactive && onName ? (
              <button
                key={p.id}
                className={`chip ${selected === p.id ? "sel" : ""} ${p.connected ? "" : "off"}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onName(p.id);
                }}
              >
                {p.name}
              </button>
            ) : (
              <span key={p.id} className={`chip ${p.connected ? "" : "off"}`}>
                {p.name}
              </span>
            ),
          )}
      </div>
    </div>
  );
}
