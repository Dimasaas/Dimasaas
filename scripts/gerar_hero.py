#!/usr/bin/env python3
"""Gera assets/boot.svg e assets/painel.svg (números vêm de dados/metricas.json)."""
import json
import math
import random
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
M = json.loads((RAIZ / "dados" / "metricas.json").read_text(encoding="utf-8"))
FONTE = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------- boot.svg
def chuva(rng):
    cols = []
    chars = "01ABCDEF<>{}/\\|+=;:#$%&*"
    for i in range(40):
        x = 14 + i * 32
        cor = "#7C4DFF" if i % 2 == 0 else "#2979FF"
        n = rng.randint(9, 15)
        dur = rng.uniform(5.5, 11)
        atraso = -rng.uniform(0, dur)
        ts = []
        for k in range(n):
            c = esc(rng.choice(chars))
            op = round(0.08 + 0.55 * (k / (n - 1)) ** 1.6, 2)
            fill = cor
            if k == n - 1:
                fill, op = "#00E5FF", 0.95
            dy = 0 if k == 0 else 18
            ts.append(f'<tspan x="{x}" dy="{dy}" fill="{fill}" fill-opacity="{op}">{c}</tspan>')
        cols.append(
            f'<text class="r" y="0" style="animation-duration:{dur:.1f}s;animation-delay:{atraso:.1f}s">{"".join(ts)}</text>'
        )
    return "\n".join(cols)


def esfera(cx, cy, R):
    p = []
    p.append(f'<circle cx="{cx}" cy="{cy}" r="{R * 1.35}" fill="url(#halo)"/>')
    p.append(f'<g transform="rotate(-18 {cx} {cy})">')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#B388FF" stroke-width="1.6" opacity=".9"/>')
    for lat in (-60, -30, 0, 30, 60):
        a = math.radians(lat)
        rx = R * math.cos(a)
        p.append(
            f'<ellipse cx="{cx}" cy="{cy + R * math.sin(a):.1f}" rx="{rx:.1f}" ry="{rx * 0.2:.1f}" fill="none" stroke="#7C4DFF" stroke-width="1.1" opacity=".75"/>'
        )
    T = 14
    for k in range(6):
        cor = "#00E5FF" if k % 2 == 0 else "#2979FF"
        p.append(
            f'<ellipse class="mer" cx="{cx}" cy="{cy}" rx="{R}" ry="{R}" fill="none" stroke="{cor}" stroke-width="1.1" opacity=".8" style="animation-duration:{T}s;animation-delay:{-k * T / 6:.2f}s"/>'
        )
    for k, (dx, dy) in enumerate([(-0.55, -0.45), (0.5, -0.6), (0.7, 0.2), (-0.2, 0.7), (-0.75, 0.15), (0.1, -0.05)]):
        p.append(
            f'<circle class="v" cx="{cx + dx * R:.1f}" cy="{cy + dy * R:.1f}" r="3.2" fill="#00E5FF" style="animation-delay:{k * 0.4:.1f}s"/>'
        )
    p.append("</g>")
    rx, ry = 215, 48
    path = f"M {cx - rx},{cy} a {rx},{ry} 0 1,0 {2 * rx},0 a {rx},{ry} 0 1,0 {-2 * rx},0"
    p.append(f'<g transform="rotate(-18 {cx} {cy})">')
    p.append(f'<path d="{path}" fill="none" stroke="#B388FF" stroke-width="1" stroke-dasharray="3 7" opacity=".7"/>')
    for k, cor in enumerate(("#00E5FF", "#B388FF", "#2979FF")):
        p.append(
            f'<circle r="5" fill="{cor}"><animateMotion dur="10s" begin="{-k * 3.33:.2f}s" repeatCount="indefinite" path="{path}"/></circle>'
        )
    p.append("</g>")
    return "\n".join(p)


def boot():
    rng = random.Random(1001)
    n = M["commits_texto"]
    linhas = [
        (70, "booting diamantino.os v26.11…", "#B388FF", 0.4, 28),
        (100, "[ OK ] ruby on rails 8 … online", None, 1.2, 31),
        (130, "[ OK ] postgresql 17 … online", None, 2.0, 29),
        (160, f"[ OK ] {M['tecnologias']} tecnologias … carregadas", None, 2.8, 33),
        (190, f"[ OK ] {n} commits no último ano … sincronizados", None, 3.6, 49),
    ]
    txt = []
    for y, t, cor, d, nch in linhas:
        dur = max(0.5, nch * 0.022)
        if t.startswith("[ OK ]"):
            resto = esc(t[len("[ OK ]"):])
            conteudo = f'<tspan fill="#00E5FF">[ OK ]</tspan><tspan fill="#d9ccff">{resto}</tspan>'
        else:
            conteudo = esc(t)
        fill = f' fill="{cor}"' if cor else ""
        txt.append(
            f'<text class="l" x="60" y="{y}"{fill} style="animation-delay:{d}s;animation-duration:{dur:.2f}s;animation-timing-function:steps({nch},end)">{conteudo}</text>'
        )
    txt.append('<text class="l" x="60" y="240" style="animation-delay:4.5s;animation-duration:.4s;animation-timing-function:steps(8,end)"><tspan fill="#00E5FF">&gt;</tspan><tspan fill="#d9ccff"> whoami</tspan></text>')
    nome = "João Victor Diamantino"
    txt.append(
        f'''<g class="fade" style="animation-delay:5.2s">
<text class="g2" x="60" y="292" font-size="40" font-weight="700" fill="#B388FF">{nome}</text>
<text class="g1" x="60" y="292" font-size="40" font-weight="700" fill="#00E5FF">{nome}</text>
<text x="60" y="292" font-size="40" font-weight="700" fill="url(#nomeg)">{nome}</text>
</g>
<text class="fade" x="62" y="330" font-size="21" fill="#c9bdf5" style="animation-delay:5.7s">Diretor de T.I. · Goiânia</text>
<text class="fade" x="60" y="372" font-size="21" style="animation-delay:6.2s"><tspan fill="#00E5FF">&gt;</tspan></text>
<rect class="cur" x="84" y="356" width="12" height="20" fill="#00E5FF"/>'''
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" role="img" aria-label="Tela de boot do DIAMANTINO.OS: João Victor Diamantino, Diretor de T.I., Goiânia">
<title>DIAMANTINO.OS — João Victor Diamantino · Diretor de T.I. · Goiânia</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0624"/><stop offset=".55" stop-color="#0a0a2e"/><stop offset="1" stop-color="#08143a"/></linearGradient>
<linearGradient id="borda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C4DFF"/><stop offset="1" stop-color="#2979FF"/></linearGradient>
<linearGradient id="vel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07031a" stop-opacity=".92"/><stop offset=".6" stop-color="#07031a" stop-opacity=".55"/><stop offset="1" stop-color="#07031a" stop-opacity="0"/></linearGradient>
<linearGradient id="nomeg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9ccff"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#7C4DFF" stop-opacity=".35"/><stop offset=".6" stop-color="#2979FF" stop-opacity=".12"/><stop offset="1" stop-color="#2979FF" stop-opacity="0"/></radialGradient>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".28"/></pattern>
<clipPath id="card"><rect width="1280" height="400" rx="20"/></clipPath>
<linearGradient id="faixa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B388FF" stop-opacity="0"/><stop offset=".5" stop-color="#B388FF" stop-opacity=".10"/><stop offset="1" stop-color="#B388FF" stop-opacity="0"/></linearGradient>
</defs>
<style>
svg{{font-family:{FONTE}}}
text{{font-size:20px;white-space:pre}}
.r{{font-size:16px;animation:cai linear infinite}}
@keyframes cai{{from{{transform:translateY(-300px)}}to{{transform:translateY(420px)}}}}
.l{{opacity:0;animation-name:dig;animation-fill-mode:forwards}}
@keyframes dig{{0%{{opacity:1;clip-path:inset(0 100% 0 0)}}100%{{opacity:1;clip-path:inset(0 0 0 0)}}}}
.fade{{opacity:0;animation:surge .5s ease-out forwards}}
@keyframes surge{{to{{opacity:1}}}}
.cur{{opacity:0;animation:pisca 1s steps(1) 6.2s infinite}}
@keyframes pisca{{0%{{opacity:1}}50%{{opacity:0}}100%{{opacity:1}}}}
.g1,.g2{{opacity:0;animation:gl 5s steps(1) 7s infinite}}
.g1{{animation-name:gl1}}
@keyframes gl1{{0%,88%{{opacity:0;transform:translate(0)}}89%{{opacity:.9;transform:translate(-5px,1px)}}91%{{opacity:.9;transform:translate(4px,-2px)}}93%{{opacity:.9;transform:translate(-3px,0)}}95%,100%{{opacity:0;transform:translate(0)}}}}
@keyframes gl{{0%,88%{{opacity:0;transform:translate(0)}}90%{{opacity:.9;transform:translate(5px,-1px)}}92%{{opacity:.9;transform:translate(-4px,2px)}}94%{{opacity:.9;transform:translate(3px,0)}}96%,100%{{opacity:0;transform:translate(0)}}}}
.mer{{transform-box:fill-box;transform-origin:center;animation:gira linear infinite;animation-timing-function:cubic-bezier(.37,0,.63,1)}}
@keyframes gira{{0%{{transform:scaleX(1)}}50%{{transform:scaleX(.03)}}100%{{transform:scaleX(1)}}}}
.v{{animation:bate 2.4s ease-in-out infinite}}
@keyframes bate{{0%,100%{{opacity:.25}}50%{{opacity:1}}}}
.varre{{animation:varre 7s linear infinite}}
@keyframes varre{{from{{transform:translateY(-120px)}}to{{transform:translateY(420px)}}}}
</style>
<g clip-path="url(#card)">
<rect width="1280" height="400" fill="url(#bg)"/>
<g opacity=".95">
{chuva(rng)}
</g>
{esfera(1040, 215, 150)}
<rect width="1000" height="400" fill="url(#vel)"/>
<rect width="1280" height="400" fill="url(#scan)"/>
<rect class="varre" width="1280" height="120" fill="url(#faixa)"/>
<rect width="1280" height="38" fill="#120a30" opacity=".9"/>
<circle cx="26" cy="19" r="6" fill="#7C4DFF"/><circle cx="48" cy="19" r="6" fill="#2979FF"/><circle cx="70" cy="19" r="6" fill="#00E5FF"/>
<text x="640" y="25" font-size="14" text-anchor="middle" fill="#8f7fd1">diamantino.os — tty1 — 1280×400</text>
{chr(10).join(txt)}
</g>
<rect x="1" y="1" width="1278" height="398" rx="19" fill="none" stroke="url(#borda)" stroke-width="2"/>
</svg>
'''


# -------------------------------------------------------------- painel.svg
def odometro(cx0, base, digito, atraso, idx, h=84):
    d = int(digito)
    itens = "".join(
        f'<text x="{cx0}" y="{base + i * h}" text-anchor="middle">{i % 10}</text>' for i in range(20)
    )
    alvo = -(10 + d) * h
    dur = 2.2 + idx * 0.35
    return f'<g class="od" style="--alvo:{alvo}px;animation-duration:{dur:.2f}s;animation-delay:{atraso:.2f}s">{itens}</g>'


def painel():
    larg_dig = 41
    cel = [
        ("31", "tecnologias", "no dia a dia, de Ruby a Docker"),
        (M["commits_texto"], "commits", "no último ano"),
        ("3", "sistemas em produção", "+ 1 app na Google Play"),
        (str(M["repos_publicos"]), "repositórios públicos", "com código aberto de verdade"),
    ]
    larg_cel = 1280 / 4
    base = 112
    h = 84
    partes = []
    clips = []
    for c, (num, rot1, rot2) in enumerate(cel):
        x0 = c * larg_cel
        largura = sum(larg_dig if ch.isdigit() else 24 if ch == "." else 40 for ch in num)
        x = x0 + (larg_cel - largura) / 2
        clips.append(f'<clipPath id="c{c}"><rect x="{x0 + 10}" y="{base - 66}" width="{larg_cel - 20}" height="{h}"/></clipPath>')
        g = [f'<g clip-path="url(#c{c})" fill="url(#numg)" style="font-size:72px;font-weight:700">']
        k = 0
        for ch in num:
            if ch.isdigit():
                g.append(odometro(round(x + larg_dig / 2, 1), base, ch, 0.3 + c * 0.25 + k * 0.1, k))
                x += larg_dig
                k += 1
            else:
                w = 24 if ch == "." else 40
                g.append(f'<text class="est" x="{x + w / 2:.1f}" y="{base}" text-anchor="middle" style="animation-delay:{1.5 + c * .25:.2f}s">{ch}</text>')
                x += w
        g.append("</g>")
        partes.append("\n".join(g))
        cx = x0 + larg_cel / 2
        partes.append(f'<text x="{cx:.0f}" y="152" text-anchor="middle" font-size="21" font-weight="700" fill="#e7deff">{esc(rot1)}</text>')
        partes.append(f'<text x="{cx:.0f}" y="178" text-anchor="middle" font-size="15" fill="#9d8fdc">{esc(rot2)}</text>')
        if c:
            partes.append(f'<line x1="{x0:.0f}" y1="36" x2="{x0:.0f}" y2="184" stroke="#7C4DFF" stroke-opacity=".35" stroke-dasharray="2 6"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="220" viewBox="0 0 1280 220" role="img" aria-label="{M['tecnologias']} tecnologias, {M['commits_texto']} commits no último ano, 3 sistemas em produção e 1 app na Google Play, {M['repos_publicos']} repositórios públicos">
<title>{M['tecnologias']} tecnologias · {M['commits_texto']} commits no último ano · 3 sistemas em produção + 1 app · {M['repos_publicos']} repositórios públicos</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0624"/><stop offset="1" stop-color="#08143a"/></linearGradient>
<linearGradient id="borda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C4DFF"/><stop offset="1" stop-color="#2979FF"/></linearGradient>
<linearGradient id="numg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#00E5FF"/></linearGradient>
<linearGradient id="brilho" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C4DFF" stop-opacity="0"/><stop offset=".5" stop-color="#B388FF" stop-opacity=".22"/><stop offset="1" stop-color="#2979FF" stop-opacity="0"/></linearGradient>
<pattern id="grade" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#7C4DFF" stroke-opacity=".10"/></pattern>
<clipPath id="card"><rect width="1280" height="220" rx="20"/></clipPath>
{chr(10).join(clips)}
</defs>
<style>
svg{{font-family:{FONTE}}}
.od{{animation:rola cubic-bezier(.16,1,.3,1) both}}
@keyframes rola{{from{{transform:translateY(0)}}to{{transform:translateY(var(--alvo))}}}}
.est{{opacity:0;animation:surge .5s ease-out forwards}}
@keyframes surge{{to{{opacity:1}}}}
.b{{animation:varre 6s ease-in-out infinite}}
@keyframes varre{{from{{transform:translateX(-500px)}}to{{transform:translateX(1280px)}}}}
</style>
<g clip-path="url(#card)">
<rect width="1280" height="220" fill="url(#bg)"/>
<rect width="1280" height="220" fill="url(#grade)"/>
<rect class="b" y="0" width="500" height="220" fill="url(#brilho)"/>
{chr(10).join(partes)}
</g>
<rect x="1" y="1" width="1278" height="218" rx="19" fill="none" stroke="url(#borda)" stroke-width="2"/>
</svg>
'''


if __name__ == "__main__":
    (RAIZ / "assets").mkdir(exist_ok=True)
    (RAIZ / "assets" / "boot.svg").write_text(boot(), encoding="utf-8")
    (RAIZ / "assets" / "painel.svg").write_text(painel(), encoding="utf-8")
    print("ok")
