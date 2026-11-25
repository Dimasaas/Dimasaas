#!/usr/bin/env python3
"""Gera assets/orbita.svg a partir de dados/tecnologias.json (31 planetas em 3 anéis)."""
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paleta import GRUPOS, pintar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
D = json.loads((RAIZ / "dados" / "tecnologias.json").read_text(encoding="utf-8"))
FONTE = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
CX, CY = 640, 385
RAIOS = {1: 130, 2: 215, 3: 295}
VOLTA = {1: 110, 2: -170, 3: 240}  # segundos por volta (sinal = sentido)
CORES = GRUPOS


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def quebra(nome):
    """divide em até 2 linhas no espaço mais perto do meio quando passa de 14 letras."""
    if len(nome) <= 14 or " " not in nome:
        return [nome]
    meio = len(nome) / 2
    pos = min((i for i, c in enumerate(nome) if c == " "), key=lambda i: abs(i - meio))
    return [nome[:pos], nome[pos + 1:]]


def main():
    grupos = D["grupos"]
    total = sum(len(g["itens"]) for g in grupos)
    assert total == D["total"] == 31, total
    aneis = {1: [], 2: [], 3: []}
    for gi, g in enumerate(grupos):
        for it in g["itens"]:
            aneis[g["anel"]].append((it, gi))

    rng = random.Random(31)
    estrelas = []
    for _ in range(90):
        x, y = rng.uniform(8, 1272), rng.uniform(8, 752)
        r = rng.choice((0.7, 1, 1.4))
        estrelas.append(
            f'<circle class="e" cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="@texto@" style="animation-delay:{-rng.uniform(0, 6):.1f}s;animation-duration:{rng.uniform(3, 7):.1f}s"/>'
        )

    cenas = []
    for a in (1, 2, 3):
        itens = aneis[a]
        n = len(itens)
        R = RAIOS[a]
        cenas.append(f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="@roxo@" stroke-opacity=".45" stroke-dasharray="2 7"/>')
        sentido = "normal" if VOLTA[a] > 0 else "reverse"
        T = abs(VOLTA[a])
        planetas = []
        for i, (nome, gi) in enumerate(itens):
            ang = 2 * math.pi * i / n + a * 0.9 - math.pi / 2
            x, y = CX + R * math.cos(ang), CY + R * math.sin(ang)
            cor = CORES[gi]
            linhas = quebra(nome)
            rot = "".join(
                f'<text x="{x:.1f}" y="{y + 24 + k * 13:.1f}" text-anchor="middle" font-size="11.5" fill="@texto@">{esc(l)}</text>'
                for k, l in enumerate(linhas)
            )
            planetas.append(
                f'<g class="cr" style="transform-origin:{x:.1f}px {y:.1f}px;animation-duration:{T}s;animation-direction:{"reverse" if sentido == "normal" else "normal"}">'
                f'<circle class="h" cx="{x:.1f}" cy="{y:.1f}" r="15" fill="{cor}" opacity=".22" style="animation-delay:{-i * 0.7:.1f}s"/>'
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7.5" fill="{cor}" stroke="@texto@" stroke-opacity=".7" stroke-width="1"/>'
                f"{rot}</g>"
            )
        cenas.append(
            f'<g class="anel" style="transform-origin:{CX}px {CY}px;animation-duration:{T}s;animation-direction:{sentido}">{"".join(planetas)}</g>'
        )

    # legenda: 4 à esquerda, 3 à direita
    leg = []
    for gi, g in enumerate(grupos):
        esq = gi < 4
        x = 36 if esq else 1056
        y = 200 + (gi if esq else gi - 4) * 62
        leg.append(
            f'<g><circle cx="{x + 8}" cy="{y - 5}" r="7" fill="{CORES[gi]}"/>'
            f'<text x="{x + 26}" y="{y}" font-size="15" font-weight="700" fill="@texto@">{esc(g["nome"])}</text>'
            f'<text x="{x + 26}" y="{y + 20}" font-size="13" fill="@texto_secundario@">{len(g["itens"])} {"tecnologia" if len(g["itens"]) == 1 else "tecnologias"} · anel {g["anel"]}</text></g>'
        )

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="760" viewBox="0 0 1280 760" role="img" aria-label="Órbita com as 31 tecnologias que uso no dia a dia, em 3 anéis e 7 grupos">
<title>Órbita de tecnologias — 31 no dia a dia, em 7 grupos</title>
<defs>
<radialGradient id="bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="@roxo_profundo@"/><stop offset=".55" stop-color="@fundo@"/><stop offset="1" stop-color="@fundo_profundo@"/></radialGradient>
<linearGradient id="borda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="@roxo@"/><stop offset="1" stop-color="@azul@"/></linearGradient>
<radialGradient id="nucleo"><stop offset="0" stop-color="@roxo@" stop-opacity=".9"/><stop offset=".5" stop-color="@azul@" stop-opacity=".35"/><stop offset="1" stop-color="@azul@" stop-opacity="0"/></radialGradient>
<linearGradient id="num" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="@texto@"/><stop offset="1" stop-color="@magenta@"/></linearGradient>
<clipPath id="card"><rect width="1280" height="760" rx="22"/></clipPath>
</defs>
<style>
svg{{font-family:{FONTE}}}
.anel{{animation:gira linear infinite}}
.cr{{animation:gira linear infinite}}
@keyframes gira{{to{{transform:rotate(360deg)}}}}
.h{{animation:pulsa 3.2s ease-in-out infinite}}
@keyframes pulsa{{0%,100%{{opacity:.12}}50%{{opacity:.38}}}}
.e{{animation:tw ease-in-out infinite}}
@keyframes tw{{0%,100%{{opacity:.15}}50%{{opacity:.9}}}}
.nu{{transform-box:fill-box;transform-origin:center;animation:resp 4s ease-in-out infinite}}
@keyframes resp{{0%,100%{{transform:scale(1)}}50%{{transform:scale(1.12)}}}}
.pt{{transform-box:fill-box;transform-origin:center;animation:gira 60s linear infinite}}
</style>
<g clip-path="url(#card)">
<rect width="1280" height="760" fill="url(#bg)"/>
{chr(10).join(estrelas)}
<text x="640" y="44" text-anchor="middle" font-size="16" letter-spacing="6" fill="@magenta_claro@">ÓRBITA DE TECNOLOGIAS</text>
<circle class="nu" cx="{CX}" cy="{CY}" r="100" fill="url(#nucleo)"/>
<circle class="pt" cx="{CX}" cy="{CY}" r="62" fill="none" stroke="@magenta@" stroke-opacity=".7" stroke-dasharray="4 9"/>
<text x="{CX}" y="{CY + 22}" text-anchor="middle" font-size="76" font-weight="700" fill="url(#num)">31</text>
<text x="{CX}" y="{CY + 46}" text-anchor="middle" font-size="12" letter-spacing="2" fill="@texto_secundario@">NO DIA A DIA</text>
{chr(10).join(cenas)}
{chr(10).join(leg)}
<text x="640" y="740" text-anchor="middle" font-size="12.5" fill="@texto_secundario@">critério: roda em produção ou no fluxo de trabalho toda semana · medido em {D["medido_em"]}</text>
</g>
<rect x="1" y="1" width="1278" height="758" rx="21" fill="none" stroke="url(#borda)" stroke-width="2"/>
</svg>
'''
    (RAIZ / "assets").mkdir(exist_ok=True)
    (RAIZ / "assets" / "orbita.svg").write_text(pintar(svg), encoding="utf-8")
    print("ok", len(svg))


if __name__ == "__main__":
    main()
