# KẾ HOẠCH DỊCH TỰ ĐỘNG THEO CHU KỲ (AUTONOMOUS TRANSLATION PLAN TEMPLATE)

*Tài liệu này hướng dẫn cách thiết lập chu kỳ dịch tự động bằng cách sử dụng công cụ hẹn giờ `schedule` của Antigravity. Dành cho việc dịch số lượng lớn chương truyện liên tục mà không cần người dùng can thiệp thủ công.*

---

## 📊 1. ƯỚC TÍNH TIẾN ĐỘ & PHÂN CHIA BATCH
- **Tổng số chương cần dịch:** `Chương cuối - Chương hiện tại = X chương`.
- **Hạn mức chạy nền:** 
  - Một đợt dịch có thể chạy song song nhiều subagent. Ví dụ: Chia 20 chương thành 4 subagent, mỗi subagent dịch 5 chương.
  - Phân chia lộ trình thành các Batch cụ thể (mỗi batch dịch 10-20 chương tùy quota).
- **Giãn cách an toàn:** Thiết lập thời gian chờ (ví dụ: 5.5 giờ) giữa các đợt dịch để làm mới hoàn toàn quota sử dụng API.

---

## 🛠️ 2. QUY TRÌNH HÀNH ĐỘNG DÀNH CHO AGENT KHI THỨC GIẤC (WAKEUP FLOW)

Mỗi khi nhận được tin nhắn hẹn giờ thức giấc bắt đầu bằng `WAKEUP: Quota refreshed`, Agent tự động chạy theo các bước sau:

### Bước 1: Xác định phạm vi dịch
Đọc file `memo/PROGRESS.json` để lấy chương hoàn thành gần nhất (`last_done_vi`).
- Xác định dải dịch tiếp theo: `Start = last_done_vi + 1`, `End = last_done_vi + kích_thước_batch`.

### Bước 2: Kích hoạt Subagents dịch song song
Sử dụng công cụ `invoke_subagent` để chia nhỏ dải dịch cho nhiều subagent chạy song song (Ví dụ: chia dải 20 chương thành 4 subagent, mỗi subagent 5 chương):
```json
invoke_subagent(
    Subagents=[
        {
            "TypeName": "self",
            "Model": "pro", // Hoặc haiku, flash
            "Role": "Translator B1",
            "Prompt": "Dịch 5 chương từ {Start} đến {Start+4}..."
        },
        ...
    ]
)
```
*Kết thúc gọi công cụ và dừng lại chờ cho đến khi nhận được thông báo các subagent hoàn thành.*

### Bước 3: Chạy QA kiểm tra chất lượng (Bắt buộc)
Chạy script kiểm tra chất lượng tự động:
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start {Start} -End {End}"
```
- Nếu phát hiện lỗi (`FAIL_CJK`, `FAIL_MOJIBAKE`, `WARN_PARACOUNT`, `WARN_DUP`), mở file ra sửa thủ công hoặc yêu cầu dịch lại chương lỗi.

### Bước 4: Đóng gói EPUB & Cập nhật tiến độ
1. Cập nhật tiến độ `last_done_vi` lên `{End}` trong `memo/PROGRESS.json`.
2. Cập nhật các từ vựng mới vào `memo/GLOSSARY.tsv`.
3. Tóm tắt nội dung chính vào `memo/ROLLING_SUMMARY.md`.
4. Chạy script build sách EPUB:
   ```powershell
   powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
   ```

### Bước 5: Commit & Push Git
```bash
git add chapters_out/ memo/
git commit -m "Dich tu dong batch {Start}-{End} va cap nhat EPUB"
git push origin {branch_hien_tai}
```

### Bước 6: Đặt lịch hẹn giờ cho đợt tiếp theo
Sử dụng công cụ `schedule` để tự động kích hoạt đợt tiếp theo sau 5.5 giờ:
- **DurationSeconds:** `19800` (5.5 giờ) hoặc `21600` (6 giờ).
- **Prompt:** `"WAKEUP: Quota refreshed. Dịch tiếp batch tiếp theo."`
- **TimerCondition:** `"never"`

*Kết thúc lượt chạy hiện tại và nhường lượt.*
