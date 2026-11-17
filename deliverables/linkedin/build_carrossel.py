"""Gera os PDFs de um carrossel do LinkedIn a partir dos HTMLs-fonte.

Uso:  python -I deliverables/linkedin/build_carrossel.py deliverables/linkedin/<pasta-do-carrossel>

Na pasta do carrossel:
  carrossel.<idioma>.html   fonte editável (pt, en, de...), com marcadores:
                            __FONT_Regular__ / __FONT_Medium__ / __FONT_SemiBold__ / __FONT_Bold__
                            __LOGO__              logo-mark do site
                            __IMG:arquivo.ext__   arquivo da subpasta imagens/
  imagens/                  imagens usadas pelos slides

Saída, na mesma pasta:
  <pasta>-<idioma>.pdf      o PDF para subir no LinkedIn (1080 x 1350 por slide)
  previa/<idioma>.html      HTML autocontido (fontes e imagens embutidas), abre em qualquer lugar

Cada slide é medido no Edge headless: se algum texto passar do rodapé, o script avisa.
"""
from __future__ import annotations

import base64
import mimetypes
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
FONTS = ROOT / "node_modules/geist/dist/fonts/geist-sans"
LOGO = ROOT / "public/logo-mark.png"

MEASURE = """<script>document.fonts.ready.then(()=>{const out=[...document.querySelectorAll('.slide')].map((sl,i)=>{
const r=sl.getBoundingClientRect();const f=sl.querySelector('.foot').getBoundingClientRect();let max=0;
sl.querySelectorAll(':scope > *:not(.foot):not(.bg)').forEach(e=>{max=Math.max(max,e.getBoundingClientRect().bottom)});
return (i+1)+':'+((f.bottom<=r.bottom+1&&max<=f.top+1)?'ok':'ESTOURA')}).join(' ');
const loaded=[...document.fonts].filter(x=>x.status==='loaded').length;
const p=document.createElement('pre');p.id='RES';p.textContent=out+' fontes='+loaded;document.body.appendChild(p)})</script></body>"""


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix == ".woff2":
        mime = "font/woff2"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def inline(src: str, folder: Path) -> str:
    for w in ("Regular", "Medium", "SemiBold", "Bold"):
        src = src.replace(f"__FONT_{w}__", data_uri(FONTS / f"Geist-{w}.woff2"))
    src = src.replace("__LOGO__", data_uri(LOGO))
    src = re.sub(r"__IMG:([\w.\-]+)__", lambda m: data_uri(folder / "imagens" / m.group(1)), src)
    leftover = re.findall(r"__[A-Z]+[:_][\w.\-]*__", src)
    if leftover:
        sys.exit(f"marcadores sem substituição: {leftover}")
    return src


def edge(*args: str) -> str:
    res = subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", *args],
                         capture_output=True, text=True, encoding="utf-8", errors="replace")
    return res.stdout


def main() -> None:
    folder = Path(sys.argv[1]).resolve()
    (folder / "previa").mkdir(exist_ok=True)
    sources = sorted(folder.glob("carrossel.*.html"))
    if not sources:
        sys.exit("nenhum carrossel.<idioma>.html na pasta")
    problems = False
    for src_path in sources:
        lang = src_path.name.split(".")[1]
        html = inline(src_path.read_text(encoding="utf-8"), folder)
        preview = folder / "previa" / f"{lang}.html"
        preview.write_text(html, encoding="utf-8")

        probe = folder / "previa" / f"_medir-{lang}.html"
        probe.write_text(html.replace("</body>", MEASURE), encoding="utf-8")
        dom = edge("--window-size=1080,1350", "--virtual-time-budget=8000", "--dump-dom", probe.as_uri())
        probe.unlink()
        m = re.search(r'<pre id="RES">([^<]*)', dom)
        result = m.group(1) if m else "medição não retornou"
        problems |= "ESTOURA" in result or not m

        pdf = folder / f"{folder.name}-{lang}.pdf"
        edge("--no-pdf-header-footer", f"--print-to-pdf={pdf}", preview.as_uri())
        print(f"[{lang}] {pdf.name}  {result}")
    if problems:
        sys.exit("há slides com problema; ajuste o texto antes de publicar")


if __name__ == "__main__":
    main()
