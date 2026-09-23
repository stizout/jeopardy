import { useState } from "react";
import { useNavigate } from "react-router-dom";

const KEYS = "ABCDEFGHJKMNPQRTUVWXYZ".split("");

export function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function add(letter: string) {
    setError(null);
    setCode((c) => {
      const next = (c + letter).slice(0, 4);
      if (next.length === 4) queueMicrotask(() => go(next));
      return next;
    });
  }

  async function go(next = code) {
    if (next.length !== 4) return;
    setBusy(true);
    const res = await fetch(`/api/rooms/${next}`);
    if (!res.ok) {
      setError("No room with that code.");
      setBusy(false);
      setCode("");
      return;
    }
    navigate(`/play/${next}`);
  }

  return (
    <div className="page">
      <div className="wordmark">THE DEN</div>
      <div className="phone">
        <div className="say">Join</div>
        <h2>Type the code</h2>
        <div className="field">{code.padEnd(4, "·")}</div>
        {error && <div className="error">{error}</div>}
        <div className="keys">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => add(k)}>
              {k}
            </button>
          ))}
          <button className="wide" type="button" onClick={() => setCode((c) => c.slice(0, -1))}>
            ⌫
          </button>
          <button
            className="wide"
            type="button"
            disabled={code.length !== 4 || busy}
            onClick={() => go()}
          >
            GO
          </button>
        </div>
      </div>
    </div>
  );
}
