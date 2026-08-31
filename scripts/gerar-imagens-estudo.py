"""
Gera as imagens de amostra que a home exibe em "O que está incluído".

Por que existe: as imagens são páginas REAIS de um estudo do catálogo, e
precisam ser refeitas quando o estudo de vitrine mudar de edição. Sem este
script, ninguém sabe de qual arquivo nem de quais páginas elas saíram.

Duas regras que não podem se perder:

1. O PDF de origem é sempre a versão JÁ REDIGIDA (`No site - revisado`). A
   imagem sai em 150 dpi, resolução em que e-mail é perfeitamente legível — a
   versão original vazaria na vitrine o contato que foi removido do arquivo.

2. A página do diretório entra com a coluna de contato BORRADA, e o borrão é
   aplicado no pixel, depois da rasterização. Tarja desenhada sobre o PDF
   deixaria o texto extraível; aqui o texto simplesmente não existe na imagem.
   A geometria vem do próprio PDF (o cabeçalho da coluna e a borda da tabela),
   nunca de coordenada chutada: uma linha que transborda a célula deixaria
   letra nítida de fora do borrão.

Uso:
    python scripts/gerar-imagens-estudo.py "C:/caminho/estudo.pdf"
"""

import sys
from pathlib import Path

import fitz
from PIL import Image, ImageFilter

DPI = 150

# A imagem é gravada mais estreita do que rasterizada: 150 dpi mantém o texto
# nítido para o borrão ser aplicado com precisão, e reduzir depois entrega
# arquivo de ~60 KB que ainda abre legível em tela cheia. Rasterizar direto em
# resolução baixa borraria o texto todo, não só a coluna de contato.
LARGURA_FINAL = 1000

DESTINO = Path(__file__).resolve().parent.parent / "public" / "estudo-exemplo"

# Página (base 1) -> nome do arquivo. Nunca inclua uma página do diretório sem
# borrar: seção 7 é o produto, e publicá-la legível entrega o que se vende.
PAGINAS = {1: "capa", 2: "indice", 4: "dados"}
PAGINA_DIRETORIO = 13


def salvar(imagem: Image.Image, nome: str) -> None:
    caminho = DESTINO / f"{nome}.webp"
    altura = round(imagem.height * LARGURA_FINAL / imagem.width)
    reduzida = imagem.resize((LARGURA_FINAL, altura), Image.LANCZOS)
    reduzida.save(caminho, quality=80, method=6)
    print(f"  {caminho.name}: {caminho.stat().st_size // 1024} KB")


def rasterizar(pagina: fitz.Page) -> Image.Image:
    pix = pagina.get_pixmap(dpi=DPI)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def borrar_coluna_de_contato(pagina: fitz.Page, imagem: Image.Image) -> Image.Image:
    escala = DPI / 72
    cabecalho = pagina.search_for("Contact route")[0]
    fim_tabela = pagina.search_for("7.3 National full-range")[0]

    # A borda direita vem do desenho da tabela, não da largura da página.
    bordas = [desenho["rect"] for desenho in pagina.get_drawings()]
    direita = max(r.x1 for r in bordas if r.x1 < pagina.rect.width - 10)

    caixa = (
        cabecalho.x0 - 6,
        cabecalho.y1 + 4,
        direita - 2,
        fim_tabela.y0 - 24,
    )
    regiao = tuple(int(valor * escala) for valor in caixa)
    imagem.paste(imagem.crop(regiao).filter(ImageFilter.GaussianBlur(7)), regiao)
    return imagem


def main() -> None:
    origem = Path(sys.argv[1])
    if "revisado" not in str(origem):
        print(f"ABORTADO: {origem.name} não vem da pasta revisada — use o PDF já redigido.")
        raise SystemExit(1)

    DESTINO.mkdir(parents=True, exist_ok=True)
    documento = fitz.open(origem)
    print(f"{origem.name} ({documento.page_count} páginas) -> {DESTINO}")

    for numero, nome in PAGINAS.items():
        salvar(rasterizar(documento[numero - 1]), nome)

    pagina = documento[PAGINA_DIRETORIO - 1]
    salvar(borrar_coluna_de_contato(pagina, rasterizar(pagina)), "diretorio")


if __name__ == "__main__":
    main()
