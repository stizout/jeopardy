import { BOARD } from "../../server/board.ts";

export function BoardGrid({
  spent,
  onOpen,
}: {
  spent: string[];
  onOpen?: (categoryIndex: number, rowIndex: number) => void;
}) {
  return (
    <div className="board-grid">
      <div className="cats">
        {BOARD.map((c) => (
          <div key={c.title} className="cat">
            {c.title}
          </div>
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="vals">
          {BOARD.map((cat, ci) => {
            const gone = spent.includes(`${ci}-${row}`);
            if (!onOpen) {
              return (
                <div key={`${ci}-${row}`} className={`cell ${gone ? "gone" : ""}`}>
                  ${cat.clues[row].value}
                </div>
              );
            }
            return (
              <button
                key={`${ci}-${row}`}
                className={`cell ${gone ? "gone" : ""}`}
                type="button"
                disabled={gone}
                onClick={() => onOpen(ci, row)}
              >
                ${cat.clues[row].value}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
