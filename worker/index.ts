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
import { runAffiliateResearch } from "./research/affiliate";
import { runResearch } from "./research/index";
import { runSocialRepurposing } from "./social/index";

// Track active autopilot cron jobs
const scheduledJobs = new Map<string, cron.ScheduledTask>();

// Map weekday abbreviations to cron day numbers
const DAY_TO_CRON: Record<string, string> = {
  sun: "0",
  mon: "1",
  tue: "2",
  wed: "3",
  thu: "4",
  fri: "5",
  sat: "6",
};

function onJobError(jobName: string) {
  return (err: unknown) => {
    console.error(`[worker] ${jobName} failed:`, err);
    sendWorkerAlert(jobName, err);
  };
}

// ---------------------------------------------------------------------------
// Autopilot dispatch functions
// ---------------------------------------------------------------------------

async function runFullPipeline(rule: any): Promise<void> {
  const userId = rule.userId;
  console.log(`[autopilot] Running full pipeline for user ${userId}`);
  await runEngine(userId);
}

async function runResearchOnly(rule: any): Promise<void> {
  const userId = rule.userId;
  const sources = JSON.parse(rule.sources || "[]");
  const keyword = rule.keyword;
  console.log(`[autopilot] Running research for user ${userId}, sources:`, sources);
  await runResearch(userId, keyword);
}

async function runGenerateOnly(rule: any): Promise<void> {
  const userId = rule.userId;
  console.log(`[autopilot] Running content generation for user ${userId}`);
  await runBlogGeneration(userId);
  await runSocialRepurposing(userId);
  await generateEmailDraft(userId);
}

async function runPostOnly(rule: any): Promise<void> {
  const userId = rule.userId;
  console.log(`[autopilot] Running posting scheduler for user ${userId}`);
  await postScheduledPieces(userId);
}

// ---------------------------------------------------------------------------
// Dynamic autopilot scheduling
// ---------------------------------------------------------------------------

async function refreshAutopilotSchedule(): Promise<void> {
  try {
    // Load all enabled AutopilotRules from DB
    const rules = await db.autopilotRule.findMany({
      where: { enabled: true },
    });

    // Cancel all existing scheduled jobs
    for (const [id, job] of scheduledJobs) {
      job.stop();
      scheduledJobs.delete(id);
    }

    // Count users to determine if we should use autopilot or fallback
    const userCount = await db.user.count();

    // If no autopilot rules exist, use fallback to daily_run_hour
    if (rules.length === 0) {
      console.log("[autopilot] No rules found, using default fallback schedule");
      return;
    }

    // For each rule, build a cron expression and schedule it
    for (const rule of rules) {
      const days = JSON.parse(rule.days) as string[];
      const cronDays = days.map((d) => DAY_TO_CRON[d]).join(",");
      // cron expression: "0 {hour} * * {days}"
      const expression = `0 ${rule.hour} * * ${cronDays}`;

      const timezone = (await getSetting("timezone", rule.userId)) ?? "UTC";

      const job = cron.schedule(
        expression,
        async () => {
          try {
            if (rule.type === "full") await runFullPipeline(rule);
            else if (rule.type === "research") await runResearchOnly(rule);
            else if (rule.type === "generate") await runGenerateOnly(rule);
            else if (rule.type === "post") await runPostOnly(rule);
          } catch (err) {
            onJobError(`Autopilot[${rule.id}]`)(err);
          }
        },
        { timezone }
      );

      scheduledJobs.set(rule.id, job);
      console.log(
        `[autopilot] Scheduled rule ${rule.id} (${rule.type}) at ${rule.hour}:00 on ${cronDays} (${timezone})`
      );
    }

    console.log(`[autopilot] Scheduled ${rules.length} rules`);
  } catch (error) {
    console.error("[autopilot] Failed to refresh schedule:", error);
  }
}

async function runForAllUsers(
  jobFn: (userId: string) => Promise<void>,
  jobName: string,
): Promise<void> {
  const users = await db.user.findMany({
    select: { id: true },
  });
  for (const user of users) {
    await jobFn(user.id).catch(onJobError(`${jobName}[${user.id}]`));
  }
}

async function loadSchedule(): Promise<void> {
  const users = await db.user.findMany({
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
  // Seed defaults for any user who doesn't have templates yet
  const users = await db.user.findMany({
    select: { id: true },
  });
  for (const user of users) {
    await seedDefaults(user.id);
  }

  // Fixed global UTC cron times — per-user settings (daily_run_hour, timezone)
  // are read inside each job function via getSetting(key, userId).
  const globalTz = "UTC";
  const cronOptions = { timezone: globalTz };

  // 05:30 UTC — Affiliate research (before research so products are ready)
  cron.schedule(
    "30 5 * * *",
    () => {
      runForAllUsers(runAffiliateResearch, "Affiliate research").catch(
        onJobError("Affiliate research"),
      );
    },
    cronOptions,
  );

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

  // Initial load of autopilot rules
  await refreshAutopilotSchedule();

  // Every 5 minutes — refresh autopilot rules to pick up changes
  cron.schedule(
    "*/5 * * * *",
    () => {
      refreshAutopilotSchedule().catch((err) => {
        console.error("[autopilot] Failed to refresh schedule:", err);
      });
    },
    { timezone: globalTz }
  );

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
