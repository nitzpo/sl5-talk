"""Build the phone script page (artifact) from deck/public/index.html speaker notes (v8: HTML bullets).
Usage: python3 -I build.py <deck index.html> <out.html> <commit> [<bullets_v8.md for the legend>]"""
import html, json, re, sys
src, out, commit = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding="utf-8").read()
ALLOWED = re.compile(r'</?(ul|li|b)>|<p class="nh">|</p>|<i class="clk">|</i>|<br ?/?>')
def sanitize(h):
    for tag in re.findall(r"<[^>]*>", h):
        assert ALLOWED.fullmatch(tag), ("unexpected tag in notes", tag)
    return h.strip()
slides = []
for sid, attrs, body in re.findall(r'<section class="slide" id="([^"]+)"([^>]*)>(.*?)</section>', s, re.S):
    a = dict(re.findall(r'data-([\w-]+)="([^"]*)"', attrs))
    m = re.search(r'<aside class="notes"[^>]*>(.*?)</aside>', body, re.S)
    slides.append({"id": sid, "title": html.unescape(a.get("title", sid)), "at": a.get("at", ""), "clicks": int(a.get("clicks", 0)),
                   "drop": a.get("cut") == "drop", "notes": sanitize(m.group(1)) if m else ""})
legend = ""
if len(sys.argv) > 4:
    intro = open(sys.argv[4], encoding="utf-8").read().split("\n### ")[0].strip()
    intro = re.sub(r"\\([~$\[\]_*])", r"\1", intro)
    intro = html.escape(intro, quote=False).replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>").replace("&lt;br /&gt;", "<br>")
    legend = sanitize(intro.replace("▶", '<i class="clk">▶</i>'))
tpl = open(sys.argv[0].replace("build.py", "page.html"), encoding="utf-8").read()
data = json.dumps({"commit": commit, "legend": legend, "slides": slides}, ensure_ascii=False).replace("</", "<\\/")
open(out, "w", encoding="utf-8").write(tpl.replace("__DATA__", data))
print(len(slides), "slides,", sum(x["clicks"] + 1 for x in slides), "steps")
