"""Build the offline backup: one self-contained HTML file (CSS, JS, fonts, images, video inlined).

No poll server: every poll slide shows its show-of-hands fallback. Works from file:// (USB stick, desktop).
    python3 -I tools/build_offline.py            # → deck/public/offline.html (also served by the deck host)
    python3 -I tools/build_offline.py --check    # exit 1 if the committed copy is stale
Rerun after any deck change (the file is committed so it can be downloaded from <deck host>/offline.html).
"""
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "deck" / "public"
OUT = PUB / "offline.html"
MIME = {".woff2": "font/woff2", ".webp": "image/webp", ".webm": "video/webm", ".mp4": "video/mp4"}


def data_uri(path: Path) -> str:
    return f"data:{MIME[path.suffix]};base64,{base64.b64encode(path.read_bytes()).decode()}"


def css(href: str) -> str:
    path = PUB / href
    text = path.read_text()
    # url(../fonts/x.woff2) → data URI
    return re.sub(r"url\(([^)\"']+)\)", lambda m: f"url({data_uri((path.parent / m.group(1)).resolve())})", text)


def script(src: str) -> str:
    return (PUB / src).read_text().replace("</script", "<\\/script")


def main() -> int:
    html = (PUB / "index.html").read_text()
    html = re.sub(r'<link rel="preload"[^>]*>\n?', "", html)
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: f"<style>\n{css(m.group(1))}\n</style>", html)
    imgs = {p.stem: data_uri(p) for p in sorted((PUB / "img").glob("*.webp"))}
    html = re.sub(r'src="img/(sim\.(?:webm|mp4))"', lambda m: f'src="{data_uri(PUB / "img" / m.group(1))}"', html)
    boot = "<script>window.SL5_OFFLINE = true; window.SL5_IMG = {\n" + ",\n".join(
        f'"{k}": "{v}"' for k, v in imgs.items()) + "\n};</script>\n"
    first = True

    def inline(m: re.Match) -> str:
        nonlocal first
        out = (boot if first else "") + f"<script>/* {m.group(1)} */\n{script(m.group(1))}\n</script>"
        first = False
        return out

    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    html = html.replace("<title>", "<title>OFFLINE · ", 1)
    markup = re.sub(r"<(script|style)\b.*?</\1>", "", html, flags=re.S)  # check tags only, not code
    left = re.findall(r'(?:src|href)="(?!data:|#|https?:)[^"]+"', markup)
    if left:
        print("unresolved local references:", left, file=sys.stderr)
        return 1
    if "--check" in sys.argv:  # CI / pre-merge: is the committed offline copy current?
        ok = OUT.exists() and OUT.read_text() == html
        print("offline.html " + ("up to date" if ok else "STALE: run python3 -I tools/build_offline.py"))
        return 0 if ok else 1
    OUT.write_text(html)
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1e6:.1f} MB, {len(imgs)} images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
