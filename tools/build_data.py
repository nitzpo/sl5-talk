"""Build deck/public/js/s10.gen.js (window.SL5_S10) for S10 from a local clone of github.com/nitzpo/sl5.

    git clone --depth 1 https://github.com/nitzpo/sl5 /tmp/sl5
    python3 -I tools/build_data.py /tmp/sl5

Output: {"groups": [{"name", "blocks": [..]}...] (47 blocks, 6 groups), "clauses": [...]} where clauses are short
requirement snippets from research/sl5_standard.txt (SL5 Task Force) and research/rand_full.txt (RAND RR-A2849-1).
"""
from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path

GROUPS = [  # (file suffix, display name) in deck order
    ("network", "Network"),
    ("machine", "Machine"),
    ("physical", "Physical"),
    ("personnel", "Personnel"),
    ("supply-chain", "Supply chain"),
    ("ai-specific", "AI-specific"),
]
REQ = re.compile(r"\b(must|shall|required?|requires|should|prohibit\w*|only)\b", re.I)
MAX_CLAUSES = 650

# Not requirements (Nov 14 review): copyright/permission boilerplate, bibliography fragments, quotes, meta/methodology
# text, attacker-side descriptions. Matched on the clause's start.
EXCLUDE = (
    "Despite uncertainties", "Because this is a relatively new field", "Searching for such opportunities",
    "There was significant variance", "We prioritize these requirements", "Communication about AI security",
    "Finding a bug there", "However, we highlight", "These levels (sometimes termed", "Unauthorized posting",
    "Multiple experts", "This option is available only", "The only unique requirement in this scenario",
    "This means that a purely empirical", "The decision of whether", "Another important question",
    "We expect that only a few", "Rather, they provide", "Security is a complex", "In addition, if the attack",
    "Frameworks for assessing", "An attack is considered", "If the employee believes", "In the SL3 benchmark",
    "Even after being patched", "Such direct undermining", "While we reference a standard",
    "The benchmarks will likely", "More advanced targeting", "Thus, we should expect", "We welcome discussions",
    "There are minimum length", "Exploiting Reported but Not", "If the password or security key",
    "This should be viewed as a benefit", "The victim of the perpetrated", "Goodin, Dan", "That need applies",
    "The security levels do not", "It is a partial overlay", "However, although the conclusions",
    "Note that this level does", "Step 4:", "We group the OC3", "Although the weights can be reproduced",
    "If AI systems rapidly", "This not only significantly", "Experts generally agreed", "However, beyond that",
    "This attack lies", "We should also expect", "Permission is required", "As with many aspects",
    "This type of attack", "The following questions", "Anthropic's CEO", "To be effective, both",
    "This standard represents", "It is very common", "This has significant implications",
    "This representation of RAND", "Specifically, while CMMC", "For others, it would require",
    "Capability Assessment", "This first revision", "In Figure", "Some relevant specifications",
    "This vector partially overlaps", "There is already at least one known case",
)
# S10 click 5 (bridge to S11): the SL5 Standard's own two-person-integrity line (SL5 Supplemental Guidance, PE-3),
# kept whole (not clipped) and placed mid-list so it starts near the centre of the flood.
PICK = re.compile(r"SL5 Supplemental Guidance: Only personnel with SenL-5 \(Custodial\) clearance may enter Red Zones "
                  r"unescorted, and two authorized individuals must be present at all times \(two-person integrity\)\.")


def clean(s: str) -> str:
    s = re.sub(r"\[\d+(,\s*\d+)*\]", "", s)  # citation markers
    s = s.replace("​", "").replace("●", "").strip(" \t-•–")
    return re.sub(r"\s+", " ", s).strip()


def clip(s: str, n: int = 150) -> str:
    return s if len(s) <= n else s[: s.rfind(" ", 0, n)].rstrip(",;:") + "…"


def clauses_from(text: str) -> list[str]:
    out: list[str] = []
    # 1) bullet items (key interventions etc.), joined across wrapped lines
    for m in re.finditer(r"●\s*(.+?)(?=\n\s*●|\n\s*\n|\Z)", text, re.S):
        out.append(clean(m.group(1)))
    # 2) requirement-like sentences
    flat = re.sub(r"\s*\n\s*", " ", text)
    for sent in re.split(r"(?<=[.;])\s+(?=[A-Z])", flat):
        if REQ.search(sent) and 40 <= len(sent) <= 400 and not re.search(r"https?://|Fig\.|Table \d|et al", sent):
            out.append(clean(sent))
    junk = re.compile(r"^(Assignment|Selection|Parameter Values|Organization-defined)|\w- \d+ |\bp\. \d+|^\d")
    return [clip(c) for c in out if 30 <= len(c) and not junk.search(c)]


def main() -> int:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/sl5")
    groups = []
    for suffix, name in GROUPS:
        items = json.loads((src / "app/public/data" / f"blocks-{suffix}.json").read_text())
        groups.append({"name": name, "blocks": [i["name"] for i in items]})
    n_blocks = sum(len(g["blocks"]) for g in groups)
    assert n_blocks == 47, n_blocks

    seen, clauses = set(), []
    for fname in ("sl5_standard.txt", "rand_full.txt"):
        for c in clauses_from((src / "research" / fname).read_text(errors="ignore")):
            key = c.lower()[:60]
            if key not in seen:
                seen.add(key)
                clauses.append(c)
    random.Random(5).shuffle(clauses)
    clauses = [c for c in clauses if not c.startswith(EXCLUDE)][:MAX_CLAUSES]
    std = re.sub(r"\s+", " ", (src / "research" / "sl5_standard.txt").read_text(errors="ignore"))
    pick = PICK.search(std)
    assert pick, "S10 pick clause not found in sl5_standard.txt"
    clauses.insert(len(clauses) // 2, pick.group(0))

    # a classic script (not JSON + fetch) so the offline copy works from file://
    out = Path(__file__).resolve().parent.parent / "deck/public/js/s10.gen.js"
    data = {"source": "github.com/nitzpo/sl5 (blocks-*.json, research/sl5_standard.txt, research/rand_full.txt)",
            "groups": groups, "clauses": clauses}
    out.write_text("// GENERATED by tools/build_data.py. Do not edit.\nwindow.SL5_S10 = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print(f"{n_blocks} blocks in {len(groups)} groups, {len(clauses)} clauses → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
