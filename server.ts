import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { WebSocketServer, type WebSocket } from "ws";
import { registerBoardBroadcaster } from "@/server/realtime";
import { verifyBoardAccess } from "@/server/ws-auth";

const port = Number(process.env.PORT ?? 3000);
// Bind all interfaces. Not process.env.HOSTNAME: hosts like Render set that to
// the container's own hostname, which is not a bindable address.
const hostname = "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const wss = new WebSocketServer({ noServer: true });
  // boardId -> connected sockets subscribed to that board
  const rooms = new Map<string, Set<WebSocket>>();

  registerBoardBroadcaster((boardId) => {
    const room = rooms.get(boardId);
    if (!room?.size) return;
    const message = JSON.stringify({ type: "board:changed", boardId });
    for (const socket of room) {
      if (socket.readyState === socket.OPEN) socket.send(message);
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, searchParams } = new URL(
      req.url ?? "",
      "http://localhost",
    );
    // Anything else (Next's HMR socket in dev) is left for Next to handle.
    if (pathname !== "/api/ws") return;

    const boardId = searchParams.get("boardId");
    if (!boardId) {
      socket.destroy();
      return;
    }

    void verifyBoardAccess(req.headers.cookie, boardId).then((allowed) => {
      if (!allowed) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        let room = rooms.get(boardId);
        if (!room) rooms.set(boardId, (room = new Set()));
        room.add(ws);

        ws.on("close", () => {
          room.delete(ws);
          if (room.size === 0) rooms.delete(boardId);
        });
        ws.on("error", () => ws.close());
      });
    });
  });

  server.listen(port, hostname, () => {
    console.log(
      `> task-board ready on http://${hostname}:${port} (${
        dev ? "development" : "production"
      })`,
    );
  });
});
