# assistant

A chat with the church's documents: type a question or speak it, get an answer with the pages it came from.
Spoken questions are also read back aloud. The conversation stays on the device.

Full docs: `.claude/architecture.md` → 6.4 assistant. The RAG pipeline itself lives in `services/ai` (Python).

## Setup
1. Run the AI service: `docker run -d --restart unless-stopped -p 8000:8000 --env-file .env --name vc-ai vietcorner-ai`
   (from `services/ai`), and give it a public HTTPS address for phone testing (architecture.md §9).
2. `.env.local`: `AI_SERVICE_URL` (no trailing slash) and `AI_SERVICE_TOKEN` (the service's `SERVICE_TOKEN`).
3. Phones need HTTPS for the microphone. `localhost` counts as secure; a phone on your Wi-Fi does not.

## How one question flows
```
type + Send ─┐
             ├─► useChatbotMessages.send ─► api.askQuestion ─► /api/assistant/ask ─► server/askQuestion
tap 🎙️ ─► useVoiceQuestion ─► api.transcribeRecording ─► /api/assistant/transcribe ─► server/transcribeAudio
             │                                                                          │
             └────────────────────────── bubbles + sources ◄──────── AI service (rewrite → embed → search → answer)
                                         spoken aloud when the question was spoken
```

## Files (standard feature shape)
| Layer | File | Job |
|---|---|---|
| Types | `types.ts` | `ChatMessage`, `Answer`, `Source`, `Turn`, `Recording`, `ErrorCause` |
| Browser API | `api.ts` | The two backend calls, and the only place HTTP failures become an `AssistantError` |
| Failure policy | `errors.ts` | Cause → message + whether a retry could help. One table, one decision. |
| Browser capability | `speech.ts` | Reads an answer aloud: language from the text, iOS priming, citations stripped |
| Device storage | `storage.ts` | The conversation in localStorage, keyed by user id, capped and crash-proof |
| State | `hooks/useChatbotMessages.ts` | The conversation: send, retry with a growing wait, new chat, persistence |
| State | `hooks/useVoiceQuestion.ts` | Record → transcribe → hand over the text (`onQuestion`) |
| State | `hooks/useVoiceRecorder.ts` | The microphone only: formats, permission, stopping the tracks |
| UI | `components/` | `AssistantChat` (wires the hooks), `MessageList`, `MessageBubble`, `Composer`, `VoiceButton` |
| Server logic | `server/aiService.ts` | The only holder of the service URL + token: timeout, 503 → `AiServiceUnavailable` |
| Server logic | `server/askQuestion.ts`, `server/transcribeAudio.ts` | One call each; no Next.js imports |
| Routes | `src/app/api/assistant/{ask,transcribe}/route.ts` | Verify the user, validate input, map errors |
| Data | `schema.sql` | `document_chunks`: server-only, filled by `services/ai`, never read by the browser |

No `server/queries.ts`: the page loads only who is signed in, because the assistant stores nothing server-side.

## Decisions worth knowing
- **Follow-up questions.** The last 4 completed turns travel with each question. The service rewrites
  "Còn nhóm khác thì sao?" into a standalone question before searching (`services/ai/rag/condense.py`),
  because a search index has no memory. Sources are never sent back: they cost tokens and resolve nothing.
- **One question at a time.** A second send while one is in flight is ignored; simpler than a queue, and a
  user who is waiting for an answer rarely wants two.
- **Retry is manual, and waits longer each time** (5 s, 7 s, 9 s… up to 60 s), because free providers rest
  for 60 s after a rate limit. The countdown is shown, or the link would look broken. One success resets it.
- **Storage is per user id, not cleared at sign-out.** That keeps the auth feature free of any knowledge of
  this one. A different user on the same phone sees their own (empty) conversation; a returning user sees
  theirs until they press "New chat".
- **Not tested:** components and hooks. Vitest covers the pure modules (`npm test`); the UI is verified by
  running it (see Expected behavior).

## Expected behavior
- Logged out: `/assistant` redirects to `/login`; both routes answer `401 {"error":"Not signed in"}`.
- A typed question shows the user's bubble plus a "…" answer bubble, then the answer with its sources.
- A spoken question does the same and reads the answer aloud, without the `[1]` citations.
- Any answer can be replayed with 🔊.
- Nothing understood → "Tôi chưa nghe rõ…" under the microphone; no bubble is added.
- A failed answer becomes a red bubble with "Try again"; tapping it counts down, then asks again.
- 401 and 400-type failures show the reason with **no** retry link, because retrying cannot help.
- "New chat" empties the screen and the device, cancels a pending retry, and stops any speech.
- The conversation is still there after closing and reopening the app.

## Remove
Delete this folder and `src/app/api/assistant/`, reset `src/app/assistant/page.tsx` to a placeholder, drop the
Assistant tab in `src/components/TabBar.tsx`, remove `AI_SERVICE_URL`/`AI_SERVICE_TOKEN`, and delete
`services/ai` plus the `document_chunks` table.
