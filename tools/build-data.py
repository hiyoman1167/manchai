#!/usr/bin/env python3
"""Build the offline learning data from licensed upstream sources.

Usage:
  python3 tools/build-data.py --unihan /path/Unihan.zip \
      --essay /path/essay.txt --rime /path/cangjie5.base.dict.yaml
"""
from __future__ import annotations

import argparse
import json
import re
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALID_CODE = re.compile(r"^[A-Z]{1,5}$")
VALID_QUICK = re.compile(r"^[A-WY]{1,2}$")
HAN = re.compile(r"[\u3400-\u9fff]")


def quick(full: str) -> str:
    return full if len(full) == 1 else full[0] + full[-1]


def read_unihan(path: Path) -> dict[str, str]:
    codes: dict[str, str] = {}
    with zipfile.ZipFile(path) as archive:
        lines = archive.read("Unihan_DictionaryLikeData.txt").decode("utf-8").splitlines()
    for line in lines:
        if "\tkCangjie\t" not in line:
            continue
        codepoint, _, values = line.split("\t")
        for code in values.split():
            if VALID_CODE.fullmatch(code) and VALID_QUICK.fullmatch(quick(code)):
                codes[chr(int(codepoint[2:], 16))] = code
                break
    return codes


def read_rime(path: Path) -> dict[str, str]:
    codes: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or len(parts[0]) != 1:
            continue
        code = parts[1].upper()
        if VALID_CODE.fullmatch(code) and VALID_QUICK.fullmatch(quick(code)):
            codes.setdefault(parts[0], code)
    return codes


def read_seeds(path: Path, codes: dict[str, str]) -> list[dict]:
    seen: set[str] = set("二三五林森昌晶品朋明本休仁全合江倉色學頡出上下字宇好他今們你和看家炎圭右狗貓腦樂日月金木水火土竹戈十大中一弓人心手口尸廿山女田卜")
    chapters: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        number, title, description, sample = line.split("\t")
        entries: list[list[str]] = []
        for char in sample:
            if char not in seen and char in codes and HAN.fullmatch(char):
                entries.append([char, codes[char]])
                seen.add(char)
        if entries:
            chapters.append({"number": int(number), "title": title, "description": description, "entries": entries})
    return chapters


def read_sentences(path: Path, codes: dict[str, str]) -> list[dict]:
    sentences: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        category, text = line.split("\t", 1)
        sentences.append({"category": category, "text": text})
    return sentences


def read_hk_words(path: Path, codes: dict[str, str]) -> list[str]:
    words: list[str] = []
    for word in path.read_text(encoding="utf-8").splitlines():
        word = word.strip()
        if not word:
            continue
        if not 2 <= len(word) <= 4 or any(char not in codes for char in word):
            raise ValueError(f"HK starter word has unsupported character: {word}")
        if word not in words:
            words.append(word)
    return words


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--unihan", type=Path, required=True)
    parser.add_argument("--essay", type=Path, required=True)
    parser.add_argument("--rime", type=Path, required=True)
    args = parser.parse_args()

    unicode_codes = read_unihan(args.unihan)
    rime_codes = read_rime(args.rime)
    # Rime verifies the Quick result for the overlap. Version-dependent
    # codes are omitted from this beginner curriculum rather than guessed.
    codes = {char: full for char, full in unicode_codes.items()
             if char not in rime_codes or quick(full) == quick(rime_codes[char])}
    chapters = read_seeds(ROOT / "data/lesson-seeds.tsv", codes)
    sentences = read_sentences(ROOT / "data/sentences.tsv", codes)
    hk_words = read_hk_words(ROOT / "data/hk-words.txt", codes)

    weighted: dict[str, int] = {}
    for line in args.essay.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        word = parts[0]
        try:
            weight = int(parts[1])
        except ValueError:
            continue
        if len(word) < 2 or not all(HAN.fullmatch(char) and char in codes for char in word):
            continue
        weighted[word] = max(weight, weighted.get(word, -1))

    ranked = sorted(weighted, key=lambda word: (-weighted[word], word))
    hk_set = set(hk_words)
    vocabulary = hk_words + [word for word in ranked if word not in hk_set]
    characters = set("".join(vocabulary))
    for chapter in chapters:
        characters.update(char for char, _ in chapter["entries"])
    for sentence in sentences:
        characters.update(char for char in sentence["text"] if char in codes)
    for line in (ROOT / "data/paragraphs.tsv").read_text(encoding="utf-8").splitlines():
        for char in line.split("\t")[-1]:
            if char in codes:
                characters.add(char)
    characters.update("二三五林森昌晶品朋明本休仁全合江倉色學頡出上下字宇好他今們你和看家炎圭右狗貓腦樂")

    frequency = Counter()
    for word in vocabulary:
        frequency.update(set(word))
    groups: dict[str, list[str]] = {}
    for char in sorted(characters, key=lambda c: (-frequency[c], c)):
        groups.setdefault(quick(codes[char]), []).append(char)
    candidates = {code: "".join(items[:8]) for code, items in groups.items()}
    used_codes = {char: codes[char] for char in sorted(characters)}
    data = {
        "words": vocabulary,
        "codes": used_codes,
        "candidates": candidates,
        "chapters": chapters,
        "sentences": sentences,
        "hkCoreCount": len(hk_words),
    }
    target = ROOT / "data/learning-data.js"
    header = (
        f"// Generated by tools/build-data.py. Contains {len(vocabulary):,} entries from Rime Essay (LGPL-3.0) and original Hong Kong starter terms.\n"
        "// and character codes from Unicode Unihan (Unicode License v3). See licenses/ and README.md.\n"
    )
    target.write_text(header + "window.MANCHAI_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{target}: {len(vocabulary):,} vocabulary entries, {len(chapters)} chapters, "
          f"{sum(len(c['entries']) for c in chapters)} new characters, {len(sentences)} sentences, "
          f"{len(used_codes):,} coded characters")


if __name__ == "__main__":
    main()
