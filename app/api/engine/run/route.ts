import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bus } from "@/lib/events";

async function runEngineInBackground(runId: string): Promise<void> {
  try {
    bus.emit("engine.event", {
      type: "engine.started",
      payload: { runId },
    });

    // Task 009/017 will implement the full engine orchestration.
    // For now, update the run record to indicate it started.
    await db.engineRun.update({
      where: { id: runId },
      data: {
        status: "running",
        log: "Engine started (manual trigger).",
      },
    });

    // Dynamically import the engine runner once task 017 implements it.
    // When available, replace the block below with:
    //   const { runEngine } = await import("@/worker/engine/run");
    //   await runEngine(runId);

    // Placeholder: mark completed immediately (no-op until task 017)
    await db.engineRun.update({
      where: { id: runId },
      data: {
        status: "completed",
        log: "Engine completed (manual trigger — no-op until task 017).",
      },
    });

    bus.emit("engine.event", {
      type: "engine.completed",
      payload: { runId, contentCount: 0 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.engineRun
      .update({
        where: { id: runId },
        data: {
          status: "failed",
          log: `Engine failed: ${message}`,
        },
      })
      .catch(() => undefined);

    bus.emit("engine.event", {
      type: "engine.completed",
      payload: { runId, contentCount: 0, error: message },
    });
  }
}

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const run = await db.engineRun.create({
      data: {
        date: new Date(),
        status: "running",
        log: "",
      },
    });

    // Fire-and-forget: do not await
    runEngineInBackground(run.id).catch(() => undefined);

    return Response.json({ status: "started", runId: run.id }, { status: 202 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
