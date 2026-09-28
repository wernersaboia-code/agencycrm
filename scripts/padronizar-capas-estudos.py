"""Apply the Easy Prospect study cover and page frame to an existing PDF.

The cover is rasterized; all source pages remain searchable and their
extracted wording is preserved exactly. The reusable interior frame is purely
graphical, so it does not rewrite any study content.
"""

from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


NAVY = "#003048"
BLUE = "#184890"
PAPER = "#FCFDFE"
INK = "#151A26"
MUTED = "#525F6B"
GOLD = "#F0C018"
FONTS = Path("C:/Windows/Fonts")
ROOT = Path(__file__).resolve().parent.parent


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def wrap(draw: ImageDraw.ImageDraw, value: str, face: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in value.split():
        trial = f"{current} {word}".strip()
        if current and draw.textlength(trial, font=face) > width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def tracked(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str,
            face: ImageFont.FreeTypeFont, fill: str, spacing: int) -> None:
    x, y = xy
    for letter in value:
        draw.text((x, y), letter, font=face, fill=fill)
        x += int(draw.textlength(letter, font=face)) + spacing


def brand_mark(size: int) -> Image.Image:
    """Extract the colored emblem from its original light-grey square."""
    logo = Image.open(ROOT / "public/logo-icon.png").convert("RGBA")
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            red, green, blue, _ = pixels[x, y]
            if min(red, green, blue) > 168 and max(red, green, blue) - min(red, green, blue) < 38:
                pixels[x, y] = (red, green, blue, 0)
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    return logo


def make_cover(title: str, subtitle: str, date: str, country: str,
               illustration: Path) -> Image.Image:
    width, height = 1654, 2339  # A4 at 200 dpi
    image = Image.new("RGBA", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    margin = 135

    logo = brand_mark(76)
    image.alpha_composite(logo, (margin, 116))
    draw.text((margin + 96, 126), "easy prospect", fill=NAVY, font=font("segoeuib.ttf", 42))
    tracked(draw, (1165, 144), "MARKET ENTRY STUDY", font("segoeuib.ttf", 18), BLUE, 3)
    draw.rectangle((margin, 234, width - margin, 237), fill="#CBD9E9")

    title_face = font("segoeuib.ttf", 93)
    title_lines = wrap(draw, title, title_face, width - 2 * margin)
    title_y = 345
    for line in title_lines:
        draw.text((margin, title_y), line, fill=NAVY, font=title_face)
        title_y += 113

    draw.rectangle((margin, title_y + 40, margin + 400, title_y + 49), fill=GOLD)
    subtitle_face = font("segoeui.ttf", 40)
    subtitle_y = title_y + 92
    for line in wrap(draw, subtitle, subtitle_face, width - 2 * margin):
        draw.text((margin, subtitle_y), line, fill=BLUE, font=subtitle_face)
        subtitle_y += 59

    detail_y = max(subtitle_y + 96, 850)
    draw.text((margin, detail_y), date, fill=INK, font=font("segoeuib.ttf", 31))
    tracked(draw, (margin, detail_y + 61), country.upper(), font("segoeui.ttf", 25), MUTED, 3)

    scene = Image.open(illustration).convert("RGBA")
    scene.thumbnail((width + 100, 1120), Image.Resampling.LANCZOS)
    x = (width - scene.width) // 2
    y = height - scene.height - 125
    image.alpha_composite(scene, (x, y))

    draw = ImageDraw.Draw(image)
    draw.rectangle((margin, height - 135, width - margin, height - 131), fill=BLUE)
    draw.rectangle((margin, height - 135, margin + 210, height - 131), fill=GOLD)
    return image.convert("RGB")


def interior_frame(width: float, height: float) -> BytesIO:
    buffer = BytesIO()
    layer = canvas.Canvas(buffer, pagesize=(width, height), pageCompression=1)
    layer.setFillColor(HexColor(NAVY))
    layer.rect(0, 0, 3, height, fill=1, stroke=0)
    layer.setFillColor(HexColor(GOLD))
    layer.rect(0, height - 7, 48, 7, fill=1, stroke=0)
    layer.setFillColor(HexColor(BLUE))
    layer.rect(width - 48, height - 7, 48, 7, fill=1, stroke=0)
    layer.rect(31, height - 50, width - 62, 0.6, fill=1, stroke=0)
    layer.rect(31, 16, width - 62, 0.6, fill=1, stroke=0)
    header = Image.new("RGBA", (490, 80), (255, 255, 255, 0))
    header.alpha_composite(brand_mark(64), (0, 5))
    ImageDraw.Draw(header).text((79, 18), "easy prospect", font=font("segoeuib.ttf", 36), fill=NAVY)
    layer.drawImage(ImageReader(header), 31, height - 43, width=120, height=20, mask="auto")
    layer.showPage()
    layer.save()
    buffer.seek(0)
    return buffer


def add_cover(source: Path, destination: Path, title: str, subtitle: str,
              date: str, country: str, illustration: Path) -> None:
    original = PdfReader(str(source))
    cover = make_cover(title, subtitle, date, country, illustration)
    png = BytesIO()
    cover.save(png, format="PNG", optimize=True)
    png.seek(0)

    first = original.pages[0].mediabox
    width, height = float(first.width), float(first.height)
    pdf = BytesIO()
    page = canvas.Canvas(pdf, pagesize=(width, height), pageCompression=1)
    page.drawImage(ImageReader(png), 0, 0, width=width, height=height)
    page.showPage()
    page.save()
    pdf.seek(0)

    writer = PdfWriter()
    writer.add_page(PdfReader(pdf).pages[0])
    for source_page in original.pages:
        copied = writer.add_page(source_page)
        frame = PdfReader(interior_frame(float(source_page.mediabox.width),
                                         float(source_page.mediabox.height))).pages[0]
        copied.merge_page(frame)
    writer.add_metadata({"/Title": title, "/Author": "Easy Prospect"})
    writer.add_outline_item("Market Entry Study", 0)
    writer.add_outline_item("Original study", 1)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as output:
        writer.write(output)

    result = PdfReader(str(destination))
    assert len(result.pages) == len(original.pages) + 1
    assert not (result.pages[0].extract_text() or "").strip()
    for before, after in zip(original.pages, result.pages[1:]):
        # pypdf appends one trailing newline when it merges a graphics-only page.
        assert (before.extract_text() or "").rstrip("\n") == (after.extract_text() or "").rstrip("\n"), \
            "Source wording changed"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--title", required=True)
    parser.add_argument("--subtitle", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--country", required=True)
    parser.add_argument("--illustration", required=True, type=Path)
    args = parser.parse_args()
    add_cover(args.source, args.destination, args.title, args.subtitle,
              args.date, args.country, args.illustration)


if __name__ == "__main__":
    main()
