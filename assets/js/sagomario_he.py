#!/usr/bin/env python3
"""Estrae dal sagomario ArcelorMittal (Materiale/.../Acciaio_Sagomario (Arcelor).pdf) i profili HEA e HEB
(h, b, A, G, i_y, i_z) e stampa gli array JavaScript RT.HE usati da calc.js. Controlli: massa = A*7850, i = sqrt(I/A)."""
import re, json
import pymupdf
PDF = "../../../../Materiale/Laboratorio Architettura/Slides/Acciaio_Sagomario (Arcelor).pdf"
d = pymupdf.open(PDF)
NUM = re.compile(r"^-?\d+(?:,\d+)?$")
def num(s): return float(s.replace(",", "."))
def records(pages, pat):
    out, cur = {}, None
    for p in pages:
        for raw in d[p - 1].get_text().split("\n"):
            line = raw.strip(); m = re.fullmatch(pat, line)
            if m: cur = re.sub(r"\s+", " ", m.group(1)).strip(); out.setdefault(cur, []); continue
            if cur is None: continue
            for tk in line.split():
                if NUM.match(tk): out[cur].append(tk)
    return out
pat = r"(HE \d+ (?:A|B|M))\s*[*]?"
dim = records([26, 28, 30, 32], pat); pro = records([27, 29, 31, 33], pat)
SIZES = [100,120,140,160,180,200,220,240,260,280,300,320,340,360,400,450,500,550,600]
res = {"HEA": [], "HEB": []}
for sf in "AB":
    for sz in SIZES:
        k = f"HE {sz} {sf}"
        dd, pp = dim[k][:9], pro[k][:13]
        assert len(dd) == 9 and len(pp) >= 10, (k, len(dd), len(pp))
        G, h, b, tw, tf, r, A, hi, d_ = [num(x) for x in dd]
        Iy, Wel, Wpl, iy, Avz, Iz, Welz, Wplz, iz = [num(x) for x in pp[1:10]]
        assert abs(G - A * 7850e-4) / G < 0.012, (k, "massa")
        assert abs(iz - (Iz / A) ** .5) / iz < 0.015 and abs(iy - (Iy / A) ** .5) / iy < 0.012, (k, "i")
        res["HE" + sf].append([f"HE{sf} {sz}", h, b, A, G, iy, iz])
for sf in ("HEA", "HEB"):
    print(f"// {sf} [nome, h mm, b mm, A cm2, G kg/m, i_y cm, i_z cm]")
    print(f"{sf}: [")
    print(",\n".join("      " + json.dumps(r, ensure_ascii=False).replace('"', "'") for r in res[sf]))
    print("    ]")
