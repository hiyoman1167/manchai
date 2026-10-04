# `/chat` · 遊戲聊天練習室 Beta

## Surface role

An additive Cantonese typing and entertainment surface for one learner and one simulated AI game teammate. It is a public Beta, not a multiplayer room or an official game integration. The existing warm paper Japanese inspired brand shell remains the visual authority; the dark game-channel treatment belongs only inside `.game-lobby`.

This record describes the implemented surface, with `templates/chat.html`, `chat.css`, `chat.js`, `data/chat-*.csv` and `worker/chat.mjs` as ground truth. Product scope lives in `PRODUCT.md`; API, quota and development instructions live in [chat operations](../chat.md). Edit chat copy and scenarios in CSV and regenerate with `tools/build-chat.py`.

## Hierarchy and composition

The shared navigation leads to a paper introduction with a Mincho title, Beta label, return-to-practice link and short disclosure. Inside the channel, the settings rail presents eight games: LoL, Apex, VALORANT, CS2, Overwatch, PUBG, Monster Hunter and World of Warcraft. Each game has three scenarios. Three tone buttons offer friendly conversation by default, optional banter and explicitly selected profanity.

The room header identifies the game channel and starts a new round through a two-step confirmation. Connection status and the free-quota badge precede scenario buttons. The transcript is chronological, with avatars, teammate identity, AI label, timestamps and distinct opening/preset source labels. The desktop roster contains exactly the learner and one AI teammate; it does not imply real online players. The next layer offers a manual suggested reply and character help, followed by the labelled composer. Storage, privacy, quota and approximate-statistics notes remain on paper below the channel.

## Visual treatment

The local channel tokens are `--lobby-bg: #151e1c`, `--lobby-panel: #1c2824`, `--lobby-line: #35463f`, `--lobby-ink: #edf1e7` and `--lobby-muted: #b3bfb5`. `--game-color` comes from the selected game's CSV record and highlights its symbol, channel and teammate name. Selected games use a filled surface; tones and scenarios add a changed border/fill. The profanity tone uses its own warm selected state. Selection remains legible through those shapes and `aria-pressed`, not colour alone.

The channel has gently rounded edges (14px desktop, 12px mobile). Its inner regions use thin dividers and tonal changes without a new shadow. The room title and controls use inherited sans-serif type; character help retains Mincho samples. Transcript text is 15px with 1.9 line height, reducing to 14px on mobile. A mint 2px focus outline is visible against the dark surfaces. Buttons use short colour/background transitions; the waiting dot is the only repeating motion and is disabled with reduced-motion preference.

## Responsive layout

- Above 1050px: a 238px settings rail sits beside the room; the transcript shares its row with a 156px roster/statistics rail. The transcript scrolls within a 325px region.
- At 1050px and below: the settings rail is 200px wide, the transcript occupies the room width, roster entries are hidden, and all three statistics remain visible in a horizontal strip below the transcript.
- At 700px and below: settings move above the room. Game buttons form a horizontally scrollable row; three tone choices share a row. Scenario controls wrap, the transcript is 310px tall, and hints/composer use 16px side padding. Statistics remain visible. Shared navigation scrolls horizontally when needed.

## Typing and character help

The learner types with an installed IME. Enter sends committed text; Shift + Enter creates a line. Enter during composition or candidate selection, including the short interval immediately after composition ends, does not submit. The composer counts up to 180 Unicode characters and rejects empty or over-limit messages. Suggested replies provide a sentence to type manually; clicking their Chinese characters opens help rather than filling the composer.

Chinese characters in teammate messages and suggestions are interactive. Selecting one starts with no code shown, then reveals the first root in rose (`#efa4b3`), last root in jade (`#9bd7c5`), and finally keyboard letters. Single-code characters receive an explanation; missing codes show an explicit unavailable message. Codes and root mappings come from local data, never model-generated guesses. Within each message, left/right arrow keys move between character buttons without putting every character into the normal Tab order.

## Connection, failure and reset states

The page begins by checking `/api/chat/status`. Sending is disabled while checking or waiting for a reply. Waiting shows a status and stop action; the client stops waiting after 25 seconds. Failures expose retry and a deliberate switch to labelled preset scenario practice. Preset mode has its own status and reply-source labels; it is not an automatic or paid AI fallback. Opening messages are also identified separately from generated replies.

Changing game or scenario cancels the pending request and starts a fresh current transcript. Changing tone retains the transcript and inserts a system notice. Restarting a round and clearing local chat records require a second click within four seconds. Clearing resets this surface's statistics and current round; learning-page progress uses separate storage keys.

## Persistence and statistics

`manchai-game-chat-v1` stores the current game, tone, scenario, draft, statistics and at most 30 messages. Saved message content and restored drafts are limited to 180 characters; saved choices, roles, source labels, timestamps and statistics are validated when restored. Draft writes are debounced, and the current state is saved again on page exit. Storage failure leaves the room usable and changes the visible storage status.

The three statistics show Chinese characters typed, approximate characters per minute and completed teammate replies. IME committed text is counted once; paste and drop do not increase typing statistics. The speed estimate uses bounded intervals between committed inputs, so it is a practice reference rather than a standard typing assessment. Clearing chat resets these statistics.

## API and cost boundary

Generated replies use the same-origin Worker API and fixed Qwen3 model with the account's shared daily Workers AI Free allocation. Quota exhaustion stops inference. There is no paid fallback, automatic retry or automatic plan upgrade; the account must remain on Workers Free, with AI disabled before any future paid upgrade. The shared quota is not a per-page promise of unlimited messages.

Only the latest eight learner/teammate messages are sent for inference, each capped at 180 characters. The Worker limits request size, validates same-origin requests and applies the configured rate limiter. It renders reply text without hidden thinking sections, stores no application chat database and logs error categories rather than message content. Full limits and Cloudflare's data handling references are recorded in [chat operations](../chat.md).
