#!/usr/bin/env python3
"""Gera assets/cards/<repo>.svg (600x300) a partir de dados/vitrine.json."""
import json
import textwrap
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "dados" / "vitrine.json").read_text(encoding="utf-8"))
FONTE = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
ACENTOS = [("#7C4DFF", "#00E5FF"), ("#2979FF", "#B388FF"), ("#B388FF", "#2979FF"), ("#00E5FF", "#7C4DFF")]
LINGUA = {"Ruby": "#CC342D", "Node": "#68a063", "TypeScript": "#3178C6", "Python": "#3572A5", "C#": "#9B4F96", "HTML/JS": "#E34C26"}


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def card(i, r):
    a1, a2 = ACENTOS[i % 4]
    nome = r.get("nome", r["repo"])
    tam = min(38, int(500 / (len(nome) * 0.6)))
    linhas = textwrap.wrap(r["desc"], 46)[:4]
    desc = "".join(
        f'<text x="32" y="{122 + k * 24}" font-size="16" fill="#cfc4f5">{esc(l)}</text>' for k, l in enumerate(linhas)
    )
    chips, x = [], 32
    todos = [r["lang"]] + r["stack"]
    if r.get("licenca"):
        todos.append(r["licenca"])
    for k, c in enumerate(todos):
        w = int(len(c) * 8.2 + 22)
        if x + w > 568:
            break
        ultimo = r.get("licenca") and c == r["licenca"]
        cor = "#00E5FF" if ultimo else a1
        fundo = "#00E5FF" if ultimo else a1
        chips.append(
            f'<g><rect x="{x}" y="244" width="{w}" height="26" rx="13" fill="{fundo}" fill-opacity=".16" stroke="{cor}" stroke-opacity=".7"/>'
            f'<text x="{x + w / 2:.0f}" y="262" text-anchor="middle" font-size="13" fill="#efe9ff">{esc(c)}</text></g>'
        )
        x += w + 8
    cl = LINGUA.get(r["lang"], "#B388FF")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" role="img" aria-label="{esc(nome)}: {esc(r["desc"])}">
<title>{esc(nome)}</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0624"/><stop offset="1" stop-color="#08143a"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{a1}"/><stop offset="1" stop-color="{a2}"/></linearGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9ccff"/></linearGradient>
<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="{a1}" stroke-opacity=".09"/></pattern>
<clipPath id="c"><rect width="600" height="300" rx="18"/></clipPath>
</defs>
<style>
svg{{font-family:{FONTE}}}
.b{{animation:corre 5s linear infinite}}
@keyframes corre{{from{{stroke-dashoffset:1000}}to{{stroke-dashoffset:0}}}}
.s{{animation:varre 6s ease-in-out infinite}}
@keyframes varre{{from{{transform:translateX(-300px)}}to{{transform:translateX(700px)}}}}
.pt{{animation:pisca 1.2s steps(1) infinite}}
@keyframes pisca{{50%{{opacity:0}}}}
</style>
<g clip-path="url(#c)">
<rect width="600" height="300" fill="url(#bg)"/>
<rect width="600" height="300" fill="url(#p)"/>
<rect class="s" width="260" height="300" fill="{a1}" opacity=".10"/>
<text x="32" y="42" font-size="13" fill="#8f7fd1">github.com/Dimasaas/{esc(r["repo"])}</text>
<circle cx="560" cy="37" r="6" fill="{cl}"/>
<text x="32" y="84" font-size="{tam}" font-weight="700" fill="url(#t)">{esc(nome)}<tspan class="pt" fill="{a2}">_</tspan></text>
{desc}
{"".join(chips)}
</g>
<rect x="1.5" y="1.5" width="597" height="297" rx="17" fill="none" stroke="{a1}" stroke-opacity=".35" stroke-width="1.5"/>
<rect class="b" x="1.5" y="1.5" width="597" height="297" rx="17" fill="none" stroke="url(#g)" stroke-width="3" pathLength="1000" stroke-dasharray="190 810"/>
</svg>
'''


if __name__ == "__main__":
    (RAIZ / "assets" / "cards").mkdir(parents=True, exist_ok=True)
    for i, r in enumerate(V["repos"]):
        (RAIZ / "assets" / "cards" / f"{r['repo']}.svg").write_text(card(i, r), encoding="utf-8")
    print(len(V["repos"]), "cartões")
