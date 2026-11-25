#!/usr/bin/env python3
"""Valida todos os SVGs como XML e confere o limite de 1 MB."""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
ruim = 0
for p in sorted(raiz.glob("assets/**/*.svg")):
    tam = p.stat().st_size
    try:
        ET.parse(p)
        st = "ok"
    except ET.ParseError as e:
        st, ruim = f"XML INVALIDO: {e}", ruim + 1
    if tam > 1_000_000:
        st, ruim = st + " GRANDE", ruim + 1
    if "http" in p.read_text(encoding="utf-8").replace("http://www.w3.org", ""):
        st += " (tem URL externa!)"
        ruim += 1
    print(f"{p.relative_to(raiz)}  {tam:>8} bytes  {st}")
sys.exit(1 if ruim else 0)
