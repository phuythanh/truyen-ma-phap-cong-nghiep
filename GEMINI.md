# HỆ THỐNG DỊCH THUẬT TỰ ĐỘNG BẰNG GEMINI CLI — HƯỚNG DẪN CHO AGENT

> ⚠️ **Đọc [PIPELINE_SHARED.md](PIPELINE_SHARED.md) TRƯỚC** — đó là nguồn chân lý duy nhất cho cấu trúc dự án, các bài học/lỗi đã gặp, logic pipeline 6 bước, checklist commit, và giới hạn retry. File `GEMINI.md` này **chỉ chứa phần ánh xạ tool đặc thù cho Gemini CLI** (`invoke_subagent`, `schedule`, model `flash`/`pro`...) thay vì cú pháp `Agent`/`PowerShell`/`ScheduleWakeup` của Claude Code (xem [CLAUDE.md](CLAUDE.md)).
>
> **Khi cần thêm/sửa một quy tắc chung** (không riêng cú pháp tool Gemini) **— sửa `PIPELINE_SHARED.md`, KHÔNG sửa ở đây** để tránh 2 AI làm việc lệch nhau.

---

## 📌 THIẾT LẬP TRUYỆN MỚI (khi chuyển sang branch template để dịch truyện khác)

Khi người dùng chuyển sang branch này và yêu cầu dịch một truyện mới:
1. Đọc và cập nhật `memo/PROGRESS.json`: `book_title`, `book_file_prefix`, `offset_zh_minus_vi` (công thức `Zh_Chapter = Vi_Chapter + offset_zh_minus_vi`, = 0 nếu file Trung/Việt khớp 1-1), `first_new_chapter_vi`, `last_done_vi` (0 hoặc số chương đã dịch sẵn).
2. Điền quy định xưng hô/giọng điệu vào `memo/STYLE_GUIDE.md`, ghi nhận nhân vật/bối cảnh chính vào `memo/STORY_BIBLE.md`, reset header `memo/GLOSSARY.tsv`.
3. Xem cấu trúc thư mục đầy đủ (`chapters_zh/`, `chapters_out/`, `memo/`, `scratchpad/`...) tại `PIPELINE_SHARED.md` mục 1.

---

## 🛠️ ÁNH XẠ PIPELINE SANG TOOL CỦA GEMINI CLI

Các bước dưới đây tương ứng 1-1 với "Bước 1→6" mô tả logic chung trong `PIPELINE_SHARED.md` mục 3 — ở đây chỉ nêu **cách gọi tool thật của Gemini CLI** cho từng bước.

### Bước 1 — Main Agent (model `flash`) nạp context
Đọc `memo/PROGRESS.json` lấy `last_done_vi`/`offset_zh_minus_vi`, xác định dải chương, đọc `memo/STYLE_GUIDE.md` + tra `memo/GLOSSARY.tsv`.

### Bước 2 — Dịch bằng subagent model `pro`
- Main Agent chạy bằng model `flash` (Gemini Pro/Flash — tùy cấu hình) điều phối toàn bộ quy trình, **không tự dịch trực tiếp** khi dải chương lớn.
- Chia dải thành cụm **5 chương liên tiếp**; với mỗi cụm, spawn một subagent `self` bằng `invoke_subagent` dùng **model `pro`** (bắt buộc — không dùng model nhẹ hơn vì chất lượng văn phong không đạt).
- Có thể spawn song song nhiều subagent cùng lúc nếu dải chương lớn (nhiều cụm 5 chương) để tối ưu thời gian.
- Định dạng file đầu ra và nội dung prompt giao cho subagent: xem `memo/TRANSLATE_PROMPT.md` và `PIPELINE_SHARED.md` mục 3 Bước 2.

### Bước 3 — QA tự động (chạy trực tiếp bởi Main Agent, KHÔNG giao subagent)
Gom toàn bộ dải chương vừa dịch, chỉ chạy QA một lần duy nhất ở cuối phiên. Main Agent tự chạy lệnh shell trực tiếp (xem bài học #8 trong `PIPELINE_SHARED.md` — nếu môi trường hiện tại không có PowerShell, dùng bản Python):
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start <Start_toan_dai> -End <End_toan_dai>"
```
```bash
python3 scratchpad/qa_chapters.py --start <Start_toan_dai> --end <End_toan_dai>
```
Nếu có `FAIL_*`, mở file sửa tay hoặc yêu cầu subagent (`model: "pro"`) dịch lại đúng chương đó.

### Bước 4 — Đóng gói EPUB (chạy trực tiếp bởi Main Agent)
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
```
```bash
python3 scratchpad/build_epub_full.py
```
Script tự đọc `PROGRESS.json`, lấy asset từ `scratchpad/epub_assets/`, xuất EPUB ra root repo, tự dọn EPUB cũ cùng prefix.

### Bước 5 — Cập nhật trí nhớ dịch thuật
Cập nhật `memo/PROGRESS.json` (`last_done_vi`), `memo/GLOSSARY.tsv`, `memo/ROLLING_SUMMARY.md` (và `STORY_BIBLE.md` nếu có diễn biến lớn) — chi tiết ở `PIPELINE_SHARED.md` mục 3 Bước 5.

### Bước 6 — Commit & push MỘT LƯỢT DUY NHẤT
Theo đúng checklist ở `PIPELINE_SHARED.md` mục 3 Bước 6 (bắt buộc kèm `scratchpad/qa_output.csv`, kèm `.epub` mới nếu có build ở Bước 4):
```bash
git add chapters_out/ memo/ scratchpad/qa_output.csv
# Nếu có build EPUB ở Bước 4: git add "*.epub"
git commit -m "Dich chuong <Start>-<End> <Ten truyen>, QA dat chuan"
git push origin <branch>
```
Luôn xác nhận với user trước khi push nếu chưa được ủy quyền tự động trong phiên.

---

## 📋 GHI CHÚ NHANH (đặc thù Gemini CLI)

- Model điều phối (orchestrator): **Gemini Flash**. Model dịch bắt buộc cho subagent: **Gemini Pro** (không dùng model nhẹ hơn).
- Cú pháp spawn subagent: `invoke_subagent` (không phải `Agent` như Claude Code); vòng lặp tự động dài hạn dùng `schedule` (không phải `ScheduleWakeup`).
- `memo/AUTONOMOUS_PLAN.md` viết theo cú pháp `invoke_subagent`/`schedule` của Gemini CLI — dùng trực tiếp được, không cần ánh xạ lại.
- Mọi quy tắc khác (checklist commit, giới hạn retry, bài học QA, cấu trúc dự án...) xem `PIPELINE_SHARED.md` — không lặp lại ở đây để tránh lệch khi cập nhật.
