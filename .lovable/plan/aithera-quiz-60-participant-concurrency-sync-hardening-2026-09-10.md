# AITHERA QUIZ — 60-Participant Concurrency & Sync Hardening

## Direct answer

Yes, 60 students can take the quiz at the same time, but the app needs a short verification and hardening pass before the symposium. The current architecture is already designed for this:

- Quiz runs fully offline after download (IndexedDB + service worker shell).
- Answers are saved locally on every tap; timer runs on the device.
- Submissions go through one server endpoint (`/api/public/submit-attempt`) that re-scores and writes idempotently by attempt ID.
- Firestore stores one document per attempt, so 60 concurrent writes are spread across 60 documents.

The main risk is not the app itself — it is the college lab network (all 60 devices reconnecting to the same WiFi at once) and a brief "thundering herd" of sync requests when everyone turns internet back on.

## What we will verify

1. **Connectivity probe load**
   - 60 clients polling `/api/public/connectivity-check` every 2.5 s while online.
   - Confirm the edge endpoint stays under ~100 ms and returns no 5xx.

2. **Submission endpoint burst**
   - Simulate 60 concurrent POSTs to `/api/public/submit-attempt` after the quiz ends.
   - Confirm all return HTTP 200, scores are correct, and no duplicate documents are created.

3. **Firestore rules and quotas**
   - Confirm published quiz reads and server-side attempt writes work without authentication errors.
   - Check the Firebase project plan (Spark daily write/read limits) can absorb ~60 quiz reads + 60 attempt writes + leaderboard reads.

4. **Full device flow**
   - Prepare quiz → turn internet off → start quiz → answer → submit → turn internet on → sync → confirm result appears in admin dashboard.
   - Repeat on a second device/browser to rule out cross-device issues.

## What we will harden

1. **Sync retry backoff with jitter**
   - Replace the flat 20 s sync interval with exponential backoff and small random jitter so 60 devices do not all retry at the same millisecond.

2. **Adaptive connectivity probing**
   - Slow the probe interval once the quiz has started and the device is confirmed offline, or pause polling while the quiz is locked, to reduce WiFi chatter.

3. **Result-page sync polling**
   - Reduce the current 5 s result-page polling interval or switch it to event-driven (online event + manual "Sync now"), so finished devices do not keep hammering the network.

4. **Submission idempotency guard**
   - Keep the existing attempt-ID-based idempotent write, but add a client-side "sync in progress" flag so the same device does not fire multiple overlapping POSTs.

5. **Coordinator runbook**
   - Document the exact steps: publish quiz, have students prepare while online, turn off WiFi together, start quiz, collect devices, turn WiFi back on, verify leaderboard.

## Out of scope for this plan

- Changing the quiz content or scoring logic.
- Adding new authentication methods.
- Redesigning pages.

## Success criteria

- 60 simulated concurrent submissions complete with 0 server errors.
- All 60 attempts appear in the admin dashboard within 2 minutes of reconnection.
- Offline start, answer saving, timer, and lock-on-reconnection work on a real device when internet is toggled.
