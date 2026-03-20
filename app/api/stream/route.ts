import { bus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const encoder = new TextEncoder();

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let cleanedUp = false;

  const stream = new ReadableStream({
    start(controller) {
      function send(data: object): void {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      }

      function onEngineEvent(event: { type: string; payload: unknown }): void {
        send(event);
      }

      function cleanup(): void {
        if (cleanedUp) return;
        cleanedUp = true;
        bus.off("engine.event", onEngineEvent);
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      bus.on("engine.event", onEngineEvent);

      // Ping every 30s to keep the connection alive (SSE comment line)
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 30_000);

      // Clean up if the client aborts
      req.signal.addEventListener("abort", () => cleanup());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
