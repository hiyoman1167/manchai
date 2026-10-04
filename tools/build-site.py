"""Copy only public website files into Cloudflare's static asset directory."""

from pathlib import Path
import shutil
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
FILES = (
    "index.html", "learn.html", "roots.html", "practice.html", "chat.html", "404.html", "robots.txt", "sitemap.xml",
    "styles.css", "favicon.svg", "shared.js", "script.js", "roots.js", "typing-core.js", "extended.js", "glyph-diagrams.js",
    "data/lesson-data.js", "data/root-guide-data.js", "data/code-data.js", "data/reading-data.js", "data/diagram-data.js", "data/practice-copy.js", "data/progress-copy.js",
    "chat.css", "chat.js", "data/chat-data.js",
)

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
for name in FILES:
    source = ROOT / name
    destination = DIST / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
for source in sorted((ROOT / "data").glob("vocab-part-*.js")):
    shutil.copy2(source, DIST / "data" / source.name)
shutil.copytree(ROOT / "assets/root-shapes", DIST / "assets/root-shapes")
shutil.copytree(ROOT / "assets/glyphs", DIST / "assets/glyphs")
shutil.copytree(ROOT / "licenses", DIST / "licenses")
urls = ET.parse(ROOT / "sitemap.xml").findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
(DIST / "sitemap.txt").write_text("\n".join(url.text for url in urls) + "\n", encoding="utf-8")
print(f"Built {DIST} with {len(list(DIST.rglob('*')))} public files and directories.")
