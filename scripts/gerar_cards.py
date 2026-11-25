#!/usr/bin/env python3
"""Gera assets/cards/<repo>.svg (600x300) a partir de dados/vitrine.json."""
import base64
import json
import re
import textwrap
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paleta import GRUPOS, pintar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "dados" / "vitrine.json").read_text(encoding="utf-8"))
FONTE = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
ACENTOS = [("@roxo@", "@magenta@"), ("@azul@", "@magenta_claro@"), ("@magenta_claro@", "@azul@"), ("@magenta@", "@roxo@")]
LINGUA = {"Ruby": "@lang_ruby@", "Node": "@lang_node@", "TypeScript": "@lang_typescript@", "Python": "@lang_python@", "C#": "@lang_csharp@", "HTML/JS": "@lang_html@"}


# os repositórios da vitrine que têm identidade própria (docs/identidade.json + docs/logo.svg)
VITRINE = RAIZ.parent / "vitrine"
PASTAS = {"breather": "freio", "penny": "centavos", "plotline": "planta-svg", "gatehouse": "mcp-leitura",
          "breeze": "ventoinha-macbook", "shopkeep": "discord-loja-bot"}


def identidade(repo):
    local = RAIZ / "dados" / "identidades" / f"{repo}.json"
    if local.exists():  # repositórios antigos: a identidade mora aqui no perfil
        ident = json.loads(local.read_text(encoding="utf-8"))
        ident["_logo"] = base64.b64encode((local.parent / ident["logo"]).read_bytes()).decode()
        return ident
    pasta = PASTAS.get(repo)
    if not pasta:
        return None
    arq = VITRINE / pasta / "docs" / "identidade.json"
    if not arq.exists():
        return None
    ident = json.loads(arq.read_text(encoding="utf-8"))
    logo = VITRINE / pasta / ident.get("logo", "docs/logo.svg")
    ident["_logo"] = base64.b64encode(logo.read_bytes()).decode() if logo.exists() else None
    return ident


def luminancia(hexa):
    h = hexa.lstrip("#")[:6]
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def card_proprio(r, ident):
    p = ident["paleta"]
    fundo, prim, sec, texto, acento = p["fundo"], p["primaria"], p["secundaria"], p["texto"], p.get("acento", p["primaria"])
    fonte = esc(ident.get("fonte", FONTE).split(" / ")[0]).replace('"', "'")  # "título / mono": o cartão usa a do título
    nome = r.get("nome", r["repo"])
    tam = min(38, int(380 / (len(nome) * 0.6)))
    linhas = textwrap.wrap(r["desc"], 44)[:4]
    desc = "".join(
        f'<text x="32" y="{132 + k * 24}" font-size="16" fill="{texto}">{esc(l)}</text>' for k, l in enumerate(linhas)
    )
    chips, x = [], 32
    todos = [r["lang"]] + r["stack"] + ([r["licenca"]] if r.get("licenca") else [])
    for c in todos:
        w = int(len(c) * 8.2 + 22)
        if x + w > 568:
            break
        chips.append(
            f'<g><rect x="{x}" y="244" width="{w}" height="26" rx="13" fill="{prim}" fill-opacity=".14" stroke="{prim}" stroke-opacity=".8"/>'
            f'<text x="{x + w / 2:.0f}" y="262" text-anchor="middle" font-size="13" fill="{texto}">{esc(c)}</text></g>'
        )
        x += w + 8
    claro = luminancia(fundo) > 0.45
    logo = (f'<image href="data:image/svg+xml;base64,{ident["_logo"]}" x="470" y="26" width="104" height="104"/>'
            if ident.get("_logo") else "")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" role="img" aria-label="{esc(nome)}: {esc(r["desc"])}">
<title>{esc(nome)}</title>
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{prim}"/><stop offset="1" stop-color="{acento}"/></linearGradient>
<clipPath id="c"><rect width="600" height="300" rx="18"/></clipPath>
</defs>
<style>
svg{{font-family:{fonte}}}
.b{{animation:corre 6s linear infinite}}
@keyframes corre{{from{{stroke-dashoffset:1000}}to{{stroke-dashoffset:0}}}}
@media (prefers-reduced-motion:reduce){{.b{{animation:none}}}}
</style>
<g clip-path="url(#c)">
<rect width="600" height="300" fill="{fundo}"/>
<rect width="600" height="6" fill="url(#g)"/>
<circle cx="522" cy="78" r="70" fill="{sec}" fill-opacity="{'.10' if claro else '.16'}"/>
{logo}
<text x="32" y="46" font-size="13" fill="{texto}" fill-opacity=".72">github.com/Dimasaas/{esc(r["repo"])}</text>
<text x="32" y="94" font-size="{tam}" font-weight="700" fill="{prim if not claro else texto}">{esc(nome)}</text>
{desc}
{"".join(chips)}
</g>
<rect x="1.5" y="1.5" width="597" height="297" rx="17" fill="none" stroke="{prim}" stroke-opacity=".45" stroke-width="1.5"/>
<rect class="b" x="1.5" y="1.5" width="597" height="297" rx="17" fill="none" stroke="url(#g)" stroke-width="3" pathLength="1000" stroke-dasharray="140 860"/>
</svg>
'''


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def card(i, r):
    a1, a2 = ACENTOS[i % 4]
    nome = r.get("nome", r["repo"])
    tam = min(38, int(500 / (len(nome) * 0.6)))
    linhas = textwrap.wrap(r["desc"], 46)[:4]
    desc = "".join(
        f'<text x="32" y="{122 + k * 24}" font-size="16" fill="@texto@">{esc(l)}</text>' for k, l in enumerate(linhas)
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
        cor = "@magenta@" if ultimo else a1
        fundo = "@magenta@" if ultimo else a1
        chips.append(
            f'<g><rect x="{x}" y="244" width="{w}" height="26" rx="13" fill="{fundo}" fill-opacity=".16" stroke="{cor}" stroke-opacity=".7"/>'
            f'<text x="{x + w / 2:.0f}" y="262" text-anchor="middle" font-size="13" fill="@texto@">{esc(c)}</text></g>'
        )
        x += w + 8
    cl = LINGUA.get(r["lang"], "@magenta_claro@")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" role="img" aria-label="{esc(nome)}: {esc(r["desc"])}">
<title>{esc(nome)}</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="@fundo_profundo@"/><stop offset="1" stop-color="@fundo@"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{a1}"/><stop offset="1" stop-color="{a2}"/></linearGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="@texto@"/><stop offset="1" stop-color="@texto@"/></linearGradient>
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
<text x="32" y="42" font-size="13" fill="@texto_secundario@">github.com/Dimasaas/{esc(r["repo"])}</text>
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
        ident = identidade(r["repo"])
        svg = card_proprio(r, ident) if ident else pintar(card(i, r))
        (RAIZ / "assets" / "cards" / f"{r['repo']}.svg").write_text(svg, encoding="utf-8")
        print(r["repo"], "identidade própria" if ident else "paleta do perfil")
    print(len(V["repos"]), "cartões")
