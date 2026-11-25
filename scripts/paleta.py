"""Paleta única (dados/paleta.json). Nos geradores, cor é escrita como @nome@ e trocada aqui."""
import json
import re
from pathlib import Path

_RAIZ = Path(__file__).resolve().parent.parent
_J = json.loads((_RAIZ / "dados" / "paleta.json").read_text(encoding="utf-8"))
P = {k: v for k, v in _J.items() if isinstance(v, str)}
P.update(_J["derivadas"])
P.update(_J["linguagens"])
GRUPOS = [P[n] for n in _J["grupos"]]
_TOKEN = re.compile(r"@([a-z_]+)@")


def pintar(texto):
    """troca cada @nome@ pela cor da paleta (erra alto se o nome não existir)."""
    return _TOKEN.sub(lambda m: P[m.group(1)], texto)
