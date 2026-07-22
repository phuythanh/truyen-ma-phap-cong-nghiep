# KẾ HOẠCH DỊCH TỰ ĐỘNG THEO CHU KỲ REFRESH QUOTA (5.5 GIỜ)

Tài liệu này dùng để lưu trữ trạng thái và hướng dẫn cho Agent tự động tiếp quản việc dịch thuật mỗi khi được đánh thức bởi hệ thống hẹn giờ (`schedule`).

---

## 📊 THÔNG TIN TIẾN ĐỘ & ƯỚC TÍNH QUOTA

* **Hạn mức 5 giờ (5-hour limit):** Một chu kỳ 100% hạn mức có thể dịch khoảng **20 - 25 chương** (sử dụng Gemini 3.1 Pro dịch và Gemini 3.5 Flash điều phối).
* **Số chương còn lại:** `1275 (chương cuối) - 1038 (hiện tại) = 237 chương`.
* **Số đợt (batches) cần chạy:** Khoảng **12 đợt** (mỗi đợt 20 chương, đợt cuối 17 chương).
* **Thời gian giãn cách tối thiểu:** **5.5 giờ (19,800 giây)** để đảm bảo hạn mức 5 giờ được làm mới hoàn toàn 100%.
* **Tổng thời gian ước tính:** ~66 giờ (khoảng gần 3 ngày chạy nền liên tục).

---

## 📅 LỘ TRÌNH PHÂN CHIA BATCH
* **Batch 1:** Chương 1039 - 1058 (20 chương)
* **Batch 2:** Chương 1059 - 1078 (20 chương)
* **Batch 3:** Chương 1079 - 1098 (20 chương)
* **Batch 4:** Chương 1099 - 1118 (20 chương)
* **Batch 5:** Chương 1119 - 1138 (20 chương)
* **Batch 6:** Chương 1139 - 1158 (20 chương)
* **Batch 7:** Chương 1159 - 1178 (20 chương)
* **Batch 8:** Chương 1179 - 1198 (20 chương)
* **Batch 9:** Chương 1199 - 1218 (20 chương)
* **Batch 10:** Chương 1219 - 1238 (20 chương)
* **Batch 11:** Chương 1239 - 1258 (20 chương)
* **Batch 12:** Chương 1259 - 1275 (17 chương)

---

## 🛠️ QUY TRÌNH HÀNH ĐỘNG DÀNH CHO AGENT KHI THỨC GIẤC (WAKEUP)

Mỗi khi nhận được tin nhắn bắt đầu bằng `WAKEUP: Quota refreshed`, Agent thực hiện chính xác các bước sau:

### Bước 1: Xác định phạm vi dịch
Đọc file `memo/PROGRESS.json` để lấy chương đã hoàn thành gần nhất (`last_done_vi`).
* Ví dụ: `last_done_vi = 1038`.
* Xác định dải dịch tiếp theo: `Start = 1039`, `End = 1058`.

### Bước 2: Kích hoạt Subagents dịch song song
Gọi công cụ `invoke_subagent` để chia 20 chương thành **4 subagent** song song (mỗi subagent dịch 5 chương liên tiếp, sử dụng model `pro`):
```json
// Mẫu cấu trúc gọi subagent (điều chỉnh Start/End phù hợp):
invoke_subagent(
    Subagents=[
        {
            "TypeName": "self",
            "Model": "pro",
            "Role": "Translator B1",
            "Prompt": "Dịch 5 chương từ {Start} đến {Start+4}..."
        },
        {
            "TypeName": "self",
            "Model": "pro",
            "Role": "Translator B2",
            "Prompt": "Dịch 5 chương từ {Start+5} đến {Start+9}..."
        },
        {
            "TypeName": "self",
            "Model": "pro",
            "Role": "Translator B3",
            "Prompt": "Dịch 5 chương từ {Start+10} đến {Start+14}..."
        },
        {
            "TypeName": "self",
            "Model": "pro",
            "Role": "Translator B4",
            "Prompt": "Dịch 5 chương từ {Start+15} đến {End}..."
        }
    ]
)
```
*Dừng gọi công cụ và đợi các subagent hoàn thành.*

### Bước 3: Kiểm tra chất lượng (QA)
Sau khi các subagent hoàn thành, chạy script QA:
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start {Start} -End {End}"
```
*Nếu có lỗi (CJK, Dup, ParaCount lệch quá lớn), tự sửa lỗi hoặc yêu cầu subagent dịch lại chương lỗi.*

### Bước 4: Cập nhật tài liệu & Đóng gói EPUB
1. Cập nhật `memo/PROGRESS.json` (tăng `last_done_vi` lên `{End}`, cập nhật `translated_ranges`).
2. Cập nhật các thuật ngữ mới phát hiện vào `memo/GLOSSARY.tsv`.
3. Tóm tắt nội dung chính vào `memo/ROLLING_SUMMARY.md`.
4. Chạy script đóng gói sách EPUB mới:
   ```powershell
   powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
   ```

### Bước 5: Commit & Push lên GitHub
Lần lượt chạy các lệnh:
```bash
git add chapters_out/ memo/ scratchpad/ "Ma Phap - Chuong 387-*.epub"
git commit -m "Dich tu dong batch {Start}-{End} va cap nhat EPUB"
git push origin feature/gemini
```

### Bước 6: Đặt lịch cho đợt tiếp theo
Sử dụng công cụ `schedule` để hẹn giờ thức giấc sau 5.5 giờ:
* **DurationSeconds:** `19800` (hoặc `21600` - 6 tiếng để an toàn hơn).
* **Prompt:** `"WAKEUP: Quota refreshed. Dịch tiếp batch tiếp theo."`
* **TimerCondition:** `"never"`

*Kết thúc lượt chạy và đi vào trạng thái chờ.*
