"""Notion "Speaker notes (bullets)" page (its <content> block saved as markdown, verbatim) → <aside class="notes"> HTML + data-at from the per-slide targets.
Usage: python3 -I tools/notes_from_bullets.py <bullets.md> deck/public/index.html   (asserts ▶ count == data-clicks per slide)"""
import html, pathlib, re, sys
md = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
IDS = {"S3": "s3a"}  # Notion "S3" = deck s3a (S3a + S3b)
def unesc(t): return re.sub(r"\\([~$\[\]_*])", r"\1", t)
def inline(t):
    t = html.escape(unesc(t), quote=False)
    t = t.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    return t.replace("▶", '<i class="clk">▶</i>')
secs = {}
for block in re.split(r"^### ", md, flags=re.M)[1:]:
    head, *lines = block.rstrip("\n").split("\n")
    parts = [p.strip() for p in head.split(" · ")]
    sid = IDS.get(parts[0], parts[0].lower())
    meta = " · ".join(parts[1:])
    dur = next((p for p in parts[1:] if re.fullmatch(r"\d+:\d\d", p)), None)
    items = []  # (depth, text)
    for l in lines:
        if not l.strip(): continue
        m = re.match(r"^( *)- (.*)$", l); assert m, (sid, l)
        items.append((len(m.group(1)) // 2, m.group(2)))
    # nested list HTML
    out, depth = ["<ul>"], 0
    for i, (d, t) in enumerate(items):
        if d > depth: out[-1] = out[-1][:-5]; out.append("<ul>"); depth = d  # open nested inside previous <li>
        while d < depth: out.append("</ul></li>"); depth -= 1
        out.append("<li>" + inline(t) + "</li>")
    while depth > 0: out.append("</ul></li>"); depth -= 1
    out.append("</ul>")
    secs[sid] = {"meta": meta, "dur": dur, "html": '<p class="nh">' + html.escape(meta, quote=False) + "</p>\n" + "\n".join(out), "clk": "".join(t for _, t in items).count("▶")}

path = pathlib.Path(sys.argv[2]); s = path.read_text(encoding="utf-8")
order = re.findall(r'<section class="slide" id="([^"]+)"', s)
assert set(order) == set(secs), (set(order) ^ set(secs))
t = 0
for sid in order:
    sec = secs[sid]
    a = re.search(r'<section class="slide" id="%s"([^>]*)>' % re.escape(sid), s)
    attrs = a.group(1)
    clicks = int((re.search(r'data-clicks="(\d+)"', attrs) or [0, 0])[1])
    assert sec["clk"] == clicks, (sid, "▶", sec["clk"], "clicks", clicks)
    if sid != "s0":
        at = "%d:%02d" % divmod(t, 60)
        attrs2 = re.sub(r'data-at="[^"]*"', 'data-at="%s"' % at, attrs)
        s = s.replace(a.group(0), '<section class="slide" id="%s"%s>' % (sid, attrs2), 1)
        m, ss = sec["dur"].split(":"); t += int(m) * 60 + int(ss)
    pat = re.compile(r'(<section class="slide" id="%s"[^>]*>.*?<aside class="notes">)(.*?)(</aside>)' % re.escape(sid), re.S)
    assert len(pat.findall(s)) == 1, sid
    s = pat.sub(lambda m_: m_.group(1) + "\n" + sec["html"] + "\n" + m_.group(3), s)
path.write_text(s, encoding="utf-8")
print("slides", len(order), "· total %d:%02d" % divmod(t, 60), "· ▶ == clicks on all")
print(" ".join("%s@%s" % (sid, re.search(r'id="%s"[^>]*data-at="([^"]*)"' % sid, s).group(1)) for sid in order))
