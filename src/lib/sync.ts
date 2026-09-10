import { getAttempt, listSyncJobs, putAttempt, removeSyncJob, updateSyncJob } from "./db";
import { pushAttemptToCloud } from "./cloud";

let running = false;
const listeners = new Set<() => void>();
const inFlight = new Set<string>();

export function onSyncChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((l) => l());
}

export async function pendingSyncCount() {
  return (await listSyncJobs()).length;
}

function jitter(baseMs: number, factor = 0.3) {
  const variance = baseMs * factor;
  return baseMs + (Math.random() * variance * 2 - variance);
}

/** Exponential backoff capped at 60 s, with +/-30% jitter. */
function backoffMs(retries: number) {
  const base = 5000;
  const max = 60000;
  return jitter(Math.min(base * 2 ** retries, max));
}

/** Drains the sync queue. Respects per-attempt backoff and prevents overlapping uploads. */
export async function runSync(): Promise<{ synced: number; failed: number }> {
  if (running || typeof navigator === "undefined" || !navigator.onLine) return { synced: 0, failed: 0 };
  running = true;
  let synced = 0;
  let failed = 0;
  try {
    const now = Date.now();
    const jobs = await listSyncJobs();
    for (const job of jobs) {
      if (inFlight.has(job.attemptId)) continue;
      if ((job.nextRetry ?? 0) > now) continue;

      const attempt = await getAttempt(job.attemptId);
      if (!attempt) {
        await removeSyncJob(job.id);
        continue;
      }

      inFlight.add(job.attemptId);
      try {
        await pushAttemptToCloud(attempt);
        await putAttempt({ ...attempt, syncStatus: "SYNCED" });
        await removeSyncJob(job.id);
        synced++;
      } catch (e) {
        failed++;
        await putAttempt({ ...attempt, syncStatus: "SYNC_FAILED" });
        const nextRetry = Date.now() + backoffMs(job.retries);
        await updateSyncJob({ ...job, retries: job.retries + 1, lastError: String(e), nextRetry });
      } finally {
        inFlight.delete(job.attemptId);
      }
    }
  } finally {
    running = false;
    notify();
  }
  return { synced, failed };
}

export function startSyncWatcher() {
  if (typeof window === "undefined") return () => {};
  const trigger = () => void runSync();
  window.addEventListener("online", trigger);
  const interval = window.setInterval(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const now = Date.now();
    const jobs = await listSyncJobs();
    if (jobs.some((j) => (j.nextRetry ?? 0) <= now)) trigger();
  }, 10000);
  trigger();
  return () => {
    window.removeEventListener("online", trigger);
    window.clearInterval(interval);
  };
}
