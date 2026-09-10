# AITHERA QUIZ — Symposium Day Runbook

## Before the event

1. **Publish the quiz**
   - Sign in at `/admin` with the coordinator account.
   - Go to `/admin/create` and fill in:
     - Quiz Title: AITHERA QUIZ
     - Quiz Code: AIQ2026
     - Duration: 30 minutes
     - Marks per Question: 1
   - Add all 30 questions with 4 options each and one correct answer selected.
   - Click **Publish**.
   - Write down the published quiz code (e.g., `AIQ2026`).

2. **Test the full flow on one device**
   - Open the app, enter a test participant name and role number.
   - Enter the quiz code and click **Enter Quiz**.
   - Keep internet on until the quiz is prepared.
   - On the "Ready to start?" screen, turn off WiFi/mobile data.
   - Confirm the screen shows "You're ready" and start the quiz.
   - Answer a few questions, submit, then turn internet back on.
   - Confirm the result page says "Submission delivered to your teacher".
   - Check `/admin/dashboard` or the per-quiz leaderboard to see the test attempt.

3. **Clear test attempts (optional)**
   - If you do not want test data in the final leaderboard, delete the test attempt from the admin results page before the real event starts.

## During the event

1. **Participant entry**
   - Each student opens the app on their device.
   - They enter:
     - Participant Name
     - Role Number / Participant ID
     - Quiz Code: `AIQ2026`
   - They click **Enter Quiz**.

2. **Prepare while online**
   - Keep the lab WiFi ON.
   - The app downloads the quiz to each device and checks for duplicate attempts.
   - Wait until every device shows "Ready to start?" before turning off the network.

3. **Start the quiz offline**
   - Turn off the lab WiFi (or ask students to turn off WiFi/mobile data on their devices).
   - Each student confirms the app shows "You're ready" and clicks **Start quiz**.
   - The quiz runs entirely offline. Answers save automatically on each device.

4. **If a device reconnects during the quiz**
   - The app will lock immediately and show "Internet connection detected".
   - The timer keeps running.
   - The student must turn internet off again; the quiz will resume automatically.

5. **Submit**
   - Students submit when finished or when time runs out.
   - Submissions are stored locally first.

6. **Sync after the quiz**
   - Turn the lab WiFi back ON.
   - The app automatically uploads submissions.
   - Students can tap **Sync now** on the result page if needed.
   - Wait 1–2 minutes, then refresh the admin leaderboard to confirm all attempts arrived.

## Troubleshooting

| Problem | What to do |
|--------|-----------|
| "Internet is still on" at start | Ask the student to also turn off mobile data / hotspot. |
| "This participant has already completed this quiz" | The same role number was used twice. Use a unique role number. |
| Result page stays on "Saved on this device" | WiFi may be off or the sync queue is backed off. Turn WiFi on and tap **Sync now**. |
| Leaderboard missing some students | Wait 2 minutes and refresh. Sync uses exponential backoff with jitter, so a delayed upload is normal. |
| App shows a blank screen after refresh | Hard-refresh once while online, then go offline again. The service worker caches the quiz shell. |

## Important reminders

- Do not update the app code after students have started preparing; old service workers may cache previous files.
- Use one unique role number per student to prevent duplicate-attempt errors.
- The coordinator password should be changed after the event.
