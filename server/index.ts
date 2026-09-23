import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, type WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import type { ClientMessage } from "../shared/types.ts";
import { RoomManager, type Room } from "./rooms.ts";

const PORT = Number(process.env.PORT || 3000);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function lanHost() {
  const nets = networkInterfaces();
  for (const addrs of Object.values(nets)) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return "localhost";
}

function forcedPublicOrigin() {
  const raw = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "";
  return raw.replace(/\/$/, "");
}

function publicOrigin(req?: { headers: { host?: string; "x-forwarded-proto"?: string } }) {
  const forced = forcedPublicOrigin();
  if (forced) return forced;

  const host = req?.headers.host;
  if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
    const proto = String(
      req?.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http"),
    ).split(",")[0];
    if (process.env.NODE_ENV === "production") return `${proto}://${host}`;
    return `http://${host.split(":")[0]}:${PORT}`;
  }
  return `http://${lanHost()}:${PORT}`;
}

const rooms = new RoomManager(() => forcedPublicOrigin() || `http://${lanHost()}:${PORT}`);

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/runtime", (req, res) => {
  const origin = publicOrigin(req);
  res.json({
    joinOrigin: origin,
    lanOrigin: `http://${lanHost()}:${PORT}`,
  });
});

app.post("/api/rooms", (req, res) => {
  const room = rooms.create(publicOrigin(req));
  res.json({ code: room.code, joinUrl: room.joinUrl });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = rooms.get(req.params.code);
  if (!room) return res.status(404).json({ error: "No room with that code." });
  res.json({ code: room.code });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
  let room: Room | null = null;

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      send(ws, { type: "error", message: "Bad message." });
      return;
    }

    try {
      if (msg.type === "board" || msg.type === "host") {
        room = rooms.get(msg.code);
        if (!room) throw new Error("No room with that code.");
        (ws as { meta?: { role: "board" | "host" } }).meta = { role: msg.type };
        room.attach(ws as Room["sockets"] extends Set<infer T> ? T : never);
        send(ws, { type: "state", room: room.snapshot(msg.type === "host" ? "host" : "public") });
        return;
      }
      if (msg.type === "join") {
        room = rooms.get(msg.code);
        if (!room) throw new Error("No room with that code.");
        const player = room.join(ws as never, msg.name, msg.playerId);
        send(ws, { type: "joined", playerId: player.id, room: room.snapshot() });
        room.broadcast();
        return;
      }
      if (!room) throw new Error("Connect to a room first.");
      room.handle(ws as never, msg);
    } catch (err) {
      send(ws, {
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  });
});

if (process.env.NODE_ENV === "production") {
  const clientDir = join(root, "dist/client");
  app.use(express.static(clientDir));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(join(clientDir, "index.html"));
  });
} else {
  const vite = await createViteServer({
    configFile: join(root, "vite.config.ts"),
    server: { middlewareMode: true, host: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`The Den   http://localhost:${PORT}`);
  console.log(`Phones    http://${lanHost()}:${PORT}`);
});
