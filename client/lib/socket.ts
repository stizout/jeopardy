import { useEffect, useRef, useState } from "react";
import type { ClientMessage, RoomState, ServerMessage } from "../../shared/types.ts";

function wsUrl() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/ws`;
}

export function useRoom() {
  const wsRef = useRef<WebSocket | null>(null);
  const helloRef = useRef<ClientMessage | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  function clearRetry() {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }

  function attach(ws: WebSocket) {
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data)) as ServerMessage;
      if (msg.type === "error") setError(msg.message);
      if (msg.type === "state") {
        setRoom(msg.room);
        setError(null);
      }
      if (msg.type === "joined") {
        setPlayerId(msg.playerId);
        setRoom(msg.room);
        setError(null);
      }
    });
    ws.addEventListener("open", () => {
      setConnected(true);
      if (helloRef.current) ws.send(JSON.stringify(helloRef.current));
    });
    ws.addEventListener("close", () => {
      if (wsRef.current === ws) {
        setConnected(false);
        wsRef.current = null;
        if (helloRef.current) {
          clearRetry();
          retryRef.current = setTimeout(connect, 400);
        }
      }
    });
  }

  function connect() {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    attach(ws);
  }

  useEffect(() => {
    return () => {
      helloRef.current = null;
      clearRetry();
      wsRef.current?.close();
    };
  }, []);

  async function send(msg: ClientMessage) {
    setError(null);
    if (msg.type === "board" || msg.type === "host" || msg.type === "join") {
      helloRef.current = msg;
    }
    const existing = wsRef.current;
    if (!existing || existing.readyState === WebSocket.CLOSING || existing.readyState === WebSocket.CLOSED) {
      connect();
    }
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("Could not connect.")), { once: true });
    });
    if (msg !== helloRef.current) ws.send(JSON.stringify(msg));
  }

  return { room, playerId, error, connected, send, setPlayerId, setError };
}
