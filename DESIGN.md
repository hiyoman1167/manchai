# Design

## Direction

A quiet Japanese inspired study room for a beginner learning 速成. The lesson panel is the main surface; decoration stays outside the task.

## Visual language

- Warm paper background, near white learning surface, dark ink text.
- Rose marks the first code; jade marks the last code and progress. These colours follow the user supplied reference image.
- Mincho style Chinese headings and character samples, with a clear sans serif for instructions and controls.
- Thin rules and generous spacing suggest a printed study sheet. A single restrained shadow lifts the active workspace.

## Interaction

- A three step teaching section explains roots, first and last code, and candidate selection before the drills.
- Two foundation stages: 24 roots in four groups, then 1,011 characters in 25 chapters. Only the active chapter is shown in the lesson rail.
- The practice page starts with 120 original sentences across nine life topics, then 30 original paragraphs in three lengths, with a 410,945-entry searchable vocabulary and phrase library loaded in 10,000-entry parts. Learners use their installed IME to type and choose candidates in the system window. The alternate code-study mode for vocabulary progresses one character at a time.
- The guide shows a solved example; the practice diagram, lesson list, and word gallery conceal codes until hint or successful input.
- Code study has a second step for choosing among three same-code candidates. Real typing checks committed Chinese text, ignores unfinished IME composition, lets learners correct mistakes, and offers optional staged root hints.
- Real typing has a contextual four-step tutor before the input: first root, last root, keyboard positions, then an interactive candidate example. The example cannot mark real typing complete. Learners may revisit steps or opt into guidance that starts each new character at the first-root hint; normal practice resets hints when the target changes. Single-code roots and unavailable drawings have explicit explanations.
- Character diagrams use local SVG strokes: revealing the first root colours its strokes rose, revealing the last colours its strokes jade. Remaining strokes turn muted ink. Unknown component mappings stay uncoloured with an explanatory caption; single-code roots use rose only. The source is credited beside the introductory example. The third-party reference screenshot is not shipped.
- Completion, the current exercise, correctly typed partial text, and automatic guidance preferences are stored locally in the browser. Returning learners resume their exercise; a quiet status line explains saving and shows completion totals. Storage failures leave practice usable and display a clear message. These learning pages need no account or backend; the separate `/chat` Beta uses a Worker API for AI replies.
- The large vocabulary library is split into local generated files, loaded only for the requested range or full search. The 191 CC0 auxiliary shape thumbnails load lazily on the atlas page. These learning resources need no runtime account or backend.
- The learning site has four focused pages: a route map, teaching and character lessons, a complete 24-key auxiliary shape atlas, and typing practice. `/chat` adds a separate game chat Beta. Shared navigation keeps each step easy to find. All selection controls use inline buttons or a custom course list rather than native select menus.

## Game chat surface

- `/chat` keeps the warm paper shell, shared brand, Mincho heading and quiet explanatory copy. The dark olive channel is scoped to `.game-lobby` in `chat.css`; it is a local game-room treatment, not a replacement site theme.
- The channel uses dark olive background (`--lobby-bg: #151e1c`), a slightly lighter settings panel (`--lobby-panel: #1c2824`), thin green-grey rules (`--lobby-line: #35463f`), pale text (`--lobby-ink: #edf1e7`) and muted labels (`--lobby-muted: #b3bfb5`). Each game changes only its room accent through `--game-color`; selected controls also show a distinct fill or border.
- Eight game choices and three opt-in tone choices sit beside the room. A scenario strip precedes a chronological transcript, with a roster showing the learner and one explicitly simulated AI teammate. Manual suggested replies, staged character hints and the composer follow the transcript. The Beta and entertainment identity, inference status, source labels and free-quota explanation stay visible.
- Character help preserves the established first-root rose and last-root jade relationship, with lighter values on the dark channel (`#efa4b3`, `#9bd7c5`). Reveal first root, then last root, then keyboard letters. Codes come from the local character data; the AI does not supply them.
- The room uses tonal layers and thin dividers rather than an added shadow. Gently rounded room edges (14px), small control corners and compact sans-serif labels distinguish conversation from the lesson sheet while retaining the site's restrained typography. Visible focus outlines, pressed states and reduced-motion treatment support the controls.
- The composer accepts committed Chinese from the learner's installed IME. Enter sends, Shift + Enter adds a line, and composition/selection Enter does not send. The 180-character limit, sending/stop state and explicit error actions sit beside the task. Suggested text offers something to type rather than inserting a reply automatically.
- Recent messages, the draft, choices and typing statistics are capped and saved locally. AI replies use the Workers Free shared quota with no paid fallback; preset scenario practice is a clearly labelled manual choice after unavailable inference. See [the chat surface record](docs/surfaces/chat.md) for the responsive composition and state details, and [chat operations](docs/chat.md) for API limits.

## Responsive behaviour

- Desktop: lesson rail beside the study panel; illustration beside instructions.
- Mobile: horizontal lesson list, then illustration above instructions; keyboard guide becomes a four column grid.
- Chat: above 1050px the room has a 238px settings rail and a 156px member/statistics rail. At 1050px and below the settings rail narrows and statistics remain visible in a strip below the transcript. At 700px and below game choices scroll horizontally, the three tones sit side by side above the room, and the composer and hints stack beneath the transcript.
