#!/usr/bin/env python3
"""RELÓGIO DO ANO — o gráfico de contribuições do perfil, em forma radial.

Cada dia do último ano é um raio que sai do diamante central: o comprimento é
a quantidade de contribuições, a cor é o nível. Os meses ficam em volta, como
num relógio, e um ponteiro de radar gira devagar. Ao lado, os números do ano
(mês mais forte, dia da semana favorito, média por dia ativo).

Tudo em SVG com CSS, sem JS. Usa os mesmos dados do LAPIDÁRIO.EXE.

    python scripts/gerar_relogio.py --saida dist/relogio.svg
    python scripts/gerar_relogio.py --demo --saida /tmp/relogio.svg
"""
from __future__ import annotations

import argparse
import math
from collections import Counter
from datetime import date
from pathlib import Path

from gerar_jogo import (AMBAR, AZUL, COR_NIVEL, FUNDO, FUNDO_PROFUNDO, MAGENTA, NIVEIS, ROXO,
                        ROXO_PROFUNDO, SUPERFICIE, TEXTO, TEXTO2, USUARIO, buscar, demo, fmt, sequencias)

L, A = 1000, 520
CX, CY = 290, 262
R0, R_MAX = 78, 222
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
MONO = "ui-monospace,SFMono-Regular,Consolas,monospace"


def polar(r: float, ang: float) -> tuple[float, float]:
    return CX + r * math.cos(ang), CY + r * math.sin(ang)


def gerar(semanas: list[list[dict]]) -> str:
    dias = [d for s in semanas for d in s]
    n = len(dias)
    maximo = max((d["contributionCount"] for d in dias), default=1) or 1
    total = sum(d["contributionCount"] for d in dias)
    ativos = [d for d in dias if d["contributionCount"] > 0]
    atual, maior = sequencias(semanas)

    por_mes: Counter = Counter()
    por_semana: Counter = Counter()
    for d in dias:
        dt = date.fromisoformat(d["date"])
        por_mes[(dt.year, dt.month)] += d["contributionCount"]
        por_semana[d["weekday"]] += d["contributionCount"]
    (ano_top, mes_top), qtd_mes_top = por_mes.most_common(1)[0] if por_mes else ((0, 1), 0)
    dia_top = por_semana.most_common(1)[0][0] if por_semana else 0
    media = total / len(ativos) if ativos else 0
    melhor_dia = max(dias, key=lambda d: d["contributionCount"]) if dias else None

    raios, marcas = [], []
    for i, d in enumerate(dias):
        ang = -math.pi / 2 + (i + 0.5) / n * 2 * math.pi
        c = d["contributionCount"]
        if c == 0:
            x, y = polar(R0 + 4, ang)
            raios.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.1" fill="{ROXO}" fill-opacity=".35"/>')
            continue
        nv = NIVEIS.get(d["contributionLevel"], 1)
        comp = 10 + math.sqrt(c / maximo) * (R_MAX - R0 - 10)
        x1, y1 = polar(R0 + 4, ang)
        x2, y2 = polar(R0 + 4 + comp, ang)
        atraso = i / n * 2.4
        raios.append(f'<line class="r" style="animation-delay:{atraso:.2f}s" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                     f'stroke="{COR_NIVEL[nv]}" stroke-width="2.2" stroke-linecap="round"/>')
        if nv == 4:
            raios.append(f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="2" fill="{TEXTO}"/>')

    # divisões e nomes dos meses (no primeiro dia de cada mês)
    vistos = set()
    for i, d in enumerate(dias):
        dt = date.fromisoformat(d["date"])
        if dt.day != 1 and i != 0:
            continue
        if (dt.year, dt.month) in vistos:
            continue
        vistos.add((dt.year, dt.month))
        ang = -math.pi / 2 + i / n * 2 * math.pi
        if dt.day > 10:  # pedaço de mês no começo da janela: só a divisão, sem nome (o mesmo mês aparece no fim)
            x1, y1 = polar(R0 - 6, ang)
            continue
        x1, y1 = polar(R0 - 6, ang)
        x2, y2 = polar(R_MAX + 6, ang)
        marcas.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{TEXTO2}" stroke-opacity=".14"/>')
        am = ang + (15 / n) * 2 * math.pi
        tx, ty = polar(R_MAX + 22, am)
        marcas.append(f'<text x="{tx:.1f}" y="{ty + 4:.1f}" text-anchor="middle" fill="{TEXTO2}" font-size="11" '
                      f'font-family="{MONO}" letter-spacing="1">{MESES[dt.month - 1]}</text>')

    # anéis de escala
    aneis = "".join(f'<circle cx="{CX}" cy="{CY}" r="{r}" fill="none" stroke="{ROXO}" stroke-opacity="{op}" stroke-dasharray="{da}"/>'
                    for r, op, da in ((R0, .5, "none"), (R0 + (R_MAX - R0) * .5, .18, "2 6"), (R_MAX, .25, "2 6")))

    # ponteiro de radar: rastro em leque
    rastro = []
    for k in range(14):
        a0 = -math.pi / 2 - k * 0.045
        a1 = a0 - 0.045
        x0, y0 = polar(R_MAX + 4, a0)
        x1, y1 = polar(R_MAX + 4, a1)
        rastro.append(f'<path d="M{CX} {CY}L{x0:.1f} {y0:.1f}A{R_MAX + 4} {R_MAX + 4} 0 0 0 {x1:.1f} {y1:.1f}Z" '
                      f'fill="{MAGENTA}" fill-opacity="{0.16 * (1 - k / 14):.3f}"/>')
    xp, yp = polar(R_MAX + 4, -math.pi / 2)

    def linha(y: int, rotulo: str, valor: str, cor: str = TEXTO, nota: str = "") -> str:
        return (f'<text x="0" y="{y}" fill="{TEXTO2}" font-size="11" letter-spacing="2">{rotulo}</text>'
                f'<text x="0" y="{y + 30}" fill="{cor}" font-size="26" font-weight="700">{valor}'
                f'{f"<tspan fill=\"{TEXTO2}\" font-size=\"13\" font-weight=\"400\" dx=\"10\">{nota}</tspan>" if nota else ""}</text>')

    painel = "".join([
        linha(0, "CONTRIBUIÇÕES NO ANO", fmt(total)),
        linha(70, "DIAS ATIVOS", f"{len(ativos)}", nota=f"de {n}"),
        linha(140, "MÊS MAIS FORTE", f"{MESES[mes_top - 1]}/{str(ano_top)[2:]}", MAGENTA, f"{fmt(qtd_mes_top)} contribuições"),
        linha(210, "DIA FAVORITO", DIAS_SEMANA[dia_top], AZUL),
        linha(280, "SEQUÊNCIA · RECORDE", f"{atual}d · {maior}d", AMBAR),
        linha(350, "MELHOR DIA", fmt(melhor_dia["contributionCount"]) if melhor_dia else "0",
              TEXTO, date.fromisoformat(melhor_dia["date"]).strftime("%d/%m/%Y") if melhor_dia else ""),
    ])
    media_txt = f"{media:.1f}".replace(".", ",")

    css = (f"@keyframes cresce{{from{{stroke-dasharray:0 400}}to{{stroke-dasharray:400 0}}}}"
           f".r{{stroke-dasharray:400 0;animation:cresce 1.2s ease-out both}}"
           f"@keyframes gira{{to{{transform:rotate(360deg)}}}}"
           f".radar{{transform-origin:{CX}px {CY}px;animation:gira 12s linear infinite}}"
           f"@keyframes pulsa{{0%,100%{{opacity:.55}}50%{{opacity:1}}}}.nucleo{{animation:pulsa 3s ease-in-out infinite}}"
           f"@media (prefers-reduced-motion:reduce){{.r,.radar,.nucleo{{animation:none}}}}")

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{L}" height="{A}" viewBox="0 0 {L} {A}" role="img" aria-label="Relógio do ano: {fmt(total)} contribuições em {len(ativos)} dias ativos; mês mais forte {MESES[mes_top - 1]}">
<title>RELÓGIO DO ANO — {fmt(total)} contribuições</title>
<defs>
<radialGradient id="fundo" cx="{CX / L:.2f}" cy=".5" r=".75"><stop offset="0" stop-color="{ROXO_PROFUNDO}"/><stop offset=".55" stop-color="{FUNDO}"/><stop offset="1" stop-color="{FUNDO_PROFUNDO}"/></radialGradient>
<linearGradient id="gema" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{AZUL}"/><stop offset=".5" stop-color="{ROXO}"/><stop offset="1" stop-color="{MAGENTA}"/></linearGradient>
<filter id="neon" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>{css}</style>
<rect width="{L}" height="{A}" rx="16" fill="url(#fundo)"/>
{aneis}
<g>{"".join(marcas)}</g>
<g class="radar">{"".join(rastro)}<line x1="{CX}" y1="{CY}" x2="{xp:.1f}" y2="{yp:.1f}" stroke="{MAGENTA}" stroke-width="1.5" stroke-opacity=".8"/></g>
<g filter="url(#neon)">{"".join(raios)}</g>
<circle cx="{CX}" cy="{CY}" r="{R0 - 10}" fill="{SUPERFICIE}" fill-opacity=".85" stroke="{ROXO}" stroke-opacity=".4"/>
<g class="nucleo" filter="url(#neon)"><path d="M{CX} {CY - 40}L{CX + 22} {CY - 18}L{CX} {CY + 4}L{CX - 22} {CY - 18}Z" fill="url(#gema)"/>
<path d="M{CX} {CY - 40}L{CX + 9} {CY - 18}L{CX} {CY + 4}L{CX - 9} {CY - 18}Z M{CX - 22} {CY - 18}L{CX + 22} {CY - 18}" fill="none" stroke="{TEXTO}" stroke-opacity=".7"/></g>
<text x="{CX}" y="{CY + 30}" text-anchor="middle" fill="{TEXTO}" font-family="{MONO}" font-size="20" font-weight="700">{fmt(total)}</text>
<text x="{CX}" y="{CY + 46}" text-anchor="middle" fill="{TEXTO2}" font-family="{MONO}" font-size="9" letter-spacing="2">NO ÚLTIMO ANO</text>
<g font-family="{MONO}">
<text x="590" y="46" fill="{MAGENTA}" font-size="20" font-weight="700" letter-spacing="3" filter="url(#neon)">RELÓGIO DO ANO</text>
<text x="590" y="68" fill="{TEXTO2}" font-size="12">cada raio é um dia · média de {media_txt} por dia ativo</text>
<g transform="translate(590,110)">{painel}</g>
</g>
<rect x=".5" y=".5" width="{L - 1}" height="{A - 1}" rx="16" fill="none" stroke="{MAGENTA}" stroke-opacity=".28"/>
</svg>
'''


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--saida", default="dist/relogio.svg")
    ap.add_argument("--usuario", default=USUARIO)
    ap.add_argument("--demo", action="store_true")
    a = ap.parse_args()
    semanas = demo() if a.demo else buscar(a.usuario)
    svg = gerar(semanas)
    saida = Path(a.saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(svg, encoding="utf-8")
    print(f"{saida} ({len(svg) // 1024} KB)")


if __name__ == "__main__":
    main()
