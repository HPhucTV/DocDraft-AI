import io
from app.services.pdf_renderer import (
    render_html_to_vector_pdf,
    html_to_reportlab_story,
    build_reportlab_styles,
)
from app.schemas.document import ExportConfig
from reportlab.platypus import KeepTogether, PageBreak, Paragraph


def test_pdf_page_break_engine():
    """Kiểm thử tối ưu hóa ngắt trang thông minh khi xuất PDF (TASK-311)."""
    config = ExportConfig(
        margin_top_mm=20,
        margin_bottom_mm=20,
        margin_left_mm=30,
        margin_right_mm=15,
        font_family="Helvetica",
        font_size_pt=13,
    )

    # 1. Kiểm tra thuộc tính keepWithNext trên các style tiêu đề (Orphan heading prevention)
    styles = build_reportlab_styles(config)
    assert styles["h1"].keepWithNext is True, "Tiêu đề h1 phải có keepWithNext=True để tránh rớt đáy trang"
    assert styles["h2"].keepWithNext is True, "Tiêu đề h2 phải có keepWithNext=True để tránh rớt đáy trang"
    assert styles["h3"].keepWithNext is True, "Tiêu đề h3 phải có keepWithNext=True để tránh rớt đáy trang"

    # 2. Kiểm tra KeepTogether được áp dụng cho khối chữ ký / Nơi nhận NĐ 30
    html_with_signature = """
    <h1>QUYẾT ĐỊNH</h1>
    <p>Nội dung quyết định...</p>
    <div class="page-break"></div>
    <p>Trang 2 bắt đầu</p>
    <table data-table-type="signature">
      <tr>
        <td><b>Nơi nhận:</b><br/>- Như trên;<br/>- Lưu: VT.</td>
        <td align="center"><b>GIÁM ĐỐC</b><br/><br/><br/><b>Nguyễn Văn A</b></td>
      </tr>
    </table>
    """

    story = html_to_reportlab_story(html_with_signature, config)

    # Kiểm tra có PageBreak flowable được sinh ra từ <div class="page-break">
    has_page_break = any(isinstance(elem, PageBreak) for elem in story)
    assert has_page_break, "Phải sinh ra PageBreak flowable từ thẻ ngắt trang chủ động"

    # Kiểm tra khối chữ ký được bọc trong KeepTogether
    has_keep_together = any(isinstance(elem, KeepTogether) for elem in story)
    assert has_keep_together, "Bảng chữ ký NĐ 30 phải được bảo vệ bằng KeepTogether để không bị cắt đôi"

    # 3. Kiểm tra render ra luồng binary PDF thành công
    pdf_buffer = render_html_to_vector_pdf(html_with_signature, config)
    pdf_bytes = pdf_buffer.getvalue()
    assert pdf_bytes.startswith(b"%PDF-"), "Tệp PDF vector hợp lệ phải có header %PDF-"
    assert len(pdf_bytes) > 1000, "Tệp PDF xuất ra phải có dung lượng đầy đủ"

    print("✓ Kiểm thử Page-Break Engine PDF đạt 100% tiêu chí TASK-311!")


if __name__ == "__main__":
    test_pdf_page_break_engine()
