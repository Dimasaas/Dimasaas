#!/usr/bin/env python3
"""Botões de link do topo e o rodapé do perfil, desenhados aqui (sem shields.io nem capsule-render).

Botão: um cristal lapidado (hexágono alongado) com ícone desenhado à mão, rótulo e
um reflexo que atravessa de tempos em tempos. Rodapé: o horizonte do DIAMANTINO.OS
desligando — o sol desce atrás da grade e sobra a linha "fim da transmissão".

    python scripts/gerar_botoes.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUNDO, FUNDO2 = "#120726", "#0a0418"
MAGENTA, ROXO, AZUL, AMBAR, TEXTO, TEXTO2 = "#FF4FA3", "#7C5CFF", "#4D8BFF", "#FFB86B", "#F5EEFF", "#C3A8E6"
MONO = "ui-monospace,SFMono-Regular,Consolas,monospace"

# ícones (24x24), traço simples
ICONES = {
    "perfil": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    "casa": '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    "cubo": '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>',
}


def botao(rotulo: str, valor: str, icone: str, cor: str, largura: int) -> str:
    A, w = 52, largura
    casca = f"M14 1H{w - 14}L{w - 1} {A / 2}L{w - 14} {A - 1}H14L1 {A / 2}Z"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{A}" viewBox="0 0 {w} {A}" role="img" aria-label="{rotulo}: {valor}">
<title>{rotulo}: {valor}</title>
<defs>
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241046"/><stop offset="1" stop-color="{FUNDO2}"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{cor}"/><stop offset="1" stop-color="{MAGENTA}"/></linearGradient>
<linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="c"><path d="{casca}"/></clipPath>
</defs>
<style>
.ref{{animation:ref 5s ease-in-out infinite}}
@keyframes ref{{0%,70%{{transform:translateX(-80px) skewX(-20deg)}}100%{{transform:translateX({w + 40}px) skewX(-20deg)}}}}
@media (prefers-reduced-motion:reduce){{.ref{{animation:none;opacity:0}}}}
</style>
<path d="{casca}" fill="url(#f)"/>
<g clip-path="url(#c)">
<path d="M14 1L34 {A / 2}L14 {A - 1}" fill="{cor}" fill-opacity=".12"/>
<rect class="ref" x="0" y="0" width="40" height="{A}" fill="url(#r)"/>
</g>
<path d="{casca}" fill="none" stroke="url(#b)" stroke-width="1.6"/>
<g transform="translate(24,14)" fill="none" stroke="{cor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONES[icone]}</g>
<text x="60" y="22" font-family="{MONO}" font-size="10" letter-spacing="2" fill="{TEXTO2}">{rotulo}</text>
<text x="60" y="39" font-family="{MONO}" font-size="14" font-weight="700" fill="{TEXTO}">{valor}</text>
</svg>
'''


def rodape() -> str:
    L, A, H = 1280, 150, 70  # H = horizonte
    verticais = "".join(f'<line x1="{L / 2 + i * 22:.0f}" y1="{H}" x2="{L / 2 + i * 120:.0f}" y2="{A}"/>' for i in range(-14, 15))
    horizontais = "".join(f'<line class="h" style="animation-delay:{-k * 0.5:.1f}s" x1="0" y1="{H}" x2="{L}" y2="{H}"/>' for k in range(6))
    riscas = "".join(f'<rect x="{L / 2 - 80}" y="{H - 30 + k * 7}" width="160" height="{2 + k * 0.6:.1f}" fill="{FUNDO}"/>' for k in range(5))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{L}" height="{A}" viewBox="0 0 {L} {A}" role="img" aria-label="Fim da transmissão do DIAMANTINO.OS">
<title>DIAMANTINO.OS — fim da transmissão</title>
<defs>
<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{FUNDO}" stop-opacity="0"/><stop offset="1" stop-color="#2b0f52"/></linearGradient>
<linearGradient id="sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{AMBAR}"/><stop offset="1" stop-color="{MAGENTA}"/></linearGradient>
<linearGradient id="chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0836"/><stop offset="1" stop-color="{FUNDO2}"/></linearGradient>
<clipPath id="acima"><rect width="{L}" height="{H}"/></clipPath>
<clipPath id="abaixo"><rect y="{H}" width="{L}" height="{A - H}"/></clipPath>
</defs>
<style>
.sol{{animation:desce 9s ease-in-out infinite}}
@keyframes desce{{0%,15%{{transform:translateY(0)}}75%,100%{{transform:translateY(62px)}}}}
.h{{animation:vem 3s linear infinite}}
@keyframes vem{{0%{{transform:translateY(0) scaleY(1);opacity:.2}}100%{{transform:translateY({A - H}px);opacity:.9}}}}
.cur{{animation:pisca 1.1s steps(1) infinite}}
@keyframes pisca{{50%{{opacity:0}}}}
@media (prefers-reduced-motion:reduce){{.sol,.h,.cur{{animation:none}}}}
</style>
<rect width="{L}" height="{H}" fill="url(#ceu)"/>
<g clip-path="url(#acima)"><g class="sol"><circle cx="{L / 2}" cy="{H}" r="58" fill="url(#sol)"/>{riscas}</g></g>
<rect y="{H}" width="{L}" height="{A - H}" fill="url(#chao)"/>
<g clip-path="url(#abaixo)" stroke="{ROXO}" stroke-opacity=".55">{verticais}<g stroke="{AZUL}">{horizontais}</g></g>
<line x1="0" y1="{H}" x2="{L}" y2="{H}" stroke="{MAGENTA}" stroke-width="1.5"/>
<text x="{L / 2}" y="{A - 16}" text-anchor="middle" font-family="{MONO}" font-size="12" letter-spacing="4" fill="{TEXTO2}">DIAMANTINO.OS · FIM DA TRANSMISSÃO<tspan class="cur" fill="{AMBAR}"> _</tspan></text>
</svg>
'''


if __name__ == "__main__":
    pasta = RAIZ / "assets" / "botoes"
    pasta.mkdir(parents=True, exist_ok=True)
    for nome, (rot, val, ico, cor, w) in {
        "linkedin": ("LINKEDIN", "diamantinojv", "perfil", AZUL, 210),
        "site": ("SITE", "1001imoveis.com", "casa", ROXO, 230),
        "3d": ("VERSÃO", "3D interativa", "cubo", MAGENTA, 220),
    }.items():
        (pasta / f"{nome}.svg").write_text(botao(rot, val, ico, cor, w), encoding="utf-8")
    (RAIZ / "assets" / "rodape.svg").write_text(rodape(), encoding="utf-8")
    print("3 botões + rodapé")
