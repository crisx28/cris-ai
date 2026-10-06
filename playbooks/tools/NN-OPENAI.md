<!-- Generated from NN-OPENAI.json by workflow.mjs docs. Edit the JSON, not this file. -->
# OpenAI (voice + image) playbook — `NN-OPENAI`

Voice (speech-to-text and text-to-speech) and image generation. Text features use Claude (NN-CLAUDE).

**Default owner:** Polly (Quality & AI)

**Environment:** `OPENAI_API_KEY`, `OPENAI_PROJECT_ID`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-OPENAI-01` | Create a project and scoped key per client build | Polly | Key cannot call endpoints outside voice and image. |
| `NN-OPENAI-02` | Set budget limits and keep the key server-side | Polly | Budget is set; the client bundle contains no key. |
| `NN-OPENAI-03` | Wire voice input and output | Polly | A voice note becomes text, and a reply can be played back. |
| `NN-OPENAI-04` | Wire image generation | Polly | Generated images are stored and served from Storage. |

### `NN-OPENAI-01` Create a project and scoped key per client build

- One OpenAI project per client build
- Restrict the key to the audio and image endpoints only

### `NN-OPENAI-02` Set budget limits and keep the key server-side

- Monthly budget and alert threshold on the project
- Call the API only from server routes

### `NN-OPENAI-03` Wire voice input and output

- Speech-to-text for voice input; text-to-speech for spoken replies
- Ask for microphone permission only when the user starts recording
- Do not store audio after transcription unless the client asks

### `NN-OPENAI-04` Wire image generation

- Generate on the server and save results to Supabase Storage (NN-SUPABASE)
- Apply moderation to prompts before generating

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-OPENAI-05` | Test voice and image fallbacks | Polly | Features degrade gracefully with OPENAI_API_KEY unset. |

### `NN-OPENAI-05` Test voice and image fallbacks

- Playwright checks that the UI handles a missing key or API error cleanly (NN-PLAYWRIGHT-03)

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-OPENAI-06` | Monthly usage and key rotation | Polly | Usage logged; rotation date recorded. |

### `NN-OPENAI-06` Monthly usage and key rotation

- Review spend per build
- Rotate the key quarterly
