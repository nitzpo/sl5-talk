"""Optimize assets/ (Gemini originals) into deck/public/img/*.webp for the deck.

Picks the best available source per image: full-res (.jpg/.png) > .lowres.webp > .screenshot.png.
Crops near-black letterbox bars, caps size (16:9 → 1920 wide, 1:1 → 1080), WebP q=82.
    python3 -I tools/build_assets.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "assets", ROOT / "deck" / "public" / "img"
RANK = {"": 0, ".lowres": 1, ".screenshot": 2}  # lower = better
NAME = re.compile(r"^(\d\d-[a-z0-9-]+?)(\.lowres|\.screenshot)?\.(jpg|jpeg|png|webp)$")


def pick_sources() -> dict[str, Path]:
    best: dict[str, tuple[int, Path]] = {}
    for p in sorted(SRC.iterdir()):
        m = NAME.match(p.name)
        if not m:
            continue
        stem, rank = m[1], RANK[m[2] or ""]
        if stem not in best or rank < best[stem][0]:
            best[stem] = (rank, p)
    return {k: v[1] for k, v in best.items()}


def crop_bars(im: Image.Image, thresh: float = 4.0) -> Image.Image:
    """Remove near-black rows at top/bottom (letterbox)."""
    g = im.convert("L")
    w, h = g.size
    row = lambda y: ImageStat.Stat(g.crop((0, y, w, y + 1))).mean[0]
    top = next((y for y in range(h // 3) if row(y) > thresh), 0)
    bot = next((y for y in range(h - 1, h - h // 3, -1) if row(y) > thresh), h - 1)
    if top > 4 or bot < h - 5:
        return im.crop((0, top, w, bot + 1))
    return im


def main() -> int:
    DST.mkdir(parents=True, exist_ok=True)
    for stem, src in pick_sources().items():
        im = Image.open(src)
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        im = crop_bars(im)
        w, h = im.size
        cap = 1080 if abs(w / h - 1) < 0.05 else 1920
        if max(w, h) > cap:
            s = cap / max(w, h)
            im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
        out = DST / f"{stem}.webp"
        im.save(out, "WEBP", quality=82, method=6)
        print(f"{src.name:30s} {w}x{h} -> {out.name} {im.size[0]}x{im.size[1]} {out.stat().st_size // 1024} KB")
    build_sim()
    return 0


def build_sim() -> None:
    """assets/sim.gif (simulator screen capture) -> img/sim.mp4.
    Crops to the hexagon map only: the right panel and the year bar show scenario numbers
    (breach %, SL score, budget), and the simulator must stay vague on stage."""
    src = SRC / "sim.gif"
    if not src.exists():
        return
    out = DST / "sim.mp4"
    # 1000x410 capture: keep x 70..780, y 24..402 (drops right panel, top bar, zoom control); 2x upscale; 0.6x speed
    vf = "crop=710:378:70:24,scale=1420:-2:flags=lanczos,setpts=PTS/0.6,fps=30"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-crf", "20", "-movflags", "+faststart", str(out)], check=True)
    webm = DST / "sim.webm"  # VP9 too: some Chromium builds lack H.264
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34",
                    "-row-mt", "1", str(webm)], check=True)
    print(f"{src.name:30s} -> {out.name} {out.stat().st_size // 1024} KB + {webm.name} {webm.stat().st_size // 1024} KB (cropped: no scenario numbers)")


if __name__ == "__main__":
    sys.exit(main())
