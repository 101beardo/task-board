"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "@/lib/api";

/**
 * Subscribes to `/api/ws` for the given board and refetches the board query
 * whenever the server says it changed. Reconnects with backoff if the socket
 * drops. When the app runs without the custom server the socket just never
 * opens and the board still works, only without live updates.
 */
export function useBoardSync(boardId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let closedByUs = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    // Give up after a few failures so a host without the WS server (e.g. a
    // serverless deploy) does not reconnect forever. The board still works.
    const MAX_ATTEMPTS = 5;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/api/ws?boardId=${encodeURIComponent(
      boardId,
    )}`;

    function connect() {
      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === "board:changed" && message.boardId === boardId) {
            qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (closedByUs) return;
        attempt += 1;
        if (attempt > MAX_ATTEMPTS) return;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);
        retry = setTimeout(connect, delay);
      };

      socket.onerror = () => socket?.close();
    }

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, [boardId, qc]);
}
