# QA — CÁC CẢNH BÁO ĐÃ XÁC MINH LÀ FALSE POSITIVE / HỢP LỆ

Danh sách chương bị `qa_chapters.ps1`/`qa_chapters.py` gắn cờ nhưng đã kiểm tra tay và xác nhận
KHÔNG cần sửa. Khi QA báo lại đúng các mã dưới đây cho đúng chương, không cần điều tra lại —
chỉ bỏ qua.

| Chương (vi) | Status QA | Lý do hợp lệ |
|---|---|---|
| 1727 | WARN_PARACOUNT (lệch ~3 đoạn) | Đã đối chiếu `chapters_zh/0919.txt`, cuối file không có quảng cáo/rác — chỉ là chênh lệch cách ngắt đoạn tự nhiên khi dịch, nội dung đầy đủ, không thiếu ý. |
| 1756 | FAIL_SLANG ("mày"/"tao") | Câu "Mày... Sao mày còn chưa đi đi!" — dùng "mày" đúng nghĩa đại từ xưng hô suồng sã thật, nhưng nằm trong cảnh cãi vã dữ dội, thuộc ngoại lệ được phép theo `STYLE_GUIDE.md`/mục 2.5 CLAUDE.md ("hạn chế tối đa mày-tao trừ khi cãi vã dữ dội"). Không sửa.

**`MISSING_ZH` luôn là lỗi thật cần xử lý**, không thuộc diện bỏ qua như bảng trên. Nếu gặp lại,
thử phục hồi từ `chapters_zh/full_source.txt` (bản gộp GBK-encoded toàn bộ truyện) trước khi báo
user — xem case đã xử lý: chương 1723 (zh 0915) từng bị `MISSING_ZH` do file `0915.txt` mất, đã
phục hồi thành công bằng cách tách từ `full_source.txt` (đọc bằng
`[System.Text.Encoding]::GetEncoding(936)`, tìm ranh giới bằng tiêu đề chương liền trước/sau,
convert UTF-8 CRLF, bỏ khoảng trắng full-width `　　` đầu dòng). Lưu ý: dòng tiêu đề trong
`full_source.txt` đôi khi lỗi scrape thiếu chữ "章" (ví dụ "第九百一十五玄儋太阴" thay vì
"第九百一十五章玄儋太阴") nên khi dò ranh giới bằng regex `^第[...]+章` có thể trượt — phải tìm bằng
nội dung lân cận (từ khóa xuất hiện trong bản dịch đã có, nếu chương đó đã dịch rồi) rồi đối chiếu
tay, không chỉ dựa thuần vào regex tiêu đề.

## Cách dùng
- Trước khi report cho user "còn X FAIL/WARN", loại trừ các dòng khớp bảng trên trước.
- Nếu QA phát hiện chương MỚI bị FAIL_SLANG/WARN_PARACOUNT ngoài danh sách này, vẫn phải điều tra
  bình thường như lỗi thật — bảng này chỉ áp dụng đúng số chương đã liệt kê, không suy diễn sang
  chương khác có cùng status.
- Nếu sau này chỉnh sửa lại nội dung 2 chương trên (dịch lại, đổi câu thoại...), phải xóa dòng
  tương ứng khỏi bảng này rồi để QA chạy lại tự nhiên.
