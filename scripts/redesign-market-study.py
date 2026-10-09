"""Re-typeset the Austrian baby/toddler market study as an editorial PDF pilot.

Reads the supplied PDF, extracts every content line and table cell from the
study body, and builds a portrait A4 report with a chapter rail and live contents.
The source file is never modified. Visual navigation is newly added; the study
copy and table data come from the source PDF.
"""

from __future__ import annotations

import argparse
import html
import re
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
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"


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
        return line["text"].strip()
    return result


def read_cover(page, lines: list[str]) -> dict[str, str]:
    if any("language of study" in line.lower() for line in lines):
        return {
            "title": lines[1],
            "subtitle": " ".join(lines[2:5]),
            "scope": " ".join(lines[5:-3]),
            "language": lines[-3],
            "date": lines[-2],
        }
    # Cover and contents share the page: title, subtitle and date come first.
    rows = [
        (max(c["size"] for c in line["chars"]), plain(line_text(line)))
        for line in page.extract_text_lines()
    ]
    body = [(size, text) for size, text in rows[1:] if text]
    stop = next((i for i, (_, t) in enumerate(body) if t.lower() == "contents"), len(body))
    body = body[:stop]
    date_at = next(
        (i for i, (_, t) in enumerate(body) if re.fullmatch(rf"(?:{MONTHS})\s+\d{{4}}", t)),
        len(body),
    )
    head = body[:date_at]
    title = [t for size, t in head if size == head[0][0]]
    return {
        "title": " ".join(title),
        "subtitle": " ".join(t for _, t in head[len(title):]),
        "scope": "",
        "language": "",
        "date": body[date_at][1] if date_at < len(body) else "",
    }


def extract_blocks(source: Path) -> tuple[list[Block], dict[str, str], list[str]]:
    with pdfplumber.open(source) as pdf:
        # The source may already have a graphic cover in front of the original
        # study. Locate the first text cover instead of assuming page zero.
        cover_index = next(
            index for index, page in enumerate(pdf.pages)
            if "MARKET ENTRY STUDY" in (page.extract_text() or "").upper()
        )
        cover_lines = [line.strip() for line in (pdf.pages[cover_index].extract_text() or "").splitlines()]
        metadata = read_cover(pdf.pages[cover_index], cover_lines)

        def is_first_chapter(page) -> bool:
            return any(
                re.match(r"^1\.\s", line["text"]) and "...." not in line["text"]
                and max(c["size"] for c in line["chars"]) >= 15
                for line in page.extract_text_lines()
            )

        body_start = next(
            index for index in range(cover_index + 1, len(pdf.pages))
            if is_first_chapter(pdf.pages[index])
        )
        blocks: list[Block] = []
        chapters: list[str] = []
        current_chapter = 0

        # The cover and original table of contents become the new cover and
        # generated contents page, respectively.
        for page in pdf.pages[body_start:]:
            tables = page.find_tables()
            events: list[tuple[float, int, object]] = []
            for table in tables:
                events.append((table.bbox[1], 0, table))

            for line in page.extract_text_lines():
                if line["top"] > 790:  # the source page number / running footer
                    continue
                middle = (line["top"] + line["bottom"]) / 2
                in_table = any(
                    bbox[1] - 1 <= middle <= bbox[3] + 1
                    and line["x1"] >= bbox[0] - 1 and line["x0"] <= bbox[2] + 1
                    for bbox in (table.bbox for table in tables)
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
                        current_chapter = int(re.match(r"^(\d+)\.", value).group(1))
                        chapters.append(value)
                    blocks.append(Block(pending_kind, value, chapter=current_chapter))
                pending = []
                pending_kind = ""

            for _, event_kind, event in events:
                if event_kind == 0:
                    flush()
                    rows = [
                        [" ".join((cell or "").split()) for cell in row]
                        for row in event.extract()
                    ]
                    blocks.append(Block("table", rows=rows, chapter=current_chapter))
                    continue

                line = event
                value = plain(line_text(line))
                if not value:
                    continue
                size = max((char["size"] for char in line["chars"]), default=10)
                if size >= 15 and re.match(r"^\d+\.\s", value):
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
                continues = (
                    pending and (kind == pending_kind or kind == "body" and pending_kind == "bullet")
                    and gap < 6 and kind != "bullet"
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


def directory_cards(rows: list[list[str]], st: dict[str, ParagraphStyle]) -> list[Table]:
    cards: list[Table] = []
    for row in rows[1:]:
        if len(row) < 4 or not any(row):
            continue
        name, profile, role, contact = row[:4]
        contact = re.sub(r"\s+(?=(?:Web|Phone|E-mail|Email|Note|Tel):)", "\n", contact)
        card = Table([
            [Paragraph(markup(name), st["company"]), Paragraph(markup(f"Type / role: {role}"), st["tag"])],
            [Paragraph(markup(profile), st["cell"]), Paragraph(markup(contact), st["cell"])],
        ], colWidths=[(BODY_W - 16) * .56, (BODY_W - 16) * .44], hAlign="LEFT")
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFCF6")),
            ("LINEABOVE", (0, 0), (-1, 0), 1.2, NAVY),
            ("LINEBELOW", (0, -1), (-1, -1), .45, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("SPAN", (0, 0), (0, 0)),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
            ("TOPPADDING", (0, 1), (-1, 1), 5),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 11),
        ]))
        card.spaceAfter = 12
        cards.append(card)
    return cards


def standard_table(rows: list[list[str]], st: dict[str, ParagraphStyle]) -> Table:
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
    return table


class StudyDoc(BaseDocTemplate):
    def __init__(self, filename: str, metadata: dict[str, str], chapters: list[str], illustration: Path,
                 country: str):
        super().__init__(filename, pagesize=(WIDTH, HEIGHT), leftMargin=0, rightMargin=0,
                         topMargin=0, bottomMargin=0, title=metadata["title"], author="Easy Prospect")
        self.metadata = metadata
        self.chapters = chapters
        self.illustration = illustration
        self.country = country
        self.date_label = re.sub(r"^Status of research:\s*", "", metadata["date"])
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
            self.current_chapter = int(re.match(r"^(\d+)\.", flowable.chapter_title).group(1))
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
        canv.drawString(40, 514, "MARKET ENTRY STUDY")
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
            short = re.sub(r"^\d+\.\s*", "", chapter)
            on = index == active
            para = Paragraph(markup(short), ParagraphStyle(
                "Rail", fontName="SegoeBold" if on else "Segoe", fontSize=7.1, leading=9,
                textColor=RUST if on else INK))
            _, h = para.wrap(RAIL - 24 - 24, 40)
            canv.setFont("SegoeBold" if on else "Segoe", 7.1)
            canv.setFillColor(RUST if on else MUTED)
            canv.drawString(24, y - 7, f"{index:02d}")
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
        canv.drawString(BODY_X + 8, HEIGHT - 29, f"MARKET ENTRY STUDY   /   {self.country.upper()}")
        canv.setFont("Segoe", 7)
        canv.setFillColor(MUTED)
        canv.drawRightString(WIDTH - 31, HEIGHT - 29, self.date_label)

        canv.setFont("SegoeBold", 7)
        canv.setFillColor(RUST)
        canv.drawString(24, HEIGHT - 86, "CONTENTS")
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


def build(source: Path, destination: Path, illustration: Path, country: str) -> None:
    register_fonts()
    blocks, metadata, chapters = extract_blocks(source)
    st = styles()
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("TOC entry", fontName="Segoe", fontSize=10,
                                      leading=17, textColor=NAVY, leftIndent=2, firstLineIndent=0)]
    story = [Spacer(1, 1), NextPageTemplate("body"), PageBreak(),
             Paragraph("Table of Contents", st["h1"]), Spacer(1, 17), toc, PageBreak()]
    first_chapter = True
    for block in blocks:
        if block.kind == "h1":
            if not first_chapter:
                story.append(PageBreak())
            first_chapter = False
            heading = Paragraph(markup(block.text), st["h1"])
            heading.chapter_title = block.text
            story.append(heading)
        elif block.kind in ("h2", "h3", "body", "bullet"):
            if block.kind == "bullet" and block.chapter == 1:
                story.append(summary_card(block.text, st))
            else:
                story.append(Paragraph(markup(block.text), st[block.kind]))
        elif block.kind == "table" and block.rows:
            if block.rows[0][0] == "Company" and len(block.rows[0]) >= 4:
                story.extend(directory_cards(block.rows, st))
            else:
                story.append(standard_table(block.rows, st))
    destination.parent.mkdir(parents=True, exist_ok=True)
    StudyDoc(str(destination), metadata, chapters, illustration, country).multiBuild(story)
    print(f"Created {destination}: {len(blocks)} content blocks, {len(chapters)} chapters")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--illustration", type=Path, required=True)
    parser.add_argument("--country", required=True)
    args = parser.parse_args()
    build(args.source, args.destination, args.illustration, args.country)


if __name__ == "__main__":
    main()
