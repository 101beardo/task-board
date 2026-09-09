/**
 * Bridge between the Next route handlers (bundled by Next) and the WebSocket
 * server started in `server.ts` (plain Node). They share one process, so the
 * broadcaster is handed over on `globalThis`.
 *
 * When the app runs without the custom server (plain `next dev`, or on a
 * serverless host) the broadcaster is simply absent and this is a no-op.
 */

export type BoardBroadcaster = (boardId: string) => void;

const globalForRealtime = globalThis as unknown as {
  __boardBroadcast?: BoardBroadcaster;
};

export function registerBoardBroadcaster(fn: BoardBroadcaster): void {
  globalForRealtime.__boardBroadcast = fn;
}

export function broadcastBoardChange(boardId: string): void {
  globalForRealtime.__boardBroadcast?.(boardId);
}
