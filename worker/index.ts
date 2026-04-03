/**
 * Worker process entry point.
 * Runs alongside Next.js via concurrently.
 * Registers all cron jobs for content generation and posting.
 * Multi-user: each cron tick fetches all paid users and runs the job for each.
 */

import cron from "node-cron";

import { sendWorkerAlert } from "@/lib/alert";
import { db } from "@/lib/db";
import { seedDefaults } from "@/lib/seeds";
import { getSetting } from "@/lib/settings";

import { runBlogGeneration } from "./blog/index";
import { generateEmailDraft } from "./email/draft";
import { runEngine } from "./engine/run";
import { analyzeOpportunities } from "./opportunities/analyze";
import { postPlatform, postScheduledPieces } from "./posting/scheduler";
import { runResearch } from "./research/index";
import { runSocialRepurposing } from "./social/index";

function onJobError(jobName: string) {
  return (err: unknown) => {
    console.error(`[worker] ${jobName} failed:`, err);
    sendWorkerAlert(jobName, err);
  };
}

async function runForAllUsers(
  jobFn: (userId: string) => Promise<void>,
  jobName: string,
): Promise<void> {
  const users = await db.user.findMany({
    where: { plan: { not: "free" } },
    select: { id: true },
  });
  for (const user of users) {
    await jobFn(user.id).catch(onJobError(`${jobName}[${user.id}]`));
  }
}

async function loadSchedule(): Promise<void> {
  const users = await db.user.findMany({
    where: { plan: { not: "free" } },
    select: { id: true },
  });
  for (const user of users) {
    const timezone =
      (await getSetting("timezone", user.id)) ?? "America/New_York";
    const entries = await db.scheduleEntry.findMany({
      where: { active: true, userId: user.id },
      include: { template: true },
    });
    for (const entry of entries) {
      const [hStr, mStr] = entry.time.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const days = JSON.parse(entry.daysOfWeek) as number[];
      const dowExpr = days.length === 7 ? "*" : days.join(",");
      const expr = `${m} ${h} * * ${dowExpr}`;
      cron.schedule(
        expr,
        () => {
          postPlatform(entry.platform, user.id).catch(
            onJobError(`Post ${entry.platform}[${user.id}]`),
          );
        },
        { timezone },
      );
      console.log(
        `[worker] Scheduled ${entry.platform} for user ${user.id} at ${entry.time} (days: ${dowExpr}, tz: ${timezone})`,
      );
    }
  }
}

async function start(): Promise<void> {
  // Seed defaults for any paid user who doesn't have templates yet
  const users = await db.user.findMany({
    where: { plan: { not: "free" } },
    select: { id: true },
  });
  for (const user of users) {
    await seedDefaults(user.id);
  }

  // Fixed global UTC cron times — per-user settings (daily_run_hour, timezone)
  // are read inside each job function via getSetting(key, userId).
  const globalTz = "UTC";
  const cronOptions = { timezone: globalTz };

  // 06:00 UTC — Research pull
  cron.schedule(
    "0 6 * * *",
    () => {
      runForAllUsers(runResearch, "Research").catch(onJobError("Research"));
    },
    cronOptions,
  );

  // 06:30 UTC — Blog generation
  cron.schedule(
    "30 6 * * *",
    () => {
      runForAllUsers(runBlogGeneration, "Blog generation").catch(
        onJobError("Blog generation"),
      );
    },
    cronOptions,
  );

  // 07:00 UTC — Social repurposing
  cron.schedule(
    "0 7 * * *",
    () => {
      runForAllUsers(runSocialRepurposing, "Social repurposing").catch(
        onJobError("Social"),
      );
    },
    cronOptions,
  );

  // 07:30 UTC — Email draft
  cron.schedule(
    "30 7 * * *",
    () => {
      runForAllUsers(generateEmailDraft, "Email draft").catch(
        onJobError("Email draft"),
      );
    },
    cronOptions,
  );

  // 08:00 UTC — Opportunities analysis
  cron.schedule(
    "0 8 * * *",
    () => {
      runForAllUsers(analyzeOpportunities, "Opportunities").catch(
        onJobError("Opportunities"),
      );
    },
    cronOptions,
  );

  // 09:00 UTC — Engine run (promotions-based content)
  cron.schedule(
    "0 9 * * *",
    () => {
      runForAllUsers(runEngine, "Engine run").catch(onJobError("Engine"));
    },
    cronOptions,
  );

  // Every 5 minutes — post scheduled pieces for all paid users
  cron.schedule(
    "*/5 * * * *",
    () => {
      runForAllUsers(postScheduledPieces, "Scheduled posts").catch(
        onJobError("Scheduled posts"),
      );
    },
    cronOptions,
  );

  // Load per-user posting schedule crons from DB
  await loadSchedule();

  console.log("[worker] Multi-user worker started.");
}

start().catch((err) => {
  console.error("[worker] Failed to start worker:", err);
  process.exit(1);
});

// Keep process alive
process.on("SIGINT", () => {
  console.log("[worker] Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[worker] Shutting down...");
  process.exit(0);
});
