"""Build original sentence and paragraph lessons from editable TSV sources."""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def rows(name, width):
    with (DATA / name).open(encoding="utf-8", newline="") as source:
        result = list(csv.reader(source, delimiter="\t"))
    if not result or any(len(row) != width or any(not cell.strip() for cell in row) for row in result):
        raise ValueError(f"Invalid or empty lesson row in {name}")
    return result


sentences = [{"category": category, "text": text} for category, text in rows("sentences.tsv", 2)]
paragraphs = [
    {"level": level, "category": category, "title": title, "text": text}
    for level, category, title, text in rows("paragraphs.tsv", 4)
]
code_hints = {}
for character, codes in rows("code-hints.tsv", 2):
    variants = codes.split()
    if len(character) != 1 or character in code_hints or not all(re.fullmatch(r"[A-Z]{1,5}", code) for code in variants):
        raise ValueError(f"Invalid code hint for {character}")
    code_hints[character] = variants
if len({item["text"] for item in sentences}) != len(sentences):
    raise ValueError("Duplicate sentence text")
if len({item["text"] for item in paragraphs}) != len(paragraphs):
    raise ValueError("Duplicate paragraph text")
if {item["level"] for item in paragraphs} != {"起步", "進一步", "完整篇章"}:
    raise ValueError("Unexpected paragraph levels")

target = DATA / "reading-data.js"
target.write_text(
    "// Generated from data/sentences.tsv, data/paragraphs.tsv, and data/code-hints.tsv.\n"
    + "window.MANCHAI_READING="
    + json.dumps({"sentences": sentences, "paragraphs": paragraphs, "codeHints": code_hints}, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(f"Built {len(sentences)} sentences and {len(paragraphs)} paragraphs.")
