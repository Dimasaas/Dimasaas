#!/usr/bin/env python3
"""Gera assets/mockups/*.svg: três telas ilustrativas feitas do zero, com dados 100% fictícios."""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paleta import GRUPOS, pintar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "mockups"
FONTE = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

CSS = (
    "svg{font-family:" + FONTE + "}"
    ".fi{opacity:0;animation:fi .6s ease-out forwards}@keyframes fi{to{opacity:1}}"
    ".bar{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:cresce 1.3s cubic-bezier(.16,1,.3,1) forwards}"
    "@keyframes cresce{to{transform:scaleY(1)}}"
    ".hb{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);animation:cresceh 1.4s cubic-bezier(.16,1,.3,1) forwards}"
    "@keyframes cresceh{to{transform:scaleX(1)}}"
    ".tr{stroke-dasharray:1000;stroke-dashoffset:1000;animation:traca 2.6s ease-out forwards}"
    "@keyframes traca{to{stroke-dashoffset:0}}"
    ".od{animation:rola cubic-bezier(.16,1,.3,1) both}"
    "@keyframes rola{from{transform:translateY(0)}to{transform:translateY(var(--alvo))}}"
    ".pulso{animation:pulso 2s ease-in-out infinite}@keyframes pulso{50%{opacity:.3}}"
    ".arco{animation:arco 1.8s cubic-bezier(.16,1,.3,1) forwards;stroke-dasharray:0 100}"
    "@keyframes arco{to{stroke-dasharray:var(--v) 100}}"
    ".flut{animation:flut 5s ease-in-out infinite}@keyframes flut{50%{transform:translateY(-10px)}}"
)

DEFS_COMUNS = (
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="@fundo_profundo@"/><stop offset="1" stop-color="@fundo@"/></linearGradient>'
    '<linearGradient id="borda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="@roxo@"/><stop offset="1" stop-color="@azul@"/></linearGradient>'
    '<linearGradient id="btn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="@roxo@"/><stop offset="1" stop-color="@azul@"/></linearGradient>'
    '<linearGradient id="numg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="@texto@"/><stop offset="1" stop-color="@magenta@"/></linearGradient>'
    '<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="@azul@" stop-opacity=".45"/><stop offset="1" stop-color="@azul@" stop-opacity="0"/></linearGradient>'
    '<pattern id="grade" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="@roxo@" stroke-opacity=".08"/></pattern>'
    '<clipPath id="card"><rect width="1280" height="760" rx="22"/></clipPath>'
)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def t(x, y, s, size=13, fill="@texto@", anchor="start", weight=400, extra=""):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}"{extra}>{esc(s)}</text>'


def fi(delay, conteudo):
    return f'<g class="fi" style="animation-delay:{delay:.2f}s">{conteudo}</g>'


def odometro(num, x, base, fs, delay, cid, fill="url(#numg)"):
    """número em odômetro: dígitos rolam, separadores aparecem."""
    h = int(fs * 1.15)
    wd, ws = fs * 0.6, fs * 0.32
    partes, k, cx = [], 0, x
    for ch in num:
        if ch.isdigit():
            d = int(ch)
            itens = "".join(
                f'<text x="{cx + wd / 2:.1f}" y="{base + i * h}" text-anchor="middle">{i % 10}</text>' for i in range(20)
            )
            partes.append(
                f'<g class="od" style="--alvo:{-(10 + d) * h}px;animation-duration:{2 + k * .25:.2f}s;animation-delay:{delay + k * .08:.2f}s">{itens}</g>'
            )
            cx += wd
            k += 1
        else:
            partes.append(f'<text class="fi" x="{cx + ws / 2:.1f}" y="{base}" text-anchor="middle" style="animation-delay:{delay + 1:.2f}s">{esc(ch)}</text>')
            cx += ws
    clip = f'<clipPath id="{cid}"><rect x="{x - 4}" y="{base - fs}" width="{cx - x + 8}" height="{h}"/></clipPath>'
    return clip, f'<g clip-path="url(#{cid})" fill="{fill}" style="font-size:{fs}px;font-weight:700">{"".join(partes)}</g>'


def moldura(titulo_url, corpo, clips="", extra_css="", defs=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="760" viewBox="0 0 1280 760" role="img" aria-label="{esc(titulo_url)} (ilustração com dados fictícios)">
<title>{esc(titulo_url)} (ilustração com dados fictícios)</title>
<defs>{DEFS_COMUNS}{clips}{defs}</defs>
<style>{CSS}{extra_css}</style>
<g clip-path="url(#card)">
<rect width="1280" height="760" fill="url(#bg)"/>
<rect width="1280" height="760" fill="url(#grade)"/>
{corpo}
{t(640, 750, "ilustração feita do zero · dados fictícios", 12, "@texto_secundario@", "middle")}
</g>
<rect x="1" y="1" width="1278" height="758" rx="21" fill="none" stroke="url(#borda)" stroke-width="2"/>
</svg>
'''


def janela(url):
    return (
        '<rect x="30" y="24" width="1220" height="704" rx="14" fill="@fundo@" stroke="@roxo@" stroke-opacity=".45"/>'
        '<path d="M30 38a14 14 0 0 1 14-14h1192a14 14 0 0 1 14 14v38H30z" fill="@superficie@"/>'
        '<circle cx="56" cy="50" r="6" fill="@roxo@"/><circle cx="78" cy="50" r="6" fill="@azul@"/><circle cx="100" cy="50" r="6" fill="@magenta@"/>'
        '<rect x="130" y="36" width="560" height="28" rx="14" fill="@fundo_profundo@" stroke="@roxo@" stroke-opacity=".35"/>'
        + t(150, 55, url, 13, "@texto_secundario@")
    )


def cursor(path, dur=10):
    return (
        '<g><path d="M0 0 L0 20 L5 15 L9 24 L12 23 L8 14 L15 14 Z" fill="@texto@" stroke="@fundo_profundo@" stroke-width="1.2"/>'
        f'<animateMotion dur="{dur}s" repeatCount="indefinite" path="{path}" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;1" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"/></g>'
    )


# ============================================================ financeiro
def financeiro():
    c = [janela("demo.exemplo/financeiro")]
    clips = ""
    # sidebar
    c.append('<rect x="30" y="76" width="180" height="652" fill="@superficie@"/>')
    c.append(t(54, 112, "◆ RAZÃO DEMO", 14, "@magenta_claro@", weight=700))
    for i, n in enumerate(["Painel", "Lançamentos", "Razão", "Balancete", "Relatórios"]):
        y = 150 + i * 42
        if i == 0:
            c.append(f'<rect x="42" y="{y - 20}" width="156" height="32" rx="8" fill="@roxo@" fill-opacity=".28"/>')
        c.append(t(60, y, n, 14, "@texto@" if i == 0 else "@texto_secundario@"))
    c.append(t(54, 706, "Empresa Demo Ltda", 12, "@texto_secundario@"))
    # título
    c.append(t(236, 112, "Painel financeiro · Janeiro (exemplo)", 18, "@texto@", weight=700))
    # KPIs
    kp = [("Saldo total", "250.000", "@magenta@"), ("Receitas do mês", "120.000", "@azul@"), ("Despesas do mês", "80.000", "@magenta_claro@")]
    for i, (rot, val, cor) in enumerate(kp):
        x = 236 + i * 330
        c.append(f'<rect x="{x}" y="130" width="310" height="100" rx="12" fill="@superficie@" stroke="{cor}" stroke-opacity=".45"/>')
        c.append(t(x + 20, 158, rot, 13, "@texto_secundario@"))
        clip, g = odometro(val, x + 70, 207, 40, 0.4 + i * 0.3, f"k{i}")
        clips += clip
        c.append(t(x + 20, 207, "R$", 18, cor, weight=700))
        c.append(g)
    # saldos por centro
    c.append(t(236, 268, "Saldo por centro", 15, "@texto@", weight=700))
    saldos = [("Caixa", 20000, 20), ("Bancos", 150000, 150), ("Clientes a receber", 60000, 60), ("Fornecedores", -30000, 30), ("Capital", 50000, 50)]
    for i, (n, v, w) in enumerate(saldos):
        y = 306 + i * 62
        cor = "@magenta_claro@" if v < 0 else "@azul@"
        c.append(t(236, y, n, 13, "@texto@"))
        val = f'{"-" if v < 0 else ""}R$ {abs(v):,}'.replace(",", ".")
        c.append(t(550, y, val, 13, "@texto@", "end", 700))
        c.append(f'<rect x="236" y="{y + 10}" width="314" height="10" rx="5" fill="@fundo_profundo@"/>')
        c.append(f'<rect class="hb" x="236" y="{y + 10}" width="{w / 150 * 314:.0f}" height="10" rx="5" fill="{cor}" style="animation-delay:{.6 + i * .15:.2f}s"/>')
    # gráfico
    c.append('<rect x="580" y="250" width="650" height="230" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    c.append(t(600, 278, "Receitas × despesas do mês (R$ mil)", 14, "@texto@", weight=700))
    rec = [8, 12, 10, 16, 14, 18, 15, 20, 17, 22]
    des = [6, 8, 9, 10, 9, 12, 11, 13, 12, 14]
    base, topo = 450, 300
    esc_y = (base - topo) / 24
    for g in range(0, 25, 8):
        y = base - g * esc_y
        c.append(f'<line x1="600" y1="{y:.0f}" x2="1210" y2="{y:.0f}" stroke="@roxo@" stroke-opacity=".2" stroke-dasharray="3 5"/>')
        c.append(t(594, y + 4, str(g), 10, "@texto_secundario@", "end"))
    for i in range(10):
        x = 620 + i * 59
        c.append(f'<rect class="bar" x="{x}" y="{base - rec[i] * esc_y:.1f}" width="20" height="{rec[i] * esc_y:.1f}" rx="3" fill="@roxo@" style="animation-delay:{.5 + i * .08:.2f}s"/>')
        c.append(f'<rect class="bar" x="{x + 23}" y="{base - des[i] * esc_y:.1f}" width="20" height="{des[i] * esc_y:.1f}" rx="3" fill="@azul@" style="animation-delay:{.55 + i * .08:.2f}s"/>')
    acum = [rec[i] - des[i] for i in range(10)]
    pts = " ".join(f'{"M" if i == 0 else "L"}{641 + i * 59:.0f},{base - (acum[i] + 4) * esc_y:.1f}' for i in range(10))
    c.append(f'<path class="tr" d="{pts}" pathLength="1000" fill="none" stroke="@magenta@" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:1s"/>')
    c.append('<circle cx="930" cy="272" r="5" fill="@roxo@"/>' + t(940, 276, "receitas", 11, "@texto_secundario@"))
    c.append('<circle cx="1010" cy="272" r="5" fill="@azul@"/>' + t(1020, 276, "despesas", 11, "@texto_secundario@"))
    c.append('<circle cx="1090" cy="272" r="5" fill="@magenta@"/>' + t(1100, 276, "saldo", 11, "@texto_secundario@"))
    # lançamentos
    c.append('<rect x="580" y="496" width="650" height="220" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    c.append(t(600, 524, "Últimos lançamentos", 14, "@texto@", weight=700))
    for x, s, a in [(600, "Data", "start"), (676, "Histórico", "start"), (940, "Débito", "start"), (1058, "Crédito", "start"), (1210, "Valor", "end")]:
        c.append(t(x, 548, s, 11, "@texto_secundario@", a))
    linhas = [
        ("05/01", "Venda de serviços · Cliente Exemplo", "Clientes", "Receita", "10.000"),
        ("08/01", "Compra de material · Fornecedor Demo", "Despesas", "Fornecedores", "5.000"),
        ("10/01", "Recebimento · Cliente Exemplo", "Bancos", "Clientes", "10.000"),
        ("15/01", "Pagamento de aluguel", "Despesas", "Bancos", "3.000"),
        ("20/01", "Aporte de capital", "Bancos", "Capital", "50.000"),
    ]
    c.append('<rect x="590" y="558" width="630" height="30" rx="6" fill="@roxo@" fill-opacity=".25" class="hl"/>')
    for i, (d, h, db, cr, v) in enumerate(linhas):
        y = 580 + i * 30
        c.append(fi(2.2 + i * .3, t(600, y, d, 12) + t(676, y, h, 12, "@texto@") + t(940, y, db, 12, "@magenta_claro@") + t(1058, y, cr, 12, "@magenta@") + t(1210, y, "R$ " + v, 12, "@texto@", "end", 700)))
    c.append(cursor("M 700,300 L 760,600 L 700,630 L 900,570 L 1100,640 L 700,300"))
    css = ".hl{animation:desce 10s steps(1) infinite}@keyframes desce{0%{transform:translateY(0)}20%{transform:translateY(30px)}40%{transform:translateY(60px)}60%{transform:translateY(90px)}80%{transform:translateY(120px)}}"
    return moldura("Painel financeiro (razão contábil)", "\n".join(c), clips, css)


# ============================================================== operação
def operacao():
    c = [janela("demo.exemplo/operacao")]
    clips = ""
    c.append(t(52, 112, "Operação · servidor demo", 18, "@texto@", weight=700))
    c.append('<circle cx="330" cy="107" r="6" fill="@status_ok@" class="pulso"/>' + t(344, 112, "tudo no ar", 13, "@status_ok@"))
    # KPIs topo
    kp = [("Uptime (30 dias)", "99,98", "%", "@magenta@"), ("Containers no ar", "8", "/ 8", "@azul@"), ("Backups de hoje", "3", "/ 3 ✓", "@magenta_claro@"), ("Último deploy", "2", "h atrás", "@roxo@")]
    for i, (rot, val, suf, cor) in enumerate(kp):
        x = 50 + i * 297
        c.append(f'<rect x="{x}" y="132" width="280" height="86" rx="12" fill="@superficie@" stroke="{cor}" stroke-opacity=".45"/>')
        c.append(t(x + 18, 158, rot, 12, "@texto_secundario@"))
        clip, g = odometro(val, x + 18, 204, 38, 0.3 + i * 0.25, f"k{i}")
        clips += clip
        c.append(g)
        wv = sum(0.6 * 38 if ch.isdigit() else 0.32 * 38 for ch in val)
        c.append(t(x + 22 + wv, 204, suf, 16, cor, weight=700))
    # containers
    c.append('<rect x="50" y="238" width="590" height="326" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    c.append(t(70, 266, "Containers", 14, "@texto@", weight=700))
    for x, s, a in [(94, "nome", "start"), (300, "tempo no ar", "start"), (440, "CPU", "start"), (530, "RAM", "start")]:
        c.append(t(x, 290, s, 11, "@texto_secundario@", a))
    cont = [("app-web", "12 d", 8, "310 MB"), ("app-worker", "12 d", 14, "420 MB"), ("banco-dados", "30 d", 6, "1,1 GB"), ("proxy", "30 d", 1, "40 MB"), ("cache", "30 d", 2, "90 MB"), ("fila", "12 d", 3, "120 MB"), ("monitor", "30 d", 1, "60 MB"), ("backup", "30 d", 0, "30 MB")]
    for i, (n, up, cpu, ram) in enumerate(cont):
        y = 316 + i * 30
        c.append(fi(.8 + i * .18, f'<circle class="pulso" cx="76" cy="{y - 4}" r="5.5" fill="@status_ok@" style="animation-delay:{-i * .25:.2f}s"/>' + t(94, y, n, 13, "@texto@") + t(300, y, up, 12) + t(440, y, f"{cpu} %", 12, "@magenta@") + t(530, y, ram, 12, "@magenta_claro@")))
    # backups
    c.append('<rect x="50" y="580" width="590" height="136" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    c.append(t(70, 606, "Backups de hoje", 14, "@texto@", weight=700))
    for i, (n, h, tam) in enumerate([("banco de dados", "04:00", "1,8 GB"), ("arquivos", "04:30", "6,4 GB"), ("configurações", "05:00", "12 MB")]):
        y = 634 + i * 26
        c.append(fi(2 + i * .4, t(70, y, "✓", 14, "@status_ok@", weight=700) + t(94, y, n, 13, "@texto@") + t(330, y, h, 12) + t(560, y, tam, 12, "@magenta_claro@", "end")))
    # medidores
    c.append('<rect x="660" y="238" width="570" height="170" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    for i, (rot, val, txt, cor) in enumerate([("CPU", 38, "38 %", "@magenta@"), ("RAM", 33, "5,2 / 16 GB", "@azul@"), ("Temperatura", 54, "54 °C", "@magenta_claro@")]):
        cx = 760 + i * 190
        v = val / 100 * 75
        c.append(f'<g transform="rotate(135 {cx} 332)"><circle cx="{cx}" cy="332" r="48" fill="none" stroke="@fundo_profundo@" stroke-width="12" pathLength="100" stroke-dasharray="75 100" stroke-linecap="round"/>'
                 f'<circle class="arco" cx="{cx}" cy="332" r="48" fill="none" stroke="{cor}" stroke-width="12" pathLength="100" stroke-linecap="round" style="--v:{v:.1f};animation-delay:{.5 + i * .3:.1f}s"/></g>')
        c.append(t(cx, 338, txt, 14 if len(txt) > 6 else 18, "@texto@", "middle", 700))
        c.append(t(cx, 394, rot, 12, "@texto_secundario@", "middle"))
    # histórico de CPU
    c.append('<rect x="660" y="424" width="570" height="292" rx="12" fill="@superficie@" stroke="@roxo@" stroke-opacity=".3"/>')
    c.append(t(680, 452, "CPU · últimas 24 h", 14, "@texto@", weight=700))
    for g in range(0, 101, 25):
        y = 690 - g * 2.1
        c.append(f'<line x1="700" y1="{y:.0f}" x2="1210" y2="{y:.0f}" stroke="@roxo@" stroke-opacity=".2" stroke-dasharray="3 5"/>' + t(692, y + 4, f"{g}", 10, "@texto_secundario@", "end"))
    pts = []
    for i in range(49):
        v = 30 + 14 * math.sin(i / 4.5) + 8 * math.sin(i / 1.7) + (10 if 28 < i < 34 else 0)
        pts.append((700 + i * 10.6, 690 - v * 2.1))
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    c.append(f'<path d="{d} L{pts[-1][0]:.1f},690 L700,690 Z" fill="url(#area)" class="fi" style="animation-delay:1.6s"/>')
    c.append(f'<path class="tr" d="{d}" pathLength="1000" fill="none" stroke="@magenta@" stroke-width="2.5" stroke-linejoin="round" style="animation-delay:.6s"/>')
    c.append(f'<circle class="pulso" cx="{pts[-1][0]:.1f}" cy="{pts[-1][1]:.1f}" r="5" fill="@magenta@"/>')
    # barras de uptime
    c.append(t(680, 708, "uptime", 11, "@texto_secundario@"))
    for i in range(30):
        c.append(f'<rect x="{740 + i * 16}" y="698" width="11" height="12" rx="2" fill="@status_ok@" opacity=".8" class="fi" style="animation-delay:{2 + i * .04:.2f}s"/>')
    c.append(cursor("M 120,300 L 400,420 L 800,330 L 1000,540 L 300,640 L 120,300"))
    return moldura("Painel de operação e infraestrutura", "\n".join(c), clips)


# ================================================================= app
def app():
    c = []
    clips = ""
    # lado esquerdo
    c.append(t(60, 200, "ÁREA DO CLIENTE", 14, "@magenta_claro@", extra=' letter-spacing="5"'))
    c.append(t(60, 250, "Tudo do contrato", 34, "@texto@", weight=700))
    c.append(t(60, 292, "na palma da mão", 34, "url(#numg)", weight=700))
    for i, s in enumerate(["Parcelas pagas e em aberto", "2ª via de boleto em um toque", "Documentos do contrato", "App Android"]):
        c.append(fi(.8 + i * .3, f'<circle cx="68" cy="{352 + i * 40 - 5}" r="5" fill="@magenta@"/>' + t(86, 352 + i * 40, s, 16, "@texto@")))
    # lado direito: cartões flutuantes
    for i, (txt, cor, x, y) in enumerate([("Pago ✓", "@status_ok@", 930, 220), ("2ª via gerada", "@azul@", 960, 380), ("3 de 12 pagas", "@magenta_claro@", 900, 540)]):
        c.append(f'<g class="flut" style="animation-delay:{-i * 1.4:.1f}s"><rect x="{x}" y="{y}" width="220" height="56" rx="28" fill="@superficie@" stroke="{cor}" stroke-opacity=".7"/><circle cx="{x + 28}" cy="{y + 28}" r="8" fill="{cor}"/>' + t(x + 48, y + 34, txt, 15, "@texto@", weight=700) + "</g>")
    # celular
    c.append('<rect x="440" y="22" width="400" height="716" rx="50" fill="@fundo_profundo@" stroke="@roxo@" stroke-width="3"/>')
    c.append('<rect x="454" y="36" width="372" height="688" rx="38" fill="@fundo@"/>')
    c.append('<rect x="610" y="46" width="60" height="14" rx="7" fill="@fundo_profundo@"/>')
    c.append(t(480, 62, "09:41", 12, "@texto@", weight=700) + t(802, 62, "100%", 12, "@texto@", "end"))
    # barra do app
    c.append('<rect x="454" y="78" width="372" height="56" fill="@superficie@"/>')
    c.append(t(476, 113, "Área do cliente", 18, "@texto@", weight=700))
    c.append('<circle cx="796" cy="106" r="16" fill="url(#btn)"/>' + t(796, 111, "CE", 12, "@texto@", "middle", 700))
    c.append(t(476, 168, "Olá, Cliente Exemplo", 17, "@texto@", weight=700))
    # resumo
    c.append('<rect x="472" y="184" width="336" height="92" rx="16" fill="@superficie@" stroke="@roxo@" stroke-opacity=".5"/>')
    c.append(t(490, 210, "Contrato DEMO-001 · Imóvel Demo", 12, "@texto_secundario@"))
    c.append(t(490, 238, "3 de 12 parcelas pagas", 15, "@texto@", weight=700))
    c.append('<rect x="490" y="250" width="300" height="10" rx="5" fill="@fundo_profundo@"/><rect class="hb" x="490" y="250" width="75" height="10" rx="5" fill="url(#btn)" style="animation-delay:.8s"/>')
    # parcelas
    c.append(t(476, 304, "Parcelas", 14, "@magenta_claro@", weight=700))
    rows = [("01/12", "10/01", True), ("02/12", "10/02", True), ("03/12", "10/03", True), ("04/12", "10/04", False), ("05/12", "10/05", False)]
    for i, (p, v, pago) in enumerate(rows):
        y = 318 + i * 66
        c.append(f'<rect x="472" y="{y}" width="336" height="58" rx="14" fill="@superficie@" stroke="@roxo@" stroke-opacity=".25"/>')
        corp = "@status_ok@" if pago else "@azul@"
        c.append(fi(.6 + i * .2, f'<circle cx="498" cy="{y + 29}" r="12" fill="{corp}" fill-opacity=".2" stroke="{corp}"/>' + t(498, y + 34, "✓" if pago else "•", 13, corp, "middle", 700)
                   + t(520, y + 25, f"Parcela {p}", 14, "@texto@", weight=700) + t(520, y + 44, f"venc. {v} · R$ 1.000,00", 11, "@texto_secundario@")))
        if pago:
            c.append(fi(.6 + i * .2, f'<rect x="724" y="{y + 18}" width="68" height="22" rx="11" fill="@status_ok@" fill-opacity=".18"/>' + t(758, y + 33, "Pago", 12, "@status_ok@", "middle", 700)))
        else:
            c.append(fi(.6 + i * .2, f'<rect x="716" y="{y + 15}" width="76" height="28" rx="14" fill="url(#btn)"/>' + t(754, y + 34, "2ª via", 13, "@texto@", "middle", 700)))
    # ripple do toque + toast (parcela 04 -> y=516+... botão em (754, 516+29))
    c.append('<circle class="rip" cx="754" cy="544" r="10" fill="none" stroke="@magenta@" stroke-width="3"/>')
    c.append('<g class="toast"><rect x="492" y="640" width="296" height="40" rx="20" fill="@magenta@"/>' + t(640, 665, "2ª via gerada ✓", 14, "@fundo@", "middle", 700) + "</g>")
    # navegação inferior
    c.append('<rect x="454" y="684" width="372" height="40" fill="@superficie@"/>')
    for i, (s, ativo) in enumerate([("Parcelas", True), ("Documentos", False), ("Ajuda", False)]):
        c.append(t(515 + i * 124, 709, s, 12, "@texto@" if ativo else "@texto_secundario@", "middle", 700 if ativo else 400))
    c.append(cursor("M 640,420 L 754,548 L 754,548 L 600,300 L 640,420", 9))
    css = (
        ".rip{transform-box:fill-box;transform-origin:center;opacity:0;animation:rip 9s linear infinite}"
        "@keyframes rip{0%,36%{opacity:0;transform:scale(.3)}38%{opacity:1;transform:scale(.6)}50%{opacity:0;transform:scale(3)}100%{opacity:0}}"
        ".toast{opacity:0;animation:toast 9s ease-in-out infinite}"
        "@keyframes toast{0%,42%{opacity:0;transform:translateY(20px)}48%,72%{opacity:1;transform:translateY(0)}80%,100%{opacity:0;transform:translateY(20px)}}"
    )
    return moldura("App Android: área do cliente", "\n".join(c), clips, css)


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "painel-financeiro.svg").write_text(pintar(financeiro()), encoding="utf-8")
    (SAIDA / "painel-operacao.svg").write_text(pintar(operacao()), encoding="utf-8")
    (SAIDA / "app-cliente.svg").write_text(pintar(app()), encoding="utf-8")
    print("ok")
