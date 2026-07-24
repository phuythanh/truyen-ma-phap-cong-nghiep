# HỆ THỐNG DỊCH THUẬT TỰ ĐỘNG BẰNG CLAUDE CODE — HƯỚNG DẪN CHO AGENT

Tài liệu này là bản tương đương của [GEMINI.md](GEMINI.md) nhưng viết riêng cho **Claude Code**, ánh xạ đúng theo các tool thật sự có trong harness này (`Agent`, `Bash`/`PowerShell`, `ScheduleWakeup`, `TaskCreate`...) thay vì cú pháp `invoke_subagent`/`schedule` của Antigravity/Gemini CLI. Đọc file này trước khi bắt đầu bất kỳ phiên dịch nào trong repo.

**Truyện hiện tại:** Huyền Giám Tiên Tộc — **branch Git dùng riêng cho truyện này: `huyen-giam-tien-toc`**. Luôn kiểm tra `git branch --show-current` đúng là branch này trước khi dịch/commit/push; đừng push nhầm sang `master` hay branch `template`.

**Kiểm tra Auto Mode trước khi tự chạy toàn bộ pipeline:** "Auto Mode" (chạy tự động, không dừng lại hỏi xác nhận từng bước) là chế độ do user bật khi khởi động phiên (chọn permission mode/chạy `/loop`...) — **agent không tự bật được** chế độ này cho chính mình. Đầu mỗi phiên, kiểm tra xem có system-reminder "Auto Mode Active" hay không:
- **Có** → được phép tự chạy trọn Bước 1→6 ở mục 3 mà không cần hỏi lại từng bước (kể cả commit/push), miễn vẫn tuân thủ giới hạn retry ở mục 4.
- **Chưa có** (phiên thường, permission mode mặc định) → vẫn dịch bình thường theo pipeline, nhưng phải xác nhận với user trước các hành động khó đảo ngược/ảnh hưởng shared state (đặc biệt `git push`) trước khi thực hiện, thay vì tự động làm hết như khi có Auto Mode.

---

## 📌 1. CẤU TRÚC DỰ ÁN & CẤU HÌNH

- `chapters_zh/`: file nguồn tiếng Trung `{zh_number:D4}.txt`.
- `chapters_out/`: file dịch tiếng Việt `{vi_number:D4}.md`.
- `memo/`: cấu hình + trí nhớ dịch thuật:
  - `PROGRESS.json` — trạng thái tiến độ (`last_done_vi`, `offset_zh_minus_vi`, ...).
  - `STYLE_GUIDE.md` — quy tắc văn phong, xưng hô.
  - `GLOSSARY.tsv` — từ điển tên riêng (nguồn chân lý duy nhất, không tự suy đoán).
  - `ROLLING_SUMMARY.md` — tóm tắt mạch truyện gần nhất.
  - `STORY_BIBLE.md` — nhân vật, thế lực, bối cảnh.
  - `TRANSLATE_PROMPT.md` — prompt mẫu cho subagent dịch.
  - `AUTONOMOUS_PLAN.md` — kế hoạch chạy vòng lặp tự động dài hạn (đã viết cho Antigravity `schedule`; khi chạy bằng Claude Code hãy dùng `ScheduleWakeup`/skill `loop` thay thế, xem mục 4).
- `scratchpad/qa_chapters.ps1` — script QA (kiểm CJK sót, mojibake, lệch đoạn, trùng lặp, tỉ lệ độ dài).
- `scratchpad/qa_chapters.py` — **bản port Python 1:1 của `qa_chapters.ps1`** (đã verify byte-for-byte cùng logic, cùng pattern mojibake, cùng ngưỡng FAIL/WARN), dùng khi QA phải chạy trên môi trường Linux/cloud không có PowerShell (xem mục 5 — 2 cloud routine tự động). Cách chạy: `python3 scratchpad/qa_chapters.py --start <N> --end <M>` (fallback `python` nếu không có `python3`), output CSV cùng định dạng tại `scratchpad/qa_output.csv`. Trên máy Windows local vẫn ưu tiên dùng bản `.ps1` như mục 3 mô tả.
- `scratchpad/build_epub_full.ps1` — đóng gói EPUB từ toàn bộ `chapters_out/`.
- `scratchpad/build_epub_full.py` — bản port Python (Linux/bash-safe) của `build_epub_full.ps1`, dùng khi build EPUB phải chạy trên môi trường cloud/Linux không có PowerShell (xem mục 5 — cloud routine). Cách chạy: `python3 scratchpad/build_epub_full.py` (fallback `python`). Đọc `first_new_chapter_vi`/`last_done_vi`/`book_title`/`book_file_prefix` từ `memo/PROGRESS.json`, lấy asset (cover, css, cover.xhtml) từ `scratchpad/epub_assets/`, xuất ra `{book_file_prefix} - Chuong {first}-{last}.epub` ở root repo. Đã verify tạo ra file zip/epub hợp lệ.

Công thức số chương: **`Zh_Chapter = Vi_Chapter + offset_zh_minus_vi`** (đọc `offset_zh_minus_vi` từ `PROGRESS.json`).

---

## ⚠️ 2. CÁC LỖI ĐÃ GẶP — BÀI HỌC (áp dụng cho mọi model, không riêng Gemini)

1. **Mojibake trên Windows/PowerShell**: mọi thao tác đọc/ghi file phải UTF-8 (no BOM). Tránh redirect `>` trần trong PowerShell; dùng `-Encoding utf8`/`[System.IO.File]::WriteAllText()`. QA script tự phát hiện `FAIL_MOJIBAKE`.
2. **Sót chữ Hán / dịch cụt**: số đoạn văn bản dịch phải khớp 1-1 với bản gốc (trừ dòng tiêu đề). QA phát `WARN_PARACOUNT` nếu lệch quá 2 dòng — đối chiếu lại nguồn để bổ sung.
3. **Lặp đoạn văn**: QA phát `WARN_DUP` khi phát hiện câu đầu đoạn liên tiếp trùng nhau — phải mở file kiểm tra và xóa đoạn lặp.
4. **Lệch tên riêng**: luôn tra `memo/GLOSSARY.tsv` + `memo/STORY_BIBLE.md` trước khi dịch tên mới; thêm ngay vào glossary khi gặp tên chưa có.
5. **Xưng hô**: hạn chế tối đa "mày - tao" trừ khi cãi vã dữ dội; phân biệt "chúng tôi" (không gồm người nghe) và "chúng ta" (gồm người nghe).
6. **PowerShell không chạy được nếu Agent/Task bị đẩy sang môi trường Linux**: `qa_chapters.ps1` và `build_epub_full.ps1` cần `powershell.exe`/`pwsh`, chỉ có sẵn trên máy Windows của phiên chính. Nếu spawn qua `Agent` với `isolation: "remote"` (cloud) hoặc bất kỳ agent nền nào có khả năng chạy trên container Linux, script `.ps1` sẽ lỗi "command not found". Vì vậy **các bước QA (Bước 3) và build EPUB (Bước 4) phải do chính main agent của phiên hiện tại chạy trực tiếp bằng tool `PowerShell`, tuyệt đối không giao (delegate) cho một `Agent`/Task con khác thực thi**. Các subagent dịch (Bước 2) thì an toàn vì chỉ dùng Read/Write file, không phụ thuộc OS.

---

## 🛠️ 3. PIPELINE DỊCH THUẬT (CHẠY BẰNG CLAUDE CODE)

### Bước 1 — Main agent nạp context
1. Đọc `memo/PROGRESS.json` lấy `last_done_vi` và `offset_zh_minus_vi`.
2. Xác định dải chương cần dịch trong phiên này (ví dụ user yêu cầu "dịch tiếp 20 chương" → `Start = last_done_vi + 1`, `End = last_done_vi + 20`).
3. Xác nhận đang đứng ở branch `huyen-giam-tien-toc` (`git branch --show-current`).

### Bước 2 — Chia batch 5 chương/agent, dịch bằng Sonnet
- Main agent (model mặc định của phiên, thường là Sonnet/Opus điều phối) **không tự dịch trực tiếp** khi dải chương lớn — mà chia dải thành các cụm **5 chương liên tiếp**.
- Với mỗi cụm 5 chương, gọi tool `Agent` **một lần** với:
  - `subagent_type`: `"claude"` hoặc `"general-purpose"` (agent thường, không phải `fork` — subagent dịch không cần thấy lịch sử hội thoại của main agent, chỉ cần đọc đúng các file glossary/style/rolling-summary/nguồn).
  - `model`: `"sonnet"` — **bắt buộc dùng Sonnet cho mỗi agent dịch**, không dùng Haiku (chất lượng văn phong không đạt) hay Opus (không cần thiết, tốn quota).
  - `prompt`: giao đúng 5 chương (Start..Start+4), kèm hướng dẫn theo `memo/TRANSLATE_PROMPT.md` (đọc `STYLE_GUIDE.md`, `GLOSSARY.tsv`, `ROLLING_SUMMARY.md`, file nguồn tương ứng; ghi ra `chapters_out/{vi:D4}.md` đúng định dạng: dòng 1 `Chương {N}: {Tiêu đề}`, dòng 2 trống, phần còn lại là nội dung, mỗi đoạn cách nhau 1 dòng trống).
- Nếu dải chương cần dịch nhiều hơn 5 (ví dụ 20 chương = 4 cụm), gọi **nhiều Agent trong cùng một message** (song song) để tối ưu thời gian — mỗi lời gọi vẫn là 1 subagent riêng phụ trách đúng 5 chương của nó.
- **Không** dùng `subagent_type: "fork"` cho việc dịch — dịch thuật không cần kế thừa context hội thoại, và fork sẽ không nhận `model` override (fork luôn chạy model của agent cha).

### Bước 3 — Main agent chờ tất cả subagent dịch xong, RỒI MỚI chạy QA 1 LƯỢT
Đây là điểm khác biệt quan trọng so với chạy từng cụm riêng lẻ: **main agent gom toàn bộ dải chương vừa dịch (toàn bộ các cụm 5 chương) và chỉ chạy QA + commit + push MỘT LẦN DUY NHẤT ở cuối phiên**, không QA/commit riêng từng cụm 5 chương. **Bước này main agent phải tự chạy bằng tool `PowerShell` của chính phiên hiện tại — không giao cho `Agent` con** (xem lỗi #6 ở mục 2: agent con có thể chạy trên Linux, không có `powershell.exe`).
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start <Start_toan_dai> -End <End_toan_dai>"
```
- Nếu có `FAIL_CJK`, `FAIL_MOJIBAKE`, `FAIL_RATIO`, `FAIL_SPACE`, `FAIL_BADBYTE`: mở file lỗi, sửa tay hoặc spawn lại 1 Agent (model `sonnet`) dịch lại đúng chương đó.
- `WARN_PARACOUNT`, `WARN_DUP`: đối chiếu nguồn, sửa thủ công.
- Lặp lại QA cho đến khi toàn dải đạt `OK` (hoặc chỉ còn WARN đã xem xét và chấp nhận được).

### Bước 4 — Đóng gói EPUB (tùy chọn, khi user yêu cầu hoặc đủ mốc chương)
Cũng phải do main agent tự chạy trực tiếp, không delegate cho `Agent` con (cùng lý do PowerShell/Linux ở lỗi #6).
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
```

### Bước 5 — Cập nhật trí nhớ dịch thuật
1. Cập nhật `last_done_vi` trong `memo/PROGRESS.json` = chương cuối cùng vừa dịch xong QA.
2. Thêm tên riêng mới vào `memo/GLOSSARY.tsv`.
3. Cập nhật `memo/ROLLING_SUMMARY.md` (và `memo/STORY_BIBLE.md` nếu có diễn biến lớn).

### Bước 6 — Commit & push MỘT LƯỢT DUY NHẤT
Sau khi toàn bộ dải chương của phiên đã qua QA sạch, main agent mới `git add` + `git commit` + `git push` — gộp chung mọi cụm 5 chương đã dịch trong phiên này thành 1 commit (không commit riêng từng cụm 5 chương):
```bash
git add chapters_out/ memo/
git commit -m "Dich chuong <Start>-<End> <Ten truyen>, QA dat chuan"
git push origin huyen-giam-tien-toc
```
Luôn xác nhận với user trước khi push nếu chưa được ủy quyền làm việc này tự động trong phiên.

---

## 🔁 4. GIỚI HẠN RETRY — TRÁNH LẶP LỖI VÔ HẠN ĐỐT TOKEN

Bất kỳ hành động nào có thể thất bại (git push/pull bị reject, script QA báo lỗi hoài, subagent dịch trả về lỗi/thiếu chương, build EPUB lỗi...) đều áp dụng quy tắc: **thử tối đa 3 lần cho cùng một lỗi, nếu lần thứ 3 vẫn fail thì DỪNG LẠI ngay và báo cáo cho user** — tuyệt đối không tự lặp lại lần thứ 4 trở đi, không đổi cách này sang cách khác rồi thử tiếp vô hạn.
- Mỗi lần retry phải **thay đổi cách xử lý** (ví dụ: `git push` bị reject → lần 2 `git fetch` + xem log trước khi push lại; lần 3 nếu vẫn conflict → dừng, hỏi user cách xử lý conflict) chứ không chạy lại y hệt lệnh cũ 3 lần.
- Khi dừng vì hết 3 lần retry: báo rõ cho user lỗi cụ thể là gì, đã thử những gì, và trạng thái hiện tại (chương nào đã dịch/QA xong nhưng chưa commit/push) để user tự quyết định bước tiếp theo — không âm thầm bỏ cuộc mà không nói gì.
- Áp dụng cho cả subagent dịch (Bước 2): nếu 1 Agent dịch trả lỗi hoặc file output hỏng, retry tối đa 3 lần (có thể đổi prompt/chia nhỏ chương hơn ở lần 2-3), quá 3 lần thì báo user và bỏ qua/giữ nguyên chương đó ở trạng thái chưa xong, không lặp gọi Agent vô hạn.
- Áp dụng cho Bước 3 (QA) và Bước 6 (commit/push): nếu chạy 3 lần vẫn còn `FAIL_*`/lỗi push, dừng và liệt kê rõ chương/lỗi còn lại cho user xử lý thủ công.

---

## 🤖 5. CHẠY VÒNG LẶP TỰ ĐỘNG DÀI HẠN (thay thế `schedule` của Antigravity)

`memo/AUTONOMOUS_PLAN.md` viết cho Antigravity CLI (`invoke_subagent`, `schedule`). Khi chạy vòng lặp tự động bằng Claude Code:
- Dùng skill `loop` (`/loop`) hoặc tool `ScheduleWakeup` để tự đặt lịch thức dậy dịch batch tiếp theo, thay vì cú pháp `schedule(DurationSeconds=..., TimerCondition="never")`.
- Mỗi lần "thức dậy": lặp lại đúng Bước 1→6 ở mục 3 (đọc `PROGRESS.json` → chia cụm 5 chương/Agent Sonnet → QA 1 lượt cho cả dải → cập nhật memo → commit+push 1 lượt) rồi mới đặt lịch thức dậy kế tiếp.

### 5.1 Cloud routine đang chạy (tạo qua skill `schedule`/tool `RemoteTrigger`)

Để dịch tự động ngay cả khi máy Windows local tắt/không mở phiên Claude Code, đã tạo **1 cloud routine** (cloud session cô lập, clone repo từ GitHub, chạy trên môi trường Linux — do đó **không có PowerShell**, xem ngoại lệ bên dưới). Routine này dịch tiếp **25 chương** mỗi lần chạy (5 cụm × 5 chương/Agent Sonnet), QA, cập nhật memo, commit + push lên `huyen-giam-tien-toc`:
- **`HuyenGiamTienToc - Dich 25 chuong (moi 5h)`** — id `trig_01VTyAKTZgU5x2cxxj5DfpkQ`, cron `53 */5 * * *` (chạy lúc 00:53, 05:53, 10:53, 15:53, 20:53 UTC = 07:53, 12:53, 17:53, 22:53, 03:53 Asia/Saigon — 5 lần/ngày, cách nhau 5h, riêng khoảng 20:53→00:53 hôm sau chỉ cách 4h vì 24h không chia hết cho 5).
- Chỉ 1 routine duy nhất chạy pipeline này (đã tắt phương án 2-routine trước đó để đơn giản và tránh dễ chạm rate limit khi 2 routine cùng gọi nhiều subagent song song).
- Quản lý (xem/sửa/tắt/xoá) tại https://claude.ai/code/routines — Claude không tự xoá routine được, chỉ có thể `update` (đổi cron/enabled) qua `RemoteTrigger`.
- **Ngoại lệ bắt buộc cho cloud routine** (đã ghi trong prompt của routine): dùng `scratchpad/qa_chapters.py` (Python) thay cho `qa_chapters.ps1` ở Bước 3, và `scratchpad/build_epub_full.py` thay cho `build_epub_full.ps1` ở Bước 4 — routine chạy build EPUB **mỗi lần** sau khi QA sạch, commit luôn file `.epub` mới cùng `chapters_out/`+`memo/` (Python script tự dọn EPUB cũ cùng prefix, không để tích file rác).
- Mỗi lần thức dậy đều bắt buộc `git pull --rebase` trước khi đọc `PROGRESS.json` và trước khi push, để không dẫm lên tiến độ dịch thủ công ở máy local.

---

## 📋 6. GHI CHÚ NHANH

- Model dịch bắt buộc cho subagent: **Sonnet** (đủ chất lượng văn phong, chi phí hợp lý; xem so sánh chi phí ở [PLAN.md](PLAN.md)).
- Đơn vị giao việc cho mỗi subagent dịch: **5 chương/agent**.
- QA + commit + push: **chạy 1 lượt cho cả phiên**, không chạy riêng theo từng cụm 5 chương.
- Branch Git của truyện này: **`huyen-giam-tien-toc`** — không đổi branch khi chưa được yêu cầu.
- Script `.ps1` (QA, build EPUB) chỉ chạy được trên Windows/PowerShell của main agent — không bao giờ giao cho `Agent`/Task con vì subagent có thể thực thi trên môi trường Linux không có `powershell.exe`.
- **Retry tối đa 3 lần cho mọi lỗi (git push, QA, subagent dịch...), quá 3 lần thì dừng và báo user** — không lặp vô hạn gây tốn token/quota (xem mục 4).
