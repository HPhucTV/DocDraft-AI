import io
from app.services.pdf_renderer import render_html_to_vector_pdf
from app.schemas.document import ExportConfig


def test_render_html_to_vector_pdf():
    """Kiểm thử xuất PDF chuẩn vector từ HTML Nghị định 30 (TASK-114)."""
    sample_html = """
    <table data-nd30-table="true" data-table-type="header">
      <tr>
        <td data-col-width="40%" align="center">
          <b>UBND TỈNH ĐỒNG NAI</b><br/>
          <b>SỞ TÀI CHÍNH</b><br/>
          Số: 123/TTr-STC
        </td>
        <td data-col-width="60%" align="center">
          <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
          <b><u>Độc lập - Tự do - Hạnh phúc</u></b><br/>
          <i>Đồng Nai, ngày 05 tháng 09 năm 2026</i>
        </td>
      </tr>
    </table>
    <h2 align="center">TỜ TRÌNH</h2>
    <p><b>Kính gửi:</b> Chủ tịch Ủy ban nhân dân tỉnh Đồng Nai</p>
    <p>Căn cứ tình hình thực tế giải ngân ngân sách địa phương,</p>
    <p>Sở Tài chính kính trình Ủy ban nhân dân tỉnh phê duyệt phương án bổ sung kinh phí năm 2026.</p>
    """

    config = ExportConfig(
        margin_top_mm=20,
        margin_bottom_mm=20,
        margin_left_mm=30,
        margin_right_mm=15,
        font_family="Helvetica",
        font_size_pt=13,
    )

    buffer = render_html_to_vector_pdf(sample_html, config)

    assert buffer is not None
    pdf_bytes = buffer.getvalue()
    assert len(pdf_bytes) > 500
    # PDF magic number
    assert pdf_bytes.startswith(b"%PDF-")
    print("✓ Kiểm thử render HTML sang Vector PDF thành công 100%!")


if __name__ == "__main__":
    test_render_html_to_vector_pdf()
