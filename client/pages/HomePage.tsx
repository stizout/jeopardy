import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      if (!res.ok) throw new Error("Could not start a room.");
      const data = (await res.json()) as { code: string };
      navigate(`/host/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a room.");
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="wordmark">THE DEN</div>
      <div className="home">
        <h1>THE DEN</h1>
        <p className="lede">
          Host is /host and the four-letter code. Board is /board and the same code. Open both.
        </p>
        {error && <div className="error">{error}</div>}
        <div className="stack">
          <button className="btn btn-gold" type="button" disabled={busy} onClick={start}>
            START A GAME
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/join")}>
            JOIN A GAME
          </button>
        </div>
      </div>
    </div>
  );
}
