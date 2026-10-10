"""Re-typeset a market entry study as an editorial PDF.

Reads the supplied PDF, extracts every content line and table cell from the
study body, and builds a portrait A4 report with a chapter rail and live contents.
The source file is never modified. Visual navigation is newly added; the study
copy and table data come from the source PDF.

After building, the text of the new file is compared with the source. When more
than --max-missing of the source words are absent, the output is renamed to
`*.rejeitado.pdf` and the script exits with status 2: a study that silently
lost a directory column must never reach the shop.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = Path("C:/Windows/Fonts")
# The reports are designed to be distributed and printed as portrait A4.
WIDTH, HEIGHT = A4
NAVY = colors.HexColor("#13283A")
PAPER = colors.HexColor("#F5F0E7")
BODY = colors.HexColor("#FCF9F2")
RUST = colors.HexColor("#D85A32")
INK = colors.HexColor("#243B4C")
MUTED = colors.HexColor("#63727C")
LINE = colors.HexColor("#D9D1C5")
GREEN = colors.HexColor("#5B836D")
RAIL = 122
BODY_X = 140
BODY_W = WIDTH - BODY_X - 22


@dataclass
class Block:
    kind: str
    text: str = ""
    rows: list[list[str]] | None = None
    chapter: int = 0


def register_fonts() -> None:
    for alias, filename in [
        ("Segoe", "segoeui.ttf"),
        ("SegoeBold", "segoeuib.ttf"),
        ("Georgia", "georgia.ttf"),
        ("GeorgiaBold", "georgiab.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(alias, str(FONT_DIR / filename)))
    pdfmetrics.registerFontFamily("Segoe", normal="Segoe", bold="SegoeBold")
    pdfmetrics.registerFontFamily("Georgia", normal="Georgia", bold="GeorgiaBold")


BOLD_ON, BOLD_OFF = "\x01", "\x02"
MONTHS = (
    "January|February|March|April|May|June|July|August|September|October|November|December"
    "|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro"
    "|enero|febrero|marzo|mayo|junio|julio|septiembre|octubre|noviembre|diciembre"
)

# The frame is the only text this script writes itself; the study copy keeps
# the language of the source. The shop has editions in these three languages.
LABELS = {
    "en": {"kicker": "MARKET ENTRY STUDY", "contents": "Table of Contents", "rail": "CONTENTS"},
    "pt": {"kicker": "ESTUDO DE ENTRADA NO MERCADO", "contents": "Sumário", "rail": "SUMÁRIO"},
    "es": {"kicker": "ESTUDIO DE ENTRADA AL MERCADO", "contents": "Contenido", "rail": "CONTENIDO"},
}

# Heading of the source's own table of contents, which the generated one replaces.
CONTENTS_HEADING = re.compile(r"^(?:table of contents|contents|sumário|contenido|índice)$", re.I)
# Numbered first-level heading: "1. Executive Summary" and also "1 Executive summary".
CHAPTER = re.compile(r"^(\d{1,2})\.?\s+\S")
# Running header / footer zone of the source pages (points from the top).
# Footer zone is measured from the page bottom: some studies turn wide tables
# to landscape pages, where the footer sits at 549 pt instead of 790.
HEADER_ZONE, FOOTER_MARGIN = 60, 72
PAGE_NUMBER = re.compile(r"(?:^|\|)\s*(?:page\s+)?\d+(?:\s+of\s+\d+)?\s*$", re.I)
# Directory columns that hold contact data go to the right side of a company card.
CONTACT_HEAD = re.compile(
    r"web|site|e-?\s?mail|phone|tel|switchboard|contact|registration|route|approach|decision|buyer|"
    r"supplier access|supplier form|names|links", re.I)
# Short classification column shown as the card's tag line.
TYPE_HEAD = re.compile(r"\b(?:type|role|category|classification|channel type)\b", re.I)


def markup(value: str) -> str:
    safe = html.escape(value, quote=False)
    safe = safe.replace(BOLD_ON, "<b>").replace(BOLD_OFF, "</b>")
    return safe.replace("\n", "<br/>")


def plain(value: str) -> str:
    return value.replace(BOLD_ON, "").replace(BOLD_OFF, "")


def line_text(line: dict) -> str:
    """Line text with inline bold runs kept.

    pdfplumber exposes no space glyphs, so word breaks are rebuilt from the gap
    between glyphs. If the result disagrees with the text pdfplumber extracted,
    the extracted text (without inline bold) wins.
    """
    out: list[str] = []
    bold = False
    previous = None
    for char in line["chars"]:
        text = char["text"]
        if previous is not None and text.strip() and char["x0"] - previous["x1"] > char["size"] * 0.2:
            out.append(" ")
        previous = char
        is_bold = "Bold" in char["fontname"]
        if text.strip() and is_bold != bold:
            out.append(BOLD_ON if is_bold else BOLD_OFF)
            bold = is_bold
        out.append(text)
    if bold:
        out.append(BOLD_OFF)
    result = "".join(out).strip()
    if " ".join(plain(result).split()) != " ".join(line["text"].split()):
        result = line["text"].strip()
    return symbol_bullets(result)


def symbol_bullets(value: str) -> str:
    """Word writes list bullets as U+F0B7 (Symbol font); they become plain bullets."""
    return value.replace(chr(0xF0B7), "•")


def line_size(line: dict) -> float:
    return max((char["size"] for char in line["chars"]), default=10)


COVER_TITLE_SIZE = 18
DATE = re.compile(rf"(?:(?:{MONTHS})\s+(?:de\s+)?)?20\d\d", re.I)
META = re.compile(
    rf"\b(?:edition|edição|edición|status|estado|atualizado|actualizado|updated|{MONTHS})\b.*20\d\d"
    r"|^(?:language|idioma|coverage|geographic scope)\b", re.I)
META_PREFIX = re.compile(
    r"^(?:status of research|reference edition|edition|edição|edición|atualizado em|actualizado en|"
    r"estado|updated)\s*[:·–-]?\s*", re.I)


COVER_LABEL = re.compile(
    r"market-?entry(?:study|guide)|estudodeentradanomercado|estudiodeentradaalmercado", re.I)


def is_cover_label(text: str) -> bool:
    """The kicker above the cover title, also when letter-spaced ("MA R K E T E N TR Y")."""
    return bool(COVER_LABEL.fullmatch(re.sub(r"\s+", "", text)))


def find_cover(pdf) -> int:
    """First page carrying the cover title (set far larger than any heading).

    A shop PDF opens on its cover; a `_premium` file has a graphic cover in
    front of it, whose page holds no extractable text.
    """
    return next(
        index for index, page in enumerate(pdf.pages)
        if any(line_size(line) >= COVER_TITLE_SIZE for line in page.extract_text_lines())
    )


def read_cover(page) -> dict[str, str]:
    """Title, subtitle, scope, date and language from the source cover.

    The covers in the shop share one structure and differ in wording: an
    optional label ("MARKET ENTRY STUDY", "MARKET-ENTRY GUIDE", letter-spaced or
    absent), the title in the largest type, a subtitle, a scope line in smaller
    type, then edition / language / coverage lines. The label is dropped (the
    new cover sets its own); every other line is kept.
    """
    rows = [
        (line_size(line), plain(line_text(line)))
        for line in page.extract_text_lines()
        if HEADER_ZONE / 2 < line["top"] < page.height - FOOTER_MARGIN
    ]
    rows = [(size, text) for size, text in rows if text]
    stop = next(
        (i for i, (size, text) in enumerate(rows)
         if CONTENTS_HEADING.match(text) or (CHAPTER.match(text) and size < COVER_TITLE_SIZE)),
        len(rows),
    )
    rows = [(size, text) for size, text in rows[:stop] if not is_cover_label(text)]
    # The title is the largest type left once the label is gone (15 pt on the
    # exotic-fruit editions, whose 20 pt label would otherwise win). A second
    # title line may be set smaller ("The Netherlands" 30 pt / "HoReCa &
    # Foodservice Market" 20 pt), the subtitle clearly smaller still.
    largest = max(size for size, _ in rows)
    start = next(i for i, (size, _) in enumerate(rows) if size >= largest - 0.5)
    end = start + 1
    while end < len(rows) and (rows[end][0] >= 16 or rows[end][0] >= largest - 0.5):
        end += 1
    title = " ".join(text for _, text in rows[start:end])

    subtitle: list[str] = []
    scope: list[str] = []
    date = ""
    language: list[str] = []
    for size, text in rows[end:]:
        if META.search(text):
            if re.match(r"^(?:language|idioma|coverage|geographic scope)\b", text, re.I) or date:
                language.append(text)
            else:
                date = text
        elif size >= 11.5 and not scope and not date:
            subtitle.append(text)
        else:
            scope.append(text)
    # The running header shows just the month and year, wherever the cover
    # gives them ("Directory of importers … · July 2026", "Prepared … · 2026").
    found = next((DATE.search(text) for text in [date, *scope, *language] if DATE.search(text)), None)
    return {
        "title": title,
        "subtitle": " ".join(subtitle),
        "scope": " ".join(scope),
        "language": " · ".join(language),
        "date": date,
        "date_label": found.group(0) if found else "",
    }


def furniture(pdf) -> set[str]:
    """Running header and footer lines: repeated at the page edge on many pages."""
    seen: Counter[str] = Counter()
    for page in pdf.pages:
        keys = {
            signature(line["text"]) for line in page.extract_text_lines()
            if line["top"] < HEADER_ZONE or line["top"] > page.height - FOOTER_MARGIN
        }
        seen.update(keys)
    return {key for key, count in seen.items() if count >= 3 and count >= len(pdf.pages) * 0.3}


def signature(text: str) -> str:
    return re.sub(r"\d+", "#", " ".join(text.lower().split()))


def is_furniture(line: dict, repeated: set[str], page_height: float) -> bool:
    if HEADER_ZONE <= line["top"] <= page_height - FOOTER_MARGIN:
        return False
    return signature(line["text"]) in repeated or bool(PAGE_NUMBER.fullmatch(line["text"].strip()))


def chapter_size(pdf, cover_index: int) -> float:
    """Type size of the numbered chapter headings (14, 15 or 16 pt in the shop).

    The largest size used by at least three numbered lines: the source table of
    contents repeats the same numbers in body type, so the count alone would
    pick the contents entries.
    """
    sizes: Counter[float] = Counter()
    for page in pdf.pages[cover_index:]:
        for line in page.extract_text_lines():
            size = round(line_size(line), 1)
            if CHAPTER.match(line["text"]) and "...." not in line["text"] and 12.5 < size < COVER_TITLE_SIZE:
                sizes[size] += 1
    return max(size for size, count in sizes.items() if count >= 3)


def clean_cell(value: str | None) -> str:
    return symbol_bullets(" ".join((value or "").split()))


def table_rows(page, table, lines: list[dict]) -> tuple[list[list[str]], tuple[float, ...]]:
    """Rows of a source table, and the area its text occupies.

    Some "field | value" tables have a ruling only on the left column, so the
    detected table stops there while the values run on to the right margin.
    Without this, those values were neither table cells nor body lines: in
    the UAE study a quarter of the directory disappeared. When text crosses the
    right edge, each row is completed with the text to its right.
    """
    rows = [[clean_cell(cell) for cell in row] for row in table.extract()]
    x0, top, x1, bottom = table.bbox
    crosses = any(
        top - 1 <= (line["top"] + line["bottom"]) / 2 <= bottom + 1
        and line["x0"] < x1 and line["x1"] > x1 + 15
        for line in lines
    )
    if not crosses:
        return rows, table.bbox
    right = page.width - 20
    extended = []
    for cells, row in zip(rows, table.rows):
        _, row_top, _, row_bottom = row.bbox
        extra = page.crop((x1, row_top, right, row_bottom)).extract_text() or ""
        extended.append(cells + [clean_cell(extra)])
    return extended, (x0, top, right, bottom)


def is_chapter_heading(line: dict, h1_size: float) -> bool:
    text = line["text"].strip()
    return (
        h1_size <= line_size(line) < COVER_TITLE_SIZE
        and not re.match(r"^\d+\.\d", text) and not CONTENTS_HEADING.match(text)
    )


def body_position(pdf, cover_index: int, h1_size: float) -> tuple[int, float]:
    """Page and height where the study body starts.

    That is chapter 1, or the unnumbered heading in chapter type that precedes
    it ("Executive Summary" in the Swiss, Italian and Omani studies, whose
    numbering starts after it). The body can share its page with the cover and
    the source contents, so only headings after the last contents line count.
    """
    first = next(
        (index, line["top"])
        for index in range(cover_index, len(pdf.pages))
        for line in pdf.pages[index].extract_text_lines()
        if CHAPTER.match(line["text"]) and CHAPTER.match(line["text"]).group(1) == "1"
        and line_size(line) >= h1_size
    )
    candidate = None
    # The cover page itself only counts when chapter 1 is on it.
    start_page = cover_index if first[0] == cover_index else cover_index + 1
    for index in range(start_page, first[0] + 1):
        for line in pdf.pages[index].extract_text_lines():
            if (index, line["top"]) >= first:
                return candidate or first
            text = line["text"].strip()
            in_contents = (
                CONTENTS_HEADING.match(text) or "...." in text
                or (CHAPTER.match(text) and line_size(line) < h1_size)
            )
            if in_contents:
                candidate = None
            elif candidate is None and is_chapter_heading(line, h1_size) and not CHAPTER.match(text):
                if index != cover_index:
                    candidate = (index, line["top"])
    return candidate or first


def extract_blocks(source: Path) -> tuple[list[Block], dict[str, str], list[str]]:
    with pdfplumber.open(source) as pdf:
        cover_index = find_cover(pdf)
        metadata = read_cover(pdf.pages[cover_index])
        repeated = furniture(pdf)
        h1_size = chapter_size(pdf, cover_index) - 0.5

        body_start, body_top = body_position(pdf, cover_index, h1_size)
        blocks: list[Block] = []
        chapters: list[str] = []
        current_chapter = 0

        # The cover and original table of contents become the new cover and
        # generated contents page, respectively.
        for page_index, page in enumerate(pdf.pages[body_start:], start=body_start):
            lines = [
                line for line in page.extract_text_lines()
                if not is_furniture(line, repeated, page.height)
                and not (page_index == body_start and line["top"] < body_top - 1)
            ]
            events: list[tuple[float, int, object]] = []
            bboxes = []
            for table in page.find_tables():
                if page_index == body_start and table.bbox[3] < body_top:
                    continue
                rows, bbox = table_rows(page, table, lines)
                bboxes.append(bbox)
                events.append((table.bbox[1], 0, rows))

            for line in lines:
                middle = (line["top"] + line["bottom"]) / 2
                in_table = any(
                    bbox[1] - 1 <= middle <= bbox[3] + 1
                    and line["x1"] >= bbox[0] - 1 and line["x0"] <= bbox[2] + 1
                    for bbox in bboxes
                )
                if not in_table:
                    events.append((line["top"], 1, line))
            events.sort(key=lambda item: (item[0], item[1]))

            pending: list[dict] = []
            pending_kind = ""

            def flush() -> None:
                nonlocal pending, pending_kind, current_chapter
                if not pending:
                    return
                value = ""
                for line in pending:
                    text = line_text(line)
                    # A range split at the line end ("50,000–" / "70,000") stays closed up.
                    glue = value.endswith("–") and text[:1].isdigit()
                    value = f"{value}{'' if glue or not value else ' '}{text}"
                value = value.strip()
                if pending_kind not in ("body", "bullet"):
                    value = plain(value)
                if value:
                    if pending_kind == "h1":
                        chapters.append(value)
                        current_chapter = len(chapters)
                    blocks.append(Block(pending_kind, value, chapter=current_chapter))
                pending = []
                pending_kind = ""

            for _, event_kind, event in events:
                if event_kind == 0:
                    flush()
                    blocks.append(Block("table", rows=event, chapter=current_chapter))
                    continue

                line = event
                value = plain(line_text(line))
                if not value:
                    continue
                size = line_size(line)
                if is_chapter_heading(line, h1_size):
                    kind = "h1"
                elif size >= 11.5 and re.match(r"^\d+\.\d+\s", value):
                    kind = "h2"
                elif value.startswith("•"):
                    kind = "bullet"
                elif size >= 11 and all("Bold" in char["fontname"] for char in line["chars"][:4]):
                    kind = "h3"
                else:
                    kind = "body"

                gap = line["top"] - pending[-1]["bottom"] if pending else 0
                is_heading_wrap = (
                    pending_kind in ("h1", "h2") and kind in ("h1", "h2", "body")
                    and size >= 11.5 and gap < 5 and not re.match(r"^\d+\.\d*\s", value)
                )
                # A numbered list item in body type ("2. Develop…") opens its own
                # paragraph, like a bullet; otherwise the list ran into one block.
                list_item = kind == "body" and re.match(r"^\d{1,2}[.)]\s", value)
                continues = (
                    pending and (kind == pending_kind or kind == "body" and pending_kind == "bullet")
                    and gap < 6 and kind != "bullet" and not list_item
                ) or is_heading_wrap
                if not continues:
                    flush()
                    pending_kind = kind
                pending.append(line)
            flush()
    # A few source paragraphs wrap across a page break. PDF extraction can
    # expose their final line as an isolated paragraph, which creates an almost
    # empty editorial page when the following chapter is forced to a new page.
    # Rejoin those fragments before typesetting.
    normalized: list[Block] = []
    for block in blocks:
        if (
            block.kind == "body" and len(block.text) < 145 and normalized
            and normalized[-1].kind == "body" and normalized[-1].chapter == block.chapter
            and not re.match(r"^\d{1,2}[.)]\s", plain(block.text))
        ):
            normalized[-1].text = f"{normalized[-1].text} {block.text}"
        else:
            normalized.append(block)
    return normalized, metadata, chapters


def styles() -> dict[str, ParagraphStyle]:
    common = dict(textColor=INK, fontName="Segoe", alignment=TA_LEFT, splitLongWords=1)
    return {
        "h1": ParagraphStyle("Chapter", fontName="GeorgiaBold", fontSize=27, leading=31,
                             textColor=NAVY, spaceBefore=7, spaceAfter=18, keepWithNext=True),
        "h2": ParagraphStyle("Section", fontName="GeorgiaBold", fontSize=17, leading=21,
                             textColor=NAVY, spaceBefore=17, spaceAfter=9, keepWithNext=True),
        "h3": ParagraphStyle("Minor", fontName="SegoeBold", fontSize=10.5, leading=14,
                             textColor=NAVY, spaceBefore=12, spaceAfter=6, keepWithNext=True),
        "body": ParagraphStyle("Body", fontSize=10.0, leading=14.4,
                               spaceAfter=11, **common),
        "bullet": ParagraphStyle("Bullet", fontSize=9.9, leading=14.2,
                                 leftIndent=11, firstLineIndent=-8, spaceAfter=9, **common),
        "card": ParagraphStyle("Summary card", fontSize=10, leading=14.8, **common),
        "cell": ParagraphStyle("Table cell", fontSize=8.4, leading=11.5, **common),
        "cellhead": ParagraphStyle("Table heading", fontName="SegoeBold", fontSize=8.3,
                                   leading=10.4, textColor=colors.white, splitLongWords=1),
        "company": ParagraphStyle("Company", fontName="GeorgiaBold", fontSize=13.2,
                                  leading=16.5, textColor=NAVY),
        "company_long": ParagraphStyle("Company, long", fontName="GeorgiaBold", fontSize=11,
                                       leading=14, textColor=NAVY),
        "tag": ParagraphStyle("Tag", fontName="SegoeBold", fontSize=8.2,
                              leading=11, textColor=RUST),
        "toc": ParagraphStyle("Contents", fontName="GeorgiaBold", fontSize=12,
                              leading=17, textColor=NAVY),
    }


def summary_card(value: str, st: dict[str, ParagraphStyle]) -> Table:
    card = Table([[Paragraph(markup(value), st["card"])]], colWidths=[BODY_W - 16], hAlign="LEFT")
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF9")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, RUST),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    card.spaceAfter = 9
    return card


def is_directory(rows: list[list[str]]) -> bool:
    """Company directory: led by a "Company…" column and with a contact column.

    Tables led by "Company" without any contact column are comparison matrices
    (categories ticked per retailer); those stay tables.
    """
    head = rows[0]
    return (
        len(rows) > 1 and len(head) >= 2 and head[0].lower().startswith("company")
        and any(CONTACT_HEAD.search(cell) for cell in head[1:])
        # A first column holding whole profiles makes a poor card title.
        and all(len(row[0]) <= 170 for row in rows[1:] if row)
    )


def labelled(fields: list[tuple[str, str]], st: dict[str, ParagraphStyle]) -> list[Paragraph]:
    """One paragraph per field; the label is shown only when the side holds several."""
    if len(fields) == 1:
        _, value = fields[0]
        value = re.sub(r"\s+(?=(?:Web|Phone|E-mail|Email|Note|Tel):)", "\n", value)
        return [Paragraph(markup(value), st["cell"])]
    return [
        Paragraph(f"<b>{markup(label)}:</b> {markup(value)}", st["cell"])
        for label, value in fields
    ]


def directory_cards(rows: list[list[str]], st: dict[str, ParagraphStyle]) -> list:
    """Company cards whose layout follows the table header, column by column.

    The shop has about a hundred directory headers ("Company / location |
    Profile | Contact", "Company | Type | Profile | Website | General e-mail |
    Phone | Contact route", …). Nothing is dropped: the first column is the
    company, a short type column becomes the tag line, contact columns go to the
    right and every other column to the left, each under its own header.
    """
    head = rows[0]
    width = len(head)
    type_index = next(
        (index for index, label in enumerate(head) if index and TYPE_HEAD.search(label)
         and not CONTACT_HEAD.search(label)
         and max((len(row[index]) for row in rows[1:] if len(row) > index), default=0) <= 70),
        None,
    )
    cards: list = []
    for row in rows[1:]:
        if not any(row):
            continue
        row = row + [""] * (width - len(row))
        left: list[tuple[str, str]] = []
        right: list[tuple[str, str]] = []
        for index in range(1, width):
            if index == type_index or not row[index]:
                continue
            side = right if CONTACT_HEAD.search(head[index]) else left
            side.append((head[index], row[index]))
        tag = f"{head[type_index]}: {row[type_index]}" if type_index is not None and row[type_index] else ""
        left_cell = labelled(left, st) if left else [Paragraph("", st["cell"])]
        right_cell = labelled(right, st) if right else [Paragraph("", st["cell"])]
        card = Table([
            [Paragraph(markup(row[0]), st["company"] if len(row[0]) <= 60 else st["company_long"]),
             Paragraph(markup(tag), st["tag"])],
            [left_cell, right_cell],
        ], colWidths=[(BODY_W - 16) * .56, (BODY_W - 16) * .44], hAlign="LEFT")
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFCF6")),
            ("LINEABOVE", (0, 0), (-1, 0), 1.2, NAVY),
            ("LINEBELOW", (0, -1), (-1, -1), .45, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
            ("TOPPADDING", (0, 1), (-1, 1), 5),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 11),
        ]))
        card.spaceAfter = 12
        if row_height([left_cell, right_cell], [(BODY_W - 16) * .56, (BODY_W - 16) * .44]) > MAX_ROW:
            cards.extend(record(head, row, st))
        else:
            cards.append(card)
    return cards


# Taller than this, a table row cannot fit on one page of the body frame.
MAX_ROW = (HEIGHT - 102) * 0.85


def row_height(cells: list, widths: list[float]) -> float:
    tallest = 0.0
    for cell, width in zip(cells, widths):
        paragraphs = cell if isinstance(cell, list) else [cell]
        tallest = max(tallest, sum(p.wrap(width - 16, HEIGHT)[1] for p in paragraphs))
    return tallest


def record(head: list[str], row: list[str], st: dict[str, ParagraphStyle]) -> list[Paragraph]:
    """A table row as labelled paragraphs, which can break across pages."""
    out = [Paragraph(markup(row[0]), st["h3"])]
    for label, value in zip(head[1:], row[1:]):
        if value:
            out.append(Paragraph(f"<b>{markup(label)}:</b> {markup(value)}", st["body"]))
    return out


def standard_table(rows: list[list[str]], st: dict[str, ParagraphStyle]) -> list:
    count = max(len(row) for row in rows)
    usable = BODY_W - 16
    if count == 3:
        widths = [usable * .29, usable * .17, usable * .54]
    elif count == 2:
        widths = [usable * .32, usable * .68]
    else:
        widths = [usable / count] * count
    cells = [
        [Paragraph(markup(cell), st["cellhead"] if index == 0 else st["cell"])
         for cell in row + [""] * (count - len(row))]
        for index, row in enumerate(rows)
    ]
    # A row taller than a page (one cell holding a whole directory section)
    # would stop the build; that table is set as labelled paragraphs instead.
    if any(row_height(row, widths) > MAX_ROW for row in cells):
        head = rows[0] + [""] * (count - len(rows[0]))
        out: list = []
        for row in rows[1:]:
            out.extend(record(head, row + [""] * (count - len(row)), st))
        return out
    table = Table(cells, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFFCF6"), PAPER]),
        ("LINEBELOW", (0, 0), (-1, 0), .8, NAVY),
        ("LINEBELOW", (0, 1), (-1, -1), .35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    table.spaceBefore = 5
    table.spaceAfter = 14
    return [table]


class StudyDoc(BaseDocTemplate):
    def __init__(self, filename: str, metadata: dict[str, str], chapters: list[str], illustration: Path,
                 country: str, lang: str = "en"):
        super().__init__(filename, pagesize=(WIDTH, HEIGHT), leftMargin=0, rightMargin=0,
                         topMargin=0, bottomMargin=0, title=metadata["title"], author="Easy Prospect")
        self.metadata = metadata
        self.chapters = chapters
        self.illustration = illustration
        self.country = country
        self.labels = LABELS[lang]
        self.date_label = metadata["date_label"]
        cover_frame = Frame(0, 0, WIDTH, HEIGHT, leftPadding=0, bottomPadding=0,
                            rightPadding=0, topPadding=0, id="cover")
        body_frame = Frame(BODY_X, 48, BODY_W, HEIGHT - 102, leftPadding=8,
                           rightPadding=8, topPadding=6, bottomPadding=6, id="main")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame], onPage=self.draw_cover),
            PageTemplate(id="body", frames=[body_frame], onPage=self.draw_body, onPageEnd=self.draw_rail),
        ])

    def afterFlowable(self, flowable) -> None:
        if isinstance(flowable, Paragraph) and getattr(flowable, "chapter_title", None):
            self.current_chapter = flowable.chapter_index
            key = f"chapter-{self.page}-{len(self.canv._code)}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.chapter_title, key, level=0)
            self.notify("TOCEntry", (0, flowable.chapter_title, self.page, key))

    def draw_cover(self, canv, doc) -> None:
        canv.setFillColor(BODY)
        canv.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
        canv.setFillColor(NAVY)
        canv.rect(0, 342, WIDTH, HEIGHT - 342, fill=1, stroke=0)
        canv.drawImage(str(self.illustration), 20, 72, width=WIDTH - 40, height=270,
                       preserveAspectRatio=True, anchor="c", mask="auto")
        canv.setFont("SegoeBold", 12)
        canv.setFillColor(colors.white)
        canv.drawString(40, 542, "easy prospect")
        canv.setFont("SegoeBold", 8)
        canv.setFillColor(RUST)
        canv.drawString(40, 514, self.labels["kicker"])
        canv.setStrokeColor(RUST)
        canv.setLineWidth(3)
        canv.line(40, 499, 140, 499)

        title = Paragraph(markup(self.metadata["title"]), ParagraphStyle(
            "Cover title", fontName="GeorgiaBold", fontSize=28, leading=32,
            textColor=colors.white))
        _, h = title.wrap(WIDTH - 80, 140)
        title.drawOn(canv, 40, 496 - h)
        subtitle = Paragraph(markup(self.metadata["subtitle"]), ParagraphStyle(
            "Cover subtitle", fontName="Segoe", fontSize=9.4, leading=13.2,
            textColor=colors.HexColor("#DDE6E9")))
        _, sh = subtitle.wrap(WIDTH - 80, 100)
        subtitle.drawOn(canv, 40, 484 - h - sh)

        canv.setFillColor(NAVY)
        canv.setFont("SegoeBold", 8.4)
        canv.drawString(40, 306, self.metadata["date"])
        canv.setFont("Segoe", 8.1)
        canv.drawString(40, 290, self.metadata["language"])
        scope = Paragraph(markup(self.metadata["scope"]), ParagraphStyle(
            "Scope", fontName="Segoe", fontSize=9.1, leading=13.1, textColor=INK))
        _, scope_h = scope.wrap(WIDTH - 80, 100)
        scope.drawOn(canv, 40, 55 - scope_h)
        canv.setStrokeColor(RUST)
        canv.setLineWidth(2)
        canv.line(40, 276, 105, 276)

    def draw_rail(self, canv, doc) -> None:
        active = getattr(self, "current_chapter", 0)
        y = HEIGHT - 104
        for index, chapter in enumerate(self.chapters, start=1):
            short = re.sub(r"^\d+\.?\s*", "", chapter)
            on = index == active
            para = Paragraph(markup(short), ParagraphStyle(
                "Rail", fontName="SegoeBold" if on else "Segoe", fontSize=7.1, leading=9,
                textColor=RUST if on else INK))
            _, h = para.wrap(RAIL - 24 - 24, 40)
            canv.setFont("SegoeBold" if on else "Segoe", 7.1)
            canv.setFillColor(RUST if on else MUTED)
            # The study's own number; an unnumbered chapter ("Executive Summary") shows none.
            number = CHAPTER.match(chapter)
            canv.drawString(24, y - 7, f"{int(number.group(1)):02d}" if number else "")
            para.drawOn(canv, 24 + 17, y - h)
            bottom = y - max(h, 9) - 6
            canv.setStrokeColor(RUST if on else LINE)
            canv.line(24, bottom, RAIL - 18, bottom)
            y = bottom - 12

    def draw_body(self, canv, doc) -> None:
        canv.setFillColor(BODY)
        canv.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
        canv.setFillColor(PAPER)
        canv.rect(0, 0, RAIL, HEIGHT, fill=1, stroke=0)
        canv.setStrokeColor(LINE)
        canv.setLineWidth(.5)
        canv.line(RAIL, 0, RAIL, HEIGHT)
        canv.line(0, HEIGHT - 47, WIDTH, HEIGHT - 47)
        canv.setFillColor(RUST)
        canv.rect(0, HEIGHT - 5, 42, 5, fill=1, stroke=0)
        canv.setFont("GeorgiaBold", 11.3)
        canv.setFillColor(NAVY)
        canv.drawString(24, HEIGHT - 30, "easy prospect")
        canv.setFont("SegoeBold", 7)
        canv.setFillColor(RUST)
        canv.drawString(BODY_X + 8, HEIGHT - 29, f"{self.labels['kicker']}   /   {self.country.upper()}")
        canv.setFont("Segoe", 7)
        canv.setFillColor(MUTED)
        canv.drawRightString(WIDTH - 31, HEIGHT - 29, self.date_label)

        canv.setFont("SegoeBold", 7)
        canv.setFillColor(RUST)
        canv.drawString(24, HEIGHT - 86, self.labels["rail"])
        canv.setFont("Segoe", 6.7)
        canv.setFillColor(MUTED)
        foot = Paragraph(markup(self.metadata["title"]), ParagraphStyle(
            "Rail foot", fontName="Segoe", fontSize=6.7, leading=9, textColor=MUTED))
        _, foot_h = foot.wrap(RAIL - 40, 40)
        foot.drawOn(canv, 24, 52 - foot_h)
        canv.setStrokeColor(LINE)
        canv.line(BODY_X + 8, 32, WIDTH - 30, 32)
        canv.setFont("Segoe", 7)
        canv.drawRightString(WIDTH - 31, 18, f"{doc.page:02d}")


def build(source: Path, destination: Path, illustration: Path, country: str, lang: str = "en") -> None:
    register_fonts()
    blocks, metadata, chapters = extract_blocks(source)
    st = styles()
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("TOC entry", fontName="Segoe", fontSize=10,
                                      leading=17, textColor=NAVY, leftIndent=2, firstLineIndent=0)]
    story = [Spacer(1, 1), NextPageTemplate("body"), PageBreak(),
             Paragraph(LABELS[lang]["contents"], st["h1"]), Spacer(1, 17), toc, PageBreak()]
    first_chapter = True
    for block in blocks:
        if block.kind == "h1":
            if not first_chapter:
                story.append(PageBreak())
            first_chapter = False
            heading = Paragraph(markup(block.text), st["h1"])
            heading.chapter_title = block.text
            heading.chapter_index = block.chapter
            story.append(heading)
        elif block.kind in ("h2", "h3", "body", "bullet"):
            if block.kind == "bullet" and block.chapter == 1:
                story.append(summary_card(block.text, st))
            else:
                story.append(Paragraph(markup(block.text), st[block.kind]))
        elif block.kind == "table" and block.rows:
            if is_directory(block.rows):
                story.extend(directory_cards(block.rows, st))
            else:
                story.extend(standard_table(block.rows, st))
    destination.parent.mkdir(parents=True, exist_ok=True)
    StudyDoc(str(destination), metadata, chapters, illustration, country, lang).multiBuild(story)
    print(f"Created {destination}: {len(blocks)} content blocks, {len(chapters)} chapters")


WORD = re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿĀ-ž]{2,}")


def words(text: str) -> Counter[str]:
    return Counter(word.lower() for word in WORD.findall(text or ""))


def source_words(source: Path) -> Counter[str]:
    """Words the new file must carry: the cover and the whole body.

    Left out: running header/footer, the cover label (the new cover sets its
    own) and the source table of contents, which the generated one replaces.
    """
    total: Counter[str] = Counter()
    with pdfplumber.open(source) as pdf:
        repeated = furniture(pdf)
        cover_index = find_cover(pdf)
        h1_size = chapter_size(pdf, cover_index) - 0.5
        body = body_position(pdf, cover_index, h1_size)
        for index, page in enumerate(pdf.pages):
            in_cover = index == cover_index
            for line in page.extract_text_lines():
                if is_furniture(line, repeated, page.height):
                    continue
                if (index, line["top"]) < body:
                    if not in_cover:
                        continue
                    if CONTENTS_HEADING.match(line["text"].strip()):
                        in_cover = False  # the rest of this page is the contents
                        continue
                    if is_cover_label(line["text"]):
                        continue  # the new cover sets its own label
                total.update(words(line["text"]))
    return total


def output_words(destination: Path) -> Counter[str]:
    """Words of the new file, without the frame (rail, header, footer)."""
    total: Counter[str] = Counter()
    with pdfplumber.open(destination) as pdf:
        for index, page in enumerate(pdf.pages):
            area = page if index == 0 else page.crop((BODY_X, 48, page.width, page.height - 33))
            total.update(words(area.extract_text()))
    return total


def verify(source: Path, destination: Path) -> tuple[float, list[tuple[str, int]]]:
    """Share of source words missing from the new file, and the most missed.

    Table header rows are left out of the count: the source repeats them on
    every page a table runs over, and a company card names a field only when it
    shows several. Everything else — body, cells, cover — must be there.
    """
    blocks, _, _ = extract_blocks(source)
    headers: Counter[str] = Counter()
    for block in blocks:
        if block.kind == "table" and block.rows:
            headers.update(words(" ".join(block.rows[0])))
    expected = source_words(source)
    missing = expected - output_words(destination)
    missing = missing - headers
    return sum(missing.values()) / max(sum(expected.values()), 1), missing.most_common(12)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--illustration", type=Path, required=True)
    parser.add_argument("--country", required=True)
    parser.add_argument("--lang", choices=sorted(LABELS), default="en")
    parser.add_argument("--max-missing", type=float, default=0.01,
                        help="largest share of source words allowed to be absent (default 0.01)")
    args = parser.parse_args()
    build(args.source, args.destination, args.illustration, args.country, args.lang)
    share, top = verify(args.source, args.destination)
    print(f"Text check: {share:.2%} of source words missing; most missed: {top}")
    if share > args.max_missing:
        rejected = args.destination.with_suffix(".rejeitado.pdf")
        args.destination.replace(rejected)
        print(f"REJECTED: more than {args.max_missing:.0%} missing. Output kept as {rejected}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
