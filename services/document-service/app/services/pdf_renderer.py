import io
import re
from typing import List
from bs4 import BeautifulSoup
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table as RLTable,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from ..schemas.document import ExportConfig


def clean_html_for_reportlab(html_text: str) -> str:
    """Chuẩn hóa thẻ HTML cho tương thích với ReportLab Paragraph XML parser."""
    # Thay thế các thẻ không được reportlab hỗ trợ
    cleaned = html_text.replace("<br/>", "<br/>").replace("<br>", "<br/>")
    cleaned = re.sub(r'<span[^>]*>(.*?)</span>', r'\1', cleaned)
    cleaned = re.sub(r'<p[^>]*>', r'<p>', cleaned)
    return cleaned


def build_reportlab_styles(config: ExportConfig):
    """Xây dựng bộ styles chuẩn Nghị định 30/2020/NĐ-CP cho ReportLab."""
    styles = getSampleStyleSheet()

    # Style văn bản cơ bản
    body_style = ParagraphStyle(
        "ND30Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=config.font_size_pt,
        leading=config.font_size_pt * 1.35,
        alignment=0,  # Left
        textColor=colors.black,
        spaceAfter=3,
    )

    center_style = ParagraphStyle(
        "ND30Center",
        parent=body_style,
        alignment=1,  # Center
    )

    right_style = ParagraphStyle(
        "ND30Right",
        parent=body_style,
        alignment=2,  # Right
    )

    justify_style = ParagraphStyle(
        "ND30Justify",
        parent=body_style,
        alignment=4,  # Justify
    )

    h1_style = ParagraphStyle(
        "ND30H1",
        parent=body_style,
        fontSize=config.font_size_pt + 3,
        leading=(config.font_size_pt + 3) * 1.35,
        alignment=1,
        fontName="Helvetica-Bold",
        spaceBefore=8,
        spaceAfter=6,
    )

    h2_style = ParagraphStyle(
        "ND30H2",
        parent=body_style,
        fontSize=config.font_size_pt + 1,
        leading=(config.font_size_pt + 1) * 1.35,
        alignment=1,
        fontName="Helvetica-Bold",
        spaceBefore=6,
        spaceAfter=4,
    )

    return {
        "body": body_style,
        "center": center_style,
        "right": right_style,
        "justify": justify_style,
        "h1": h1_style,
        "h2": h2_style,
    }


def html_to_reportlab_story(html_content: str, config: ExportConfig) -> List[any]:
    """Phân giải HTML thành danh sách Flowable elements của ReportLab."""
    soup = BeautifulSoup(html_content, "html.parser")
    styles = build_reportlab_styles(config)
    story = []

    # Chiều rộng có thể in: A4 (210mm) - 30mm (trái) - 15mm (phải) = 165mm
    total_avail_width = (210 - config.margin_left_mm - config.margin_right_mm) * mm

    for elem in soup.children:
        if elem.name is None:
            text = elem.strip()
            if text:
                story.append(Paragraph(text, styles["body"]))
            continue

        tag = elem.name.lower()

        if tag == "table":
            # Xử lý bảng (Đặc biệt là bảng ẩn 2 cột Tiêu ngữ & Chữ ký NĐ 30)
            rows = elem.find_all("tr")
            if not rows:
                continue

            table_data = []
            num_cols = 0
            for r in rows:
                tds = r.find_all(["td", "th"])
                num_cols = max(num_cols, len(tds))
                row_cells = []
                for td in tds:
                    # Lấy text kèm thẻ định dạng con
                    td_inner_html = "".join(str(c) for c in td.contents).strip()
                    td_style = styles["body"]

                    align = td.get("align") or ""
                    style_attr = td.get("style", "")
                    if "center" in align or "center" in style_attr:
                        td_style = styles["center"]
                    elif "right" in align or "right" in style_attr:
                        td_style = styles["right"]

                    cell_p = Paragraph(clean_html_for_reportlab(td_inner_html), td_style)
                    row_cells.append(cell_p)
                table_data.append(row_cells)

            if num_cols == 2:
                # Tỉ lệ chuẩn 40% / 60% hoặc 50% / 50%
                table_type = elem.get("data-table-type", "general")
                if table_type == "header":
                    col_widths = [total_avail_width * 0.40, total_avail_width * 0.60]
                else:
                    col_widths = [total_avail_width * 0.50, total_avail_width * 0.50]
            elif num_cols > 0:
                col_widths = [total_avail_width / num_cols] * num_cols
            else:
                continue

            rl_table = RLTable(table_data, colWidths=col_widths)
            # Bảng ẩn NĐ 30: triệt tiêu viền (border: none)
            rl_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ])
            )
            story.append(rl_table)
            story.append(Spacer(1, 4 * mm))

        elif tag in ("h1", "h2"):
            h_style = styles["h1"] if tag == "h1" else styles["h2"]
            story.append(Paragraph(clean_html_for_reportlab(str(elem)), h_style))

        elif tag == "p":
            p_style = styles["body"]
            style_attr = elem.get("style", "")
            if "center" in style_attr:
                p_style = styles["center"]
            elif "right" in style_attr:
                p_style = styles["right"]
            elif "justify" in style_attr:
                p_style = styles["justify"]

            inner_html = "".join(str(c) for c in elem.contents).strip()
            if inner_html:
                story.append(Paragraph(clean_html_for_reportlab(inner_html), p_style))
                story.append(Spacer(1, 1.5 * mm))

        elif tag == "hr":
            story.append(HRFlowable(width="60%", thickness=0.8, color=colors.black, spaceAfter=8, spaceBefore=4))

    return story


def render_html_to_vector_pdf(html_content: str, config: ExportConfig) -> io.BytesIO:
    """
    Render HTML thành tệp Vector PDF khổ giấy A4 theo tiêu chuẩn Nghị định 30/2020/NĐ-CP
    (Lề trên 20mm, dưới 20mm, trái 30mm, phải 15mm, Zero-disk streaming) (TASK-114).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=config.margin_left_mm * mm,
        rightMargin=config.margin_right_mm * mm,
        topMargin=config.margin_top_mm * mm,
        bottomMargin=config.margin_bottom_mm * mm,
    )

    story = html_to_reportlab_story(html_content, config)
    if not story:
        # Nếu rỗng, bổ sung trang trắng
        styles = build_reportlab_styles(config)
        story = [Paragraph("DocDraft AI Document", styles["body"])]

    doc.build(story)
    buffer.seek(0)
    return buffer
