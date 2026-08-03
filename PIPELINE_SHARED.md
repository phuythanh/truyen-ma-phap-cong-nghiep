# PIPELINE DỊCH THUẬT — NGUỒN CHÂN LÝ DUY NHẤT (DÙNG CHUNG CHO MỌI AI)

**File này là nơi DUY NHẤT lưu các quy tắc, bài học và quy trình pipeline áp dụng chung cho mọi mô hình AI dịch truyện trong repo này (Claude Code, Gemini CLI, hoặc bất kỳ agent nào khác).**

> ⚠️ **QUY TẮC BẮT BUỘC:** Khi cần thêm/sửa một quy tắc pipeline, bài học, hay checklist áp dụng chung (không riêng cho 1 tool cụ thể), **chỉ sửa file này**. TUYỆT ĐỐI không copy/paste nội dung trùng lặp sang `CLAUDE.md` hay `GEMINI.md` — hai file đó chỉ chứa phần ánh xạ tool đặc thù (cú pháp gọi subagent, tên tool...) và phải trỏ ngược lại file này cho phần nội dung chung. Nếu một quy tắc thực sự chỉ áp dụng cho 1 tool cụ thể (ví dụ cú pháp `invoke_subagent` của Gemini hay `Agent`/`PowerShell` của Claude Code), mới ghi riêng vào `CLAUDE.md`/`GEMINI.md`.

**Trước khi dịch bất kỳ truyện nào, agent phải đọc file này trước, sau đó đọc thêm `CLAUDE.md` (nếu chạy bằng Claude Code) hoặc `GEMINI.md` (nếu chạy bằng Gemini CLI) để biết cách ánh xạ sang tool thật của mình.**

---

## 📌 1. CẤU TRÚC DỰ ÁN & CẤU HÌNH

- `chapters_zh/`: file nguồn tiếng Trung `{zh_number:D4}.txt`.
- `chapters_out/`: file dịch tiếng Việt `{vi_number:D4}.md`.
- `memo/`: cấu hình + trí nhớ dịch thuật:
  - `PROGRESS.json` — trạng thái tiến độ (`last_done_vi`, `offset_zh_minus_vi`, `book_title`, `book_file_prefix`...).
  - `STYLE_GUIDE.md` — quy tắc văn phong, xưng hô.
  - `GLOSSARY.tsv` — từ điển tên riêng (nguồn chân lý duy nhất, không tự suy đoán).
  - `ROLLING_SUMMARY.md` — tóm tắt mạch truyện gần nhất.
  - `STORY_BIBLE.md` — nhân vật, thế lực, bối cảnh.
  - `TRANSLATE_PROMPT.md` — prompt mẫu cho subagent dịch.
  - `QA_KNOWN_EXCEPTIONS.md` — chương đã bị QA gắn cờ nhưng đã kiểm tra tay và xác nhận hợp lệ, không cần sửa lại. Đối chiếu bảng này trước khi báo cáo QA cho user; chỉ báo cáo cảnh báo MỚI hoặc `MISSING_ZH`/`MISSING_OUT`.
- `scratchpad/qa_chapters.ps1` — script QA (kiểm CJK sót, mojibake, lệch đoạn, trùng lặp, tỉ lệ độ dài, slang). Chạy trên Windows/PowerShell.
- `scratchpad/qa_chapters.py` — bản port Python 1:1 của `.ps1`, dùng khi QA phải chạy trên môi trường Linux/cloud không có PowerShell. **Lưu ý:** khi sửa logic trong `.ps1` (ví dụ thêm exception cho false positive), phải soát lại và đồng bộ luôn sang `.py` nếu đoạn logic đó cũng tồn tại ở đó — hai file cần khớp logic để QA không lệch kết quả giữa máy local và cloud routine.
- `scratchpad/build_epub_full.ps1` / `scratchpad/build_epub_full.py` — đóng gói EPUB từ toàn bộ `chapters_out/`, tự dọn EPUB cũ cùng prefix.

Công thức số chương: **`Zh_Chapter = Vi_Chapter + offset_zh_minus_vi`** (đọc `offset_zh_minus_vi` từ `PROGRESS.json`).

---

## ⚠️ 2. CÁC LỖI ĐÃ GẶP — BÀI HỌC (áp dụng cho mọi model)

1. **Mojibake trên Windows/PowerShell**: mọi thao tác đọc/ghi file phải UTF-8 (no BOM). Tránh redirect `>` trần trong PowerShell; dùng `-Encoding utf8`/`[System.IO.File]::WriteAllText()`. QA script tự phát hiện `FAIL_MOJIBAKE`.
2. **Sót chữ Hán / dịch cụt**: số đoạn văn bản dịch phải khớp 1-1 với bản gốc (trừ dòng tiêu đề). QA phát `WARN_PARACOUNT` nếu lệch quá 2 dòng — đối chiếu lại nguồn để bổ sung.
3. **Lặp đoạn văn**: QA phát `WARN_DUP` khi phát hiện câu đầu đoạn liên tiếp trùng nhau — phải mở file kiểm tra và xóa đoạn lặp.
4. **Lệch tên riêng**: luôn tra `memo/GLOSSARY.tsv` + `memo/STORY_BIBLE.md` trước khi dịch tên mới; thêm ngay vào glossary khi gặp tên chưa có.
5. **Xưng hô**: hạn chế tối đa "mày - tao" trừ khi cãi vã dữ dội; phân biệt "chúng tôi" (không gồm người nghe) và "chúng ta" (gồm người nghe). Dùng "tôi", "ta", "đạo hữu", "sư điệt", "tiền bối", "vãn bối" để giữ văn phong Hán Việt Cổ Phong trang trọng.
6. **Dòng quảng cáo/rác website lẫn trong nguồn**: một số file `chapters_zh/*.txt` có sẵn câu quảng cáo phân trang (kiểu "本章未完，请点击下一页继续阅读") hoặc cả khối thông báo rút thăm trúng thưởng của tác giả ("漆扇抽奖", "中奖编号"...). Đây **không phải nội dung truyện** — subagent dịch phải tự nhận diện và loại bỏ hoàn toàn (cả câu/khối lẫn dòng trống thừa quanh nó), không dịch và không giữ lại trong file `.md`. Việc loại bỏ này không tính là lệch số đoạn khi so khớp QA. Nếu phát hiện sót lại ở QA sau này, dùng `scratchpad/remove_ads.ps1` để quét dọn hàng loạt.
7. **Thành ngữ/điển cố Hán Việt xa lạ với độc giả Việt**: nếu dịch nghĩa đen/Hán Việt thẳng mà không giải thích, độc giả sẽ không hiểu ẩn ý. Khi gặp thành ngữ/điển cố khó hiểu, chêm giải thích ngắn gọn tự nhiên ngay trong câu văn (không phải chú thích cuối trang, không phá vỡ mạch kể).
8. **QA và build EPUB phải chạy bởi tiến trình chính, không giao cho subagent**: các script `.ps1`/`.py` này cần đúng môi trường (PowerShell cho `.ps1`, Python cho `.py`); nếu subagent được spawn chạy trên môi trường khác (ví dụ agent con chạy container Linux trong khi máy chính là Windows, hoặc ngược lại), script sẽ lỗi "command not found" hoặc sai kết quả. Vì vậy bước QA và build EPUB luôn phải do chính agent điều phối (main agent) của phiên hiện tại chạy trực tiếp, tuyệt đối không delegate cho agent con. Các subagent dịch (Bước 2) thì an toàn vì chỉ dùng đọc/ghi file, không phụ thuộc OS.
9. **Đánh giá chất lượng dịch thuật (Bắt buộc đạt từ 9.7/10 trở lên)**: Không được dịch thuần Việt ngô nghê làm mất khí thái cổ phong tiên hiệp (như dịch "bạch y nam tử" thành "người đàn ông mặc áo trắng", "địa giới" thành "địa bàn"...). Bản dịch bắt buộc phải giữ Hán Việt Cổ Phong đẹp, xưng hô trang trọng và phải đạt điểm đánh giá chất lượng từ **9.7/10** trở lên về độ mượt, nhịp điệu và thần thái nhân vật.
10. **QA false positive**: script QA (đặc biệt `FAIL_SLANG` với từ "mày"/"tao") có thể báo sai với các cụm từ hợp lệ không liên quan xưng hô (ví dụ "mày" nghĩa là lông mày trong "cau mày", "mày ngắn mắt tinh anh"...). Trước khi sửa lại bản dịch để né QA, luôn đọc kỹ ngữ cảnh gốc — nếu đúng là false positive, sửa logic loại trừ trong `qa_chapters.ps1` (và đồng bộ `qa_chapters.py`) thay vì sửa văn bản dịch cho "vừa mắt" script.

---

## 🛠️ 3. PIPELINE DỊCH THUẬT (LOGIC CHUNG — CÁCH GỌI TOOL CỤ THỂ XEM Ở CLAUDE.md/GEMINI.md)

### Bước 1 — Nạp context
1. Đọc `memo/PROGRESS.json` lấy `last_done_vi` và `offset_zh_minus_vi`.
2. Xác định dải chương cần dịch trong phiên này.
3. Xác nhận đang đứng đúng branch Git của truyện này (xem `git_branch` trong `PROGRESS.json`).

### Bước 2 — Chia batch 5 chương/agent dịch
- Chia dải chương thành các cụm **5 chương liên tiếp**, mỗi cụm giao cho 1 subagent dịch (song song nếu có thể).
- Subagent chỉ cần đọc: `memo/STYLE_GUIDE.md`, `memo/GLOSSARY.tsv`, `memo/ROLLING_SUMMARY.md`, và đúng 5 file nguồn `chapters_zh/*.txt` được giao — không đọc thêm/grep lại các chương cũ khác.
- Model dịch bắt buộc: **cấp "Pro"** của dòng model đang dùng (Sonnet cho Claude, Gemini Pro cho Gemini) — không dùng cấp thấp hơn (chất lượng văn phong không đạt) hay cấp cao hơn không cần thiết (tốn quota).
- Định dạng file đầu ra `chapters_out/{vi:D4}.md`: dòng 1 `Chương {N}: {Tiêu đề}`, dòng 2 trống, phần còn lại là nội dung, mỗi đoạn cách nhau 1 dòng trống.

### Bước 3 — QA tự động & đánh giá chất lượng (>= 9.7/10)
Gom toàn bộ dải chương vừa dịch (mọi cụm 5 chương), chỉ chạy QA + commit + push **một lần duy nhất ở cuối phiên**, không làm riêng từng cụm. Chạy trực tiếp bởi agent điều phối (xem bài học #8):
```
qa_chapters.ps1 -Start <Start> -End <End>      # Windows/PowerShell (máy chính)
python3 qa_chapters.py --start <Start> --end <End>   # Linux/cloud, không có PowerShell
```
- `FAIL_CJK`, `FAIL_MOJIBAKE`, `FAIL_RATIO`, `FAIL_SPACE`, `FAIL_BADBYTE`: mở file lỗi, sửa tay hoặc dịch lại đúng chương đó.
- `WARN_PARACOUNT`, `WARN_DUP`, `FAIL_SLANG`: đối chiếu nguồn, sửa thủ công; kiểm tra false positive trước khi sửa văn bản (xem bài học #10).
- Đánh giá chất lượng dịch thuật thủ công (độ mượt, nhịp điệu, thần thái Cổ Phong Tiên Gia, chính xác thuật ngữ) — dưới 9.7/10 thì tinh chỉnh lại ngay.
- Lặp lại cho đến khi toàn dải đạt `OK` và đủ chuẩn chất lượng.

### Bước 4 — Đóng gói EPUB (tùy chọn, khi user yêu cầu hoặc đủ mốc chương)
Cũng chạy trực tiếp bởi agent điều phối (không delegate), cùng lý do bài học #8.

### Bước 5 — Cập nhật trí nhớ dịch thuật
1. Cập nhật `last_done_vi` trong `memo/PROGRESS.json` = chương cuối cùng vừa dịch xong QA.
2. Thêm tên riêng mới vào `memo/GLOSSARY.tsv`.
3. Cập nhật `memo/ROLLING_SUMMARY.md` (và `memo/STORY_BIBLE.md` nếu có diễn biến lớn).

### Bước 6 — Commit & push MỘT LƯỢT DUY NHẤT
Sau khi toàn bộ dải chương của phiên đã qua QA sạch, gộp mọi thay đổi thành 1 commit duy nhất (không commit riêng từng cụm 5 chương). **Checklist bắt buộc phải có trong commit này — dễ bị bỏ sót nếu không rà lại `git status` trước khi commit:**
- [ ] `chapters_out/` — các file chương mới dịch.
- [ ] `memo/` — `PROGRESS.json`, `GLOSSARY.tsv`, `ROLLING_SUMMARY.md` (và `STORY_BIBLE.md` nếu sửa).
- [ ] `scratchpad/qa_output.csv` — kết quả QA vừa chạy ở Bước 3, **luôn kèm dù chỉ đổi vài dòng**.
- [ ] File `.epub` mới **nếu** Bước 4 (build EPUB) có chạy trong phiên (kèm cả việc xóa file `.epub` mốc chương cũ mà script tự dọn).
- [ ] Nếu có sửa logic script QA (`qa_chapters.ps1`/`.py`) để fix false positive, cũng kèm trong cùng commit.

```bash
git add chapters_out/ memo/ scratchpad/qa_output.csv
# Nếu có build EPUB ở Bước 4: git add "*.epub" (bao gồm xóa file .epub mốc cũ)
# Nếu có sửa qa_chapters.ps1/.py: git add scratchpad/qa_chapters.ps1 scratchpad/qa_chapters.py
git commit -m "Dich chuong <Start>-<End> <Ten truyen>, QA dat chuan"
git push origin <branch>
```
Luôn xác nhận với user trước khi push nếu chưa được ủy quyền làm việc này tự động trong phiên.

---

## 🔁 4. GIỚI HẠN RETRY — TRÁNH LẶP LỖI VÔ HẠN ĐỐT TOKEN

Bất kỳ hành động nào có thể thất bại (git push/pull bị reject, script QA báo lỗi hoài, subagent dịch trả về lỗi/thiếu chương, build EPUB lỗi...) đều áp dụng quy tắc: **thử tối đa 3 lần cho cùng một lỗi, nếu lần thứ 3 vẫn fail thì DỪNG LẠI ngay và báo cáo cho user** — tuyệt đối không tự lặp lại lần thứ 4 trở đi.
- Mỗi lần retry phải **thay đổi cách xử lý** (ví dụ: `git push` bị reject → lần 2 `git fetch` + xem log trước khi push lại; lần 3 nếu vẫn conflict → dừng, hỏi user) chứ không chạy lại y hệt lệnh cũ.
- Khi dừng vì hết 3 lần retry: báo rõ cho user lỗi cụ thể, đã thử những gì, và trạng thái hiện tại (chương nào đã dịch/QA xong nhưng chưa commit/push) — không âm thầm bỏ cuộc.
- Áp dụng cho subagent dịch (Bước 2): retry tối đa 3 lần (có thể đổi prompt/chia nhỏ chương hơn ở lần 2-3), quá 3 lần thì báo user và giữ nguyên chương đó ở trạng thái chưa xong.
- Áp dụng cho Bước 3 (QA) và Bước 6 (commit/push): nếu chạy 3 lần vẫn còn `FAIL_*`/lỗi push, dừng và liệt kê rõ chương/lỗi còn lại cho user xử lý thủ công.

---

## 📋 5. GHI CHÚ NHANH

- Đơn vị giao việc cho mỗi subagent dịch: **5 chương/agent**, model cấp "Pro" của dòng đang dùng.
- QA + commit + push: **chạy 1 lượt cho cả phiên**, không chạy riêng theo từng cụm 5 chương.
- Commit luôn kèm `scratchpad/qa_output.csv` (và `.epub` nếu có build) — xem checklist Bước 6.
- Script `.ps1`/`.py` (QA, build EPUB) chỉ chạy được đúng môi trường tương ứng — không bao giờ giao cho subagent chạy vì có thể lệch OS/runtime.
- **Retry tối đa 3 lần cho mọi lỗi, quá 3 lần thì dừng và báo user** — không lặp vô hạn gây tốn token/quota.
