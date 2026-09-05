import io
from app.routers.ocr import extract_vietnamese_entities


def test_extract_vietnamese_entities():
    """Kiểm thử bóc tách thực thể hành chính NĐ 30 từ văn bản OCR (TASK-405)."""
    sample_ocr_text = (
        "ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH\n"
        "SỞ NỘI VỤ\n"
        "Số: 89/QĐ-SNV\n"
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n"
        "Độc lập - Tự do - Hạnh phúc\n"
        "TP. Hồ Chí Minh, ngày 10 tháng 08 năm 2026\n\n"
        "QUYẾT ĐỊNH\n"
        "Về việc phê duyệt danh sách quy hoạch cán bộ lãnh đạo\n\n"
        "Căn cứ Luật Cán bộ, công chức ngày 13 tháng 11 năm 2008..."
    )

    entities = extract_vietnamese_entities(sample_ocr_text)

    assert entities["so_ky_hieu"] == "89/QĐ-SNV", f"Trích xuất sai số ký hiệu: {entities['so_ky_hieu']}"
    assert "ỦY BAN NHÂN DÂN" in entities["co_quan_ban_hanh"], f"Trích xuất sai cơ quan: {entities['co_quan_ban_hanh']}"
    assert entities["loai_van_ban"] == "Quyết Định", f"Trích xuất sai loại văn bản: {entities['loai_van_ban']}"
    assert "10" in entities["ngay_ban_hanh"] and "2026" in entities["ngay_ban_hanh"], f"Trích xuất sai ngày ban hành: {entities['ngay_ban_hanh']}"
    assert "quy hoạch cán bộ" in entities["trich_yeu"].lower(), f"Trích xuất sai trích yếu: {entities['trich_yeu']}"

    print("✓ Kiểm thử OCR Entity Extraction chuẩn NĐ 30 thành công 100%!")


if __name__ == "__main__":
    test_extract_vietnamese_entities()
