#!/usr/bin/env python3
"""One-time import of CC0 Cangjie shape drawings from Wikimedia Commons.

Pass a saved copy of the Wikibooks auxiliary-shape table to --source. The
published site uses the checked-in CSV and thumbnail assets; builds need no network.
"""

import argparse
import csv
import json
import re
import time
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADERS = {"User-Agent": "ManchaiRootGuide/1.0 (educational site; public CC0 assets)"}


def fetch(url):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(2 ** attempt)


def clean_name(value):
    return re.sub(r"^-\{|\}-$", "", value).strip()


def selected_shapes(source, codes, frequency):
    table = source.split("{| class=wikitable", 1)[1].split("|}", 1)[0]
    current = ""
    selected = defaultdict(list)
    for row in table.split("\n|-\n")[1:]:
        match = re.search(r'\| rowspan="\d+" \| ([A-WY])\n', row)
        if match:
            current = match.group(1)
        elif re.search(r"^\| R\n", row, re.M):
            current = "R"
        first = next((line for line in row.splitlines() if "[[Image:cjrm-" in line), "")
        names = list(dict.fromkeys(re.findall(r"cjrm-([a-wy]\d+)\.svg", first)))
        if not names or not current or names[0][0] != current.lower():
            continue
        examples = [(name, clean_name(label)) for name, label in re.findall(
            r"cjem-([a-z]\d+)-\d+\.svg\|30px\|([^\]]+)", row
        )]
        valid = lambda item: len(item[1]) == 1 and item[1] in codes and current in codes[item[1]]
        for shape in names:
            if shape == f"{current.lower()}0" or shape in {item[0] for item in selected[current]}:
                continue
            same = [item for item in examples if item[0] == shape and valid(item)]
            pool = same or [item for item in examples if valid(item)]
            if not pool:
                raise ValueError(f"No verified example for {shape}")
            example = max(pool, key=lambda item: frequency[item[1]])[1]
            selected[current].append((shape, example, bool(same)))
    if sum(len(items) for items in selected.values()) != 191:
        raise ValueError("Expected all 191 auxiliary drawings in the source table")
    return selected


def commons_urls(names):
    urls = {}
    for offset in range(0, len(names), 40):
        batch = names[offset:offset + 40]
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "url|extmetadata", "iiurlwidth": "120",
            "titles": "|".join(f"File:Cjrm-{name}.svg" for name in batch),
        })
        payload = json.loads(fetch("https://commons.wikimedia.org/w/api.php?" + params))
        for page in payload["query"]["pages"].values():
            info = page.get("imageinfo", [{}])[0]
            if info.get("extmetadata", {}).get("LicenseShortName", {}).get("value") != "CC0":
                raise ValueError(f"Shape is not CC0: {page['title']}")
            name = re.search(r"Cjrm-([a-wy]\d+)\.svg", page["title"], re.I).group(1).lower()
            urls[name] = info["thumburl"]
    if set(urls) != set(names):
        raise ValueError("Some Commons shapes are missing")
    return urls


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    corpus = json.loads((ROOT / "data/learning-data.js").read_text(encoding="utf-8").split("window.MANCHAI_DATA=", 1)[1].rstrip(";\n"))
    frequency = Counter("".join(corpus["words"][:10_000]))
    selected = selected_shapes(args.source.read_text(encoding="utf-8"), corpus["codes"], frequency)
    rows = [(code, shape, example, direct) for code in "ABCDEFGHIJKLMNOPQRSTUVWY" for shape, example, direct in selected[code]]
    names = [shape for _, shape, _, _ in rows]
    urls = commons_urls(names)
    cache = Path(tempfile.gettempdir()) / "manchai-cc0-shapes"
    cache.mkdir(exist_ok=True)
    def download(name):
        target = cache / f"{name}.png"
        if not target.exists():
            target.write_bytes(fetch(urls[name]))
        return target.read_bytes()
    with ThreadPoolExecutor(max_workers=2) as pool:
        files = dict(zip(names, pool.map(download, names)))
    target_dir = ROOT / "assets/root-shapes"
    target_dir.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError(f"Unexpected thumbnail format for {name}")
        (target_dir / f"{name}.png").write_bytes(content)
    with (ROOT / "data/root-guide.csv").open("w", encoding="utf-8", newline="") as output:
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(("key", "shape", "example", "direct"))
        writer.writerows(rows)
    print(f"Imported {len(rows)} CC0 shape examples into local thumbnail assets and CSV.")


if __name__ == "__main__":
    main()
