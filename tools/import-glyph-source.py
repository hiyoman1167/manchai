"""Reduce pinned Make Me a Hanzi files to course and reading characters.

Use dictionary.txt and graphics.txt from source revision
bddc96d41bef78427ed0e034e9f7e31d71fd1b92. Source licences are in licenses/.
Usage: python3 tools/import-glyph-source.py dictionary.txt graphics.txt
The retained source lets normal builds run entirely offline.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = root / "data"
metadata = {row["character"]: row for row in map(json.loads, Path(sys.argv[1]).read_text().splitlines())}
graphics = {row["character"]: row for row in map(json.loads, Path(sys.argv[2]).read_text().splitlines())}
course = json.loads((data / "lesson-data.js").read_text().split("window.MANCHAI_DATA=", 1)[1].rstrip(";\n"))
characters = {char for chapter in course["chapters"] for char, _ in chapter["entries"]}
characters.update(re.findall(r'\["(.)","[A-Z]+"', (root / "script.js").read_text()))
reading = json.loads((data / "reading-data.js").read_text().split("window.MANCHAI_READING=", 1)[1].rstrip(";\n"))
codes = json.loads((data / "code-data.js").read_text().split("window.MANCHAI_DATA=", 1)[1].rstrip(";\n"))["codes"]
characters.update(char for item in reading["sentences"] + reading["paragraphs"] for char in item["text"] if char in codes or char in reading["codeHints"])
components = set()
pending = list(characters)
while pending:
    character = pending.pop()
    if character in components or character not in metadata:
        continue
    components.add(character)
    pending.extend(char for char in metadata[character]["decomposition"] if char in metadata)
source = data / "glyph-source"
source.mkdir(exist_ok=True)
def write(name, rows):
    (source / name).write_text("".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in rows))
write("components.ndjson", [{key:metadata[char][key] for key in ("character", "decomposition", "matches")} for char in sorted(components)])
write("strokes.ndjson", [{key:graphics[char][key] for key in ("character", "strokes")} for char in sorted(characters) if char in graphics])
print(f"Retained {len(characters & graphics.keys())} drawings and {len(components)} components from pinned source.")
