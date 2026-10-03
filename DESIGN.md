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
- The site draws its own typographic first and last code diagrams. The third-party reference screenshot is not shipped.
- Progress is stored locally in the browser, with no account or backend.
- The large vocabulary library is split into local generated files, loaded only for the requested range or full search. The 191 CC0 auxiliary shape thumbnails load lazily on the atlas page. No runtime account or backend is needed.
- The site has four focused pages: a route map, teaching and character lessons, a complete 24-key auxiliary shape atlas, and typing practice. Shared navigation keeps each step easy to find. All selection controls use inline buttons or a custom course list rather than native select menus.

## Responsive behaviour

- Desktop: lesson rail beside the study panel; illustration beside instructions.
- Mobile: horizontal lesson list, then illustration above instructions; keyboard guide becomes a four column grid.
