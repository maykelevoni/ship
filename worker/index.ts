/**
 * Worker process entry point.
 * Runs alongside Next.js via concurrently.
 * Registers all cron jobs for content generation and posting.
 *
 * Task 009 will flesh out this file with the full scheduler logic.
 */

console.log("[worker] Starting promotion engine worker...");

// Keep process alive
process.on("SIGINT", () => {
  console.log("[worker] Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[worker] Shutting down...");
  process.exit(0);
});
