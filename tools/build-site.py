"""Copy only public website files into Cloudflare's static asset directory."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
FILES = (
    "index.html", "learn.html", "roots.html", "practice.html", "404.html", "robots.txt", "sitemap.xml",
    "styles.css", "favicon.svg", "shared.js", "script.js", "roots.js", "typing-core.js", "extended.js",
    "data/lesson-data.js", "data/root-guide-data.js", "data/code-data.js", "data/reading-data.js",
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
shutil.copytree(ROOT / "licenses", DIST / "licenses")
print(f"Built {DIST} with {len(list(DIST.rglob('*')))} public files and directories.")
