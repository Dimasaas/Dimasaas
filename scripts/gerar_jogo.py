#!/usr/bin/env python3
"""LAPIDÁRIO.EXE — o minigame do perfil.

Uma nave-diamante varre o gráfico de contribuições do último ano, coluna por
coluna. Cada dia com commit é uma pedra bruta: o laser acerta, a pedra vira um
diamante lapidado na cor do nível e uma faísca sobe para o placar. No fim da
varredura a nave sai pela direita, as pedras voltam a ser brutas e o ciclo
recomeça.

Tudo é SVG com CSS (o GitHub não roda JS dentro de <img>). Os dados vêm da API
GraphQL do GitHub (contributionCalendar). Sem rede, use --demo.

    python scripts/gerar_jogo.py --saida dist/jogo.svg
    python scripts/gerar_jogo.py --demo --saida /tmp/jogo.svg
"""
from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import urllib.request
from datetime import date, timedelta
from pathlib import Path

USUARIO = "Dimasaas"

# paleta Synthwave (dados/paleta.json)
FUNDO = "#120726"
FUNDO_PROFUNDO = "#0a0418"
SUPERFICIE = "#1e0d3d"
ROXO_PROFUNDO = "#2b0f52"
MAGENTA = "#FF4FA3"
ROXO = "#7C5CFF"
AZUL = "#4D8BFF"
AMBAR = "#FFB86B"
TEXTO = "#F5EEFF"
TEXTO2 = "#C3A8E6"

NIVEIS = {"FIRST_QUARTILE": 1, "SECOND_QUARTILE": 2, "THIRD_QUARTILE": 3, "FOURTH_QUARTILE": 4}
COR_NIVEL = {1: ROXO, 2: AZUL, 3: MAGENTA, 4: AMBAR}

# geometria
L, A = 1000, 330
CEL, GAP = 13, 4
PASSO = CEL + GAP
X0, Y0 = 50, 150  # canto da grade
CICLO = 16.0  # s
INICIO, FIM_VARREDURA = 1.0, 12.5  # s


CONSULTA = """query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
totalContributions weeks{contributionDays{contributionCount contributionLevel date weekday}}}}}}"""


def buscar(login: str) -> list[list[dict]]:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        corpo = json.dumps({"query": CONSULTA, "variables": {"login": login}}).encode()
        req = urllib.request.Request("https://api.github.com/graphql", data=corpo, headers={
            "Authorization": f"bearer {token}", "Content-Type": "application/json", "User-Agent": "lapidario"})
        with urllib.request.urlopen(req, timeout=30) as r:
            dados = json.load(r)
    else:  # local: usa o gh logado
        saida = subprocess.run(["gh", "api", "graphql", "-f", f"query={CONSULTA}", "-f", f"login={login}"],
                               capture_output=True, text=True, check=True, encoding="utf-8").stdout
        dados = json.loads(saida)
    semanas = dados["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]
    return [s["contributionDays"] for s in semanas]


def demo() -> list[list[dict]]:
    rnd = random.Random(7)
    hoje = date(2026, 11, 25)
    ini = hoje - timedelta(days=364 + (hoje.weekday() + 1) % 7)
    semanas, d = [], ini
    while d <= hoje:
        semana = []
        for _ in range(7):
            if d > hoje:
                break
            n = rnd.choice([0, 0, 0, 1, 3, 6, 12, 25]) if d > hoje - timedelta(days=150) else rnd.choice([0, 0, 0, 0, 1, 2])
            lv = "NONE" if n == 0 else ["FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"][min(3, n // 6)]
            semana.append({"contributionCount": n, "contributionLevel": lv, "date": d.isoformat(), "weekday": (d.weekday() + 1) % 7})
            d += timedelta(days=1)
        semanas.append(semana)
    return semanas


def sequencias(semanas: list[list[dict]]) -> tuple[int, int]:
    dias = [d for s in semanas for d in s]
    maior = atual = 0
    for d in dias:
        atual = atual + 1 if d["contributionCount"] > 0 else 0
        maior = max(maior, atual)
    # a sequência atual não quebra só porque hoje ainda não teve commit
    corrente = 0
    for i, d in enumerate(reversed(dias)):
        if d["contributionCount"] > 0:
            corrente += 1
        elif i == 0:
            continue
        else:
            break
    return corrente, maior


def pct(t: float) -> str:
    return f"{max(0.0, min(100.0, t / CICLO * 100)):.2f}%"


def fmt(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def diamante(cx: float, cy: float, r: float) -> str:
    return f"M{cx:.1f} {cy - r:.1f}L{cx + r:.1f} {cy:.1f}L{cx:.1f} {cy + r:.1f}L{cx - r:.1f} {cy:.1f}Z"


def gerar(semanas: list[list[dict]]) -> str:
    n_col = len(semanas)
    dt = (FIM_VARREDURA - INICIO) / max(1, n_col - 1)
    total = sum(d["contributionCount"] for s in semanas for d in s)
    dias_ativos = sum(1 for s in semanas for d in s if d["contributionCount"] > 0)
    atual, maior = sequencias(semanas)
    y_nave = Y0 - 46
    x_col = [X0 + c * PASSO + CEL / 2 for c in range(n_col)]
    largura_grade = n_col * PASSO - GAP

    css, brutas, lapidadas, lasers, faiscas = [], [], [], [], []
    for c, semana in enumerate(semanas):
        t = INICIO + c * dt
        ativos = [d for d in semana if d["contributionCount"] > 0]
        g_lap = []
        for d in semana:
            lin = d["weekday"]
            x, y = X0 + c * PASSO, Y0 + lin * PASSO
            if d["contributionCount"] == 0:
                brutas.append(f'<rect x="{x}" y="{y}" width="{CEL}" height="{CEL}" rx="3" fill="{SUPERFICIE}"/>')
                continue
            nv = NIVEIS.get(d["contributionLevel"], 1)
            brutas.append(f'<rect x="{x}" y="{y}" width="{CEL}" height="{CEL}" rx="3" fill="{ROXO_PROFUNDO}" '
                          f'stroke="{COR_NIVEL[nv]}" stroke-opacity=".35"/>')
            g_lap.append(f'<path d="{diamante(x + CEL / 2, y + CEL / 2, CEL / 2 + 1.5)}" fill="{COR_NIVEL[nv]}"/>')
        if not ativos:
            continue
        # pedras lapidadas da coluna: aparecem no tiro e somem no reinício
        css.append(f"@keyframes l{c}{{0%,{pct(t - .01)}{{opacity:0;transform:scale(.3)}}"
                   f"{pct(t + .12)}{{opacity:1;transform:scale(1.35)}}{pct(t + .3)},{pct(CICLO - 1.6)}{{opacity:1;transform:scale(1)}}"
                   f"{pct(CICLO - 1.0)},100%{{opacity:0;transform:scale(.3)}}}}"
                   f".l{c}{{animation:l{c} {CICLO}s linear infinite}}")
        lapidadas.append(f'<g class="lap l{c}" style="transform-origin:{x_col[c]:.1f}px {Y0 + 3 * PASSO + CEL / 2:.1f}px">{"".join(g_lap)}</g>')
        # laser: do bico da nave até a última pedra da coluna
        y_fim = Y0 + max(d["weekday"] for d in ativos) * PASSO + CEL
        css.append(f"@keyframes z{c}{{0%,{pct(t - .02)},{pct(t + .2)},100%{{opacity:0}}{pct(t)}{{opacity:1}}}}"
                   f".z{c}{{animation:z{c} {CICLO}s linear infinite}}")
        lasers.append(f'<rect class="z{c}" x="{x_col[c] - 1.5:.1f}" y="{y_nave + 14}" width="3" height="{y_fim - y_nave - 14:.1f}" '
                      f'fill="url(#laser)" opacity="0"/>')
        # faísca que sobe ao placar
        css.append(f"@keyframes f{c}{{0%,{pct(t)}{{opacity:0;transform:translateY(0)}}{pct(t + .05)}{{opacity:1}}"
                   f"{pct(t + .9)},100%{{opacity:0;transform:translateY(-70px)}}}}"
                   f".f{c}{{animation:f{c} {CICLO}s ease-out infinite}}")
        faiscas.append(f'<path class="f{c}" d="{diamante(x_col[c], Y0 - 8, 3)}" fill="{TEXTO}" opacity="0"/>')

    # nave: entra pela esquerda, percorre as colunas, sai pela direita
    x_ini, x_fim = x_col[0], x_col[-1]
    css.append(f"@keyframes nave{{0%{{transform:translate({X0 - 80}px,{y_nave}px)}}"
               f"{pct(INICIO)}{{transform:translate({x_ini:.1f}px,{y_nave}px)}}"
               f"{pct(FIM_VARREDURA)}{{transform:translate({x_fim:.1f}px,{y_nave}px)}}"
               f"{pct(FIM_VARREDURA + 1.4)},100%{{transform:translate({L + 80}px,{y_nave - 30}px)}}}}"
               f".nave{{animation:nave {CICLO}s linear infinite}}")
    # barra de progresso da varredura
    css.append(f"@keyframes barra{{0%,{pct(INICIO)}{{transform:scaleX(0)}}{pct(FIM_VARREDURA)},{pct(CICLO - 1.0)}{{transform:scaleX(1)}}100%{{transform:scaleX(0)}}}}"
               f".barra{{transform-origin:{X0}px 0;animation:barra {CICLO}s linear infinite}}")
    css.append("@keyframes pisca{0%,100%{opacity:1}50%{opacity:.35}}.pisca{animation:pisca 1.1s steps(1) infinite}"
               "@keyframes chama{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}}"
               ".chama{transform-origin:0 6px;animation:chama .18s linear infinite}"
               "@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}.bob{animation:bob 1.4s ease-in-out infinite}"
               "@media (prefers-reduced-motion:reduce){.nave,.lap,.barra,[class^=z],[class^=f],.pisca,.chama,.bob{animation:none!important}.lap{opacity:1!important}}")

    # chão synthwave em perspectiva
    chao = []
    horizonte, base = 270, A
    for i in range(-10, 11):
        chao.append(f'<line x1="{L / 2 + i * 30:.0f}" y1="{horizonte}" x2="{L / 2 + i * 140:.0f}" y2="{base}"/>')
    for k, y in enumerate([272, 276, 282, 291, 303, 318]):
        chao.append(f'<line x1="0" y1="{y}" x2="{L}" y2="{y}" stroke-opacity="{.25 + k * .1:.2f}"/>')

    x_hud = X0 + largura_grade
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{L}" height="{A}" viewBox="0 0 {L} {A}" role="img" aria-label="LAPIDÁRIO.EXE: uma nave-diamante lapida os {fmt(dias_ativos)} dias com commit do último ano ({fmt(total)} contribuições)">
<title>LAPIDÁRIO.EXE — {fmt(total)} contribuições no último ano</title>
<defs>
<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{FUNDO_PROFUNDO}"/><stop offset=".8" stop-color="{FUNDO}"/><stop offset="1" stop-color="#2a0d4a"/></linearGradient>
<linearGradient id="laser" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{TEXTO}"/><stop offset=".3" stop-color="{MAGENTA}"/><stop offset="1" stop-color="{MAGENTA}" stop-opacity=".2"/></linearGradient>
<linearGradient id="casco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{AZUL}"/><stop offset=".5" stop-color="{ROXO}"/><stop offset="1" stop-color="{MAGENTA}"/></linearGradient>
<linearGradient id="prog" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{ROXO}"/><stop offset=".6" stop-color="{MAGENTA}"/><stop offset="1" stop-color="{AMBAR}"/></linearGradient>
<filter id="neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="moldura"><rect width="{L}" height="{A}" rx="16"/></clipPath>
</defs>
<style>{"".join(css)}</style>
<g clip-path="url(#moldura)">
<rect width="{L}" height="{A}" fill="url(#ceu)"/>
<g stroke="{ROXO}" stroke-opacity=".35" stroke-width="1">{"".join(chao)}</g>
<text x="{X0}" y="44" fill="{MAGENTA}" font-family="ui-monospace,SFMono-Regular,Consolas,monospace" font-size="20" font-weight="700" letter-spacing="3" filter="url(#neon)">LAPIDÁRIO.EXE</text>
<text x="{X0}" y="66" fill="{TEXTO2}" font-family="ui-monospace,SFMono-Regular,Consolas,monospace" font-size="12">cada dia com commit é uma pedra bruta · a nave lapida uma semana por vez</text>
<g font-family="ui-monospace,SFMono-Regular,Consolas,monospace" text-anchor="end">
<text x="{x_hud}" y="34" fill="{TEXTO2}" font-size="11" letter-spacing="2">CONTRIBUIÇÕES</text>
<text x="{x_hud}" y="58" fill="{TEXTO}" font-size="24" font-weight="700">◆ {fmt(total)}</text>
<text x="{x_hud - 200}" y="34" fill="{TEXTO2}" font-size="11" letter-spacing="2">SEQUÊNCIA</text>
<text x="{x_hud - 200}" y="58" fill="{AMBAR}" font-size="24" font-weight="700">{atual}d</text>
<text x="{x_hud - 320}" y="34" fill="{TEXTO2}" font-size="11" letter-spacing="2">RECORDE</text>
<text x="{x_hud - 320}" y="58" fill="{TEXTO}" font-size="24" font-weight="700">{maior}d</text>
</g>
<rect x="{X0}" y="80" width="{largura_grade}" height="3" rx="1.5" fill="{SUPERFICIE}"/>
<rect class="barra" x="{X0}" y="80" width="{largura_grade}" height="3" rx="1.5" fill="url(#prog)"/>
<g>{"".join(brutas)}</g>
<g filter="url(#neon)">{"".join(lasers)}</g>
<g filter="url(#neon)">{"".join(lapidadas)}</g>
<g>{"".join(faiscas)}</g>
<g class="nave"><g class="bob">
<path class="chama" d="M-5 -2L0 -16L5 -2Z" fill="{AMBAR}" opacity=".85" transform="translate(0,-2)"/>
<path d="M0 -14L14 0L0 14L-14 0Z" fill="url(#casco)" filter="url(#neon)"/>
<path d="M0 -14L6 0L0 14L-6 0Z M-14 0L14 0" fill="none" stroke="{TEXTO}" stroke-opacity=".7" stroke-width="1"/>
<circle cx="0" cy="0" r="2.2" fill="{TEXTO}"/>
</g></g>
<text class="pisca" x="{L / 2}" y="{A - 14}" text-anchor="middle" fill="{TEXTO2}" font-family="ui-monospace,SFMono-Regular,Consolas,monospace" font-size="11" letter-spacing="3">{fmt(dias_ativos)} PEDRAS LAPIDADAS NO ÚLTIMO ANO</text>
</g>
<rect x=".5" y=".5" width="{L - 1}" height="{A - 1}" rx="16" fill="none" stroke="{MAGENTA}" stroke-opacity=".28"/>
</svg>
'''


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--saida", default="dist/jogo.svg")
    ap.add_argument("--usuario", default=USUARIO)
    ap.add_argument("--demo", action="store_true", help="dados inventados, sem rede")
    a = ap.parse_args()
    semanas = demo() if a.demo else buscar(a.usuario)
    svg = gerar(semanas)
    saida = Path(a.saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(svg, encoding="utf-8")
    print(f"{saida} ({len(svg) // 1024} KB, {len(semanas)} semanas)")


if __name__ == "__main__":
    main()
