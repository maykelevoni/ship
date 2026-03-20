"use client";

import { useEffect, useRef } from "react";

export interface StreamEvent {
  type: string;
  payload: unknown;
}

/**
 * Connects to the SSE stream at /api/stream and calls `onEvent` for each
 * received message. Automatically reconnects on disconnect.
 */
export function useStream(onEvent: (event: StreamEvent) => void): void {
  // Keep a stable ref to the latest callback so the effect doesn't re-run
  // every render.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect(): void {
      if (destroyed) return;

      es = new EventSource("/api/stream");

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(e.data) as StreamEvent;
          onEventRef.current(parsed);
        } catch {
          // ignore malformed messages
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!destroyed) {
          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(connect, 3_000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      es?.close();
    };
  }, []); // no deps — onEventRef handles the stable callback
}
