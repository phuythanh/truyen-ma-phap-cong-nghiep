# QA — CÁC CẢNH BÁO ĐÃ XÁC MINH LÀ FALSE POSITIVE / HỢP LỆ

Danh sách chương bị `qa_chapters.ps1`/`qa_chapters.py` gắn cờ nhưng đã kiểm tra tay và xác nhận
KHÔNG cần sửa. Khi QA báo lại đúng các mã dưới đây cho đúng chương, không cần điều tra lại —
chỉ bỏ qua.

| Chương (vi) | Status QA | Lý do hợp lệ |
|---|---|---|
| 1727 | WARN_PARACOUNT (lệch ~3 đoạn) | Đã đối chiếu `chapters_zh/0919.txt`, cuối file không có quảng cáo/rác — chỉ là chênh lệch cách ngắt đoạn tự nhiên khi dịch, nội dung đầy đủ, không thiếu ý. |
| 1756 | FAIL_SLANG ("mày"/"tao") | Câu "Mày... Sao mày còn chưa đi đi!" — dùng "mày" đúng nghĩa đại từ xưng hô suồng sã thật, nhưng nằm trong cảnh cãi vã dữ dội, thuộc ngoại lệ được phép theo `STYLE_GUIDE.md`/mục 2.5 CLAUDE.md ("hạn chế tối đa mày-tao trừ khi cãi vã dữ dội"). Không sửa.

**Không áp dụng cho `MISSING_ZH` (ví dụ chương 1723 / zh 0915):** đây là loại lỗi khác — file nguồn
`chapters_zh/*.txt` bị thiếu thật trên đĩa. Trường hợp 1723 không sao vì `chapters_out/1723.md`
đã dịch xong đầy đủ từ trước khi file nguồn bị mất, nhưng nếu `MISSING_ZH` xuất hiện ở một chương
CHƯA có file `chapters_out` tương ứng thì vẫn là lỗi thật cần xử lý (không được thêm vào bảng này).

## Cách dùng
- Trước khi report cho user "còn X FAIL/WARN", loại trừ các dòng khớp bảng trên trước.
- Nếu QA phát hiện chương MỚI bị FAIL_SLANG/WARN_PARACOUNT ngoài danh sách này, vẫn phải điều tra
  bình thường như lỗi thật — bảng này chỉ áp dụng đúng số chương đã liệt kê, không suy diễn sang
  chương khác có cùng status.
- Nếu sau này chỉnh sửa lại nội dung 2 chương trên (dịch lại, đổi câu thoại...), phải xóa dòng
  tương ứng khỏi bảng này rồi để QA chạy lại tự nhiên.
