# HỆ THỐNG DỊCH THUẬT TỰ ĐỘNG BẰNG CLAUDE CODE — HƯỚNG DẪN CHO AGENT

> ⚠️ **Đọc [PIPELINE_SHARED.md](PIPELINE_SHARED.md) TRƯỚC** — đó là nguồn chân lý duy nhất cho cấu trúc dự án, các bài học/lỗi đã gặp, logic pipeline 6 bước, checklist commit, và giới hạn retry. File `CLAUDE.md` này **chỉ chứa phần ánh xạ tool đặc thù cho Claude Code** (`Agent`, `Bash`/`PowerShell`, `ScheduleWakeup`, `TaskCreate`...) thay vì cú pháp `invoke_subagent`/`schedule` của Gemini CLI (xem [GEMINI.md](GEMINI.md)).
>
> **Khi cần thêm/sửa một quy tắc chung** (không riêng cú pháp tool Claude) **— sửa `PIPELINE_SHARED.md`, KHÔNG sửa ở đây** để tránh 2 AI làm việc lệch nhau.

**Truyện hiện tại:** Huyền Giám Tiên Tộc — **branch Git dùng riêng cho truyện này: `huyen-giam-tien-toc`**. Luôn kiểm tra `git branch --show-current` đúng là branch này trước khi dịch/commit/push; đừng push nhầm sang `master` hay branch `template`.

**Kiểm tra Auto Mode trước khi tự chạy toàn bộ pipeline:** "Auto Mode" (chạy tự động, không dừng lại hỏi xác nhận từng bước) là chế độ do user bật khi khởi động phiên (chọn permission mode/chạy `/loop`...) — **agent không tự bật được** chế độ này cho chính mình. Đầu mỗi phiên, kiểm tra xem có system-reminder "Auto Mode Active" hay không:
- **Có** → được phép tự chạy trọn Bước 1→6 (xem `PIPELINE_SHARED.md` mục 3) mà không cần hỏi lại từng bước (kể cả commit/push), miễn vẫn tuân thủ giới hạn retry (mục 4 của file đó).
- **Chưa có** (phiên thường, permission mode mặc định) → vẫn dịch bình thường theo pipeline, nhưng phải xác nhận với user trước các hành động khó đảo ngược/ảnh hưởng shared state (đặc biệt `git push`) trước khi thực hiện, thay vì tự động làm hết như khi có Auto Mode.

---

## 🛠️ ÁNH XẠ PIPELINE SANG TOOL CỦA CLAUDE CODE

Các bước dưới đây tương ứng 1-1 với "Bước 1→6" mô tả logic chung trong `PIPELINE_SHARED.md` mục 3 — ở đây chỉ nêu **cách gọi tool thật của Claude Code** cho từng bước.

### Bước 1 — Nạp context
Dùng `Read`/`Bash` đọc `memo/PROGRESS.json`, xác định dải chương, xác nhận branch bằng `git branch --show-current`.

### Bước 2 — Chia batch 5 chương/agent, dịch bằng Sonnet
- Main agent (model điều phối của phiên, thường Sonnet/Opus) **không tự dịch trực tiếp** khi dải chương lớn — chia dải thành các cụm **5 chương liên tiếp**.
- Với mỗi cụm 5 chương, gọi tool `Agent` **một lần** với:
  - `subagent_type`: `"claude"` hoặc `"general-purpose"` (agent thường, không phải `fork` — subagent dịch không cần thấy lịch sử hội thoại của main agent, chỉ cần đọc đúng các file glossary/style/rolling-summary/nguồn).
  - `model`: `"sonnet"` — **bắt buộc dùng Sonnet cho mỗi agent dịch**, không dùng Haiku (chất lượng văn phong không đạt) hay Opus (không cần thiết, tốn quota).
  - `prompt`: giao đúng 5 chương (Start..Start+4), kèm hướng dẫn theo `memo/TRANSLATE_PROMPT.md`.
- Nếu dải chương cần dịch nhiều hơn 5 (ví dụ 20 chương = 4 cụm), gọi **nhiều Agent trong cùng một message** (song song) để tối ưu thời gian.
- **Không** dùng `subagent_type: "fork"` cho việc dịch — dịch thuật không cần kế thừa context hội thoại, và fork sẽ không nhận `model` override (fork luôn chạy model của agent cha).

### Bước 3 — QA tự động (tool `PowerShell`, chạy trực tiếp bởi main agent)
Gom toàn bộ dải chương vừa dịch, chỉ chạy QA một lần duy nhất ở cuối phiên bằng tool `PowerShell` của chính phiên — **không giao cho `Agent` con** (xem bài học #8 trong `PIPELINE_SHARED.md`):
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start <Start_toan_dai> -End <End_toan_dai>"
```
Nếu có `FAIL_*`, mở file sửa tay hoặc spawn lại 1 `Agent` (`model: "sonnet"`) dịch lại đúng chương đó.

### Bước 4 — Đóng gói EPUB (tool `PowerShell`, chạy trực tiếp bởi main agent)
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
```

### Bước 5 — Cập nhật trí nhớ dịch thuật
Dùng `Read`/`Edit`/`Write` cập nhật `memo/PROGRESS.json`, `memo/GLOSSARY.tsv`, `memo/ROLLING_SUMMARY.md` (và `STORY_BIBLE.md` nếu cần) — xem chi tiết ở `PIPELINE_SHARED.md` mục 3, Bước 5.

### Bước 6 — Commit & push MỘT LƯỢT DUY NHẤT (tool `Bash`/`git`)
Theo đúng checklist ở `PIPELINE_SHARED.md` mục 3, Bước 6 (bắt buộc kèm `scratchpad/qa_output.csv`, kèm `.epub` mới nếu có build):
```bash
git add chapters_out/ memo/ scratchpad/qa_output.csv
git commit -m "Dich chuong <Start>-<End> <Ten truyen>, QA dat chuan"
git push origin huyen-giam-tien-toc
```
Luôn xác nhận với user trước khi push nếu chưa được ủy quyền làm việc này tự động trong phiên (xem mục Auto Mode ở trên).

---

## 🤖 CHẠY VÒNG LẶP TỰ ĐỘNG DÀI HẠN (thay thế `schedule` của Antigravity)

`memo/AUTONOMOUS_PLAN.md` viết cho Antigravity CLI (`invoke_subagent`, `schedule`). Khi chạy vòng lặp tự động bằng Claude Code:
- Dùng skill `loop` (`/loop`) hoặc tool `ScheduleWakeup` để tự đặt lịch thức dậy dịch batch tiếp theo, thay vì cú pháp `schedule(DurationSeconds=..., TimerCondition="never")`.
- Mỗi lần "thức dậy": lặp lại đúng Bước 1→6 (đọc `PROGRESS.json` → chia cụm 5 chương/Agent Sonnet → QA 1 lượt cho cả dải → cập nhật memo → commit+push 1 lượt theo checklist đầy đủ) rồi mới đặt lịch thức dậy kế tiếp.

### Cloud routine đang chạy (tạo qua skill `schedule`/tool `RemoteTrigger`)

Để dịch tự động ngay cả khi máy Windows local tắt/không mở phiên Claude Code, đã tạo **1 cloud routine** (cloud session cô lập, clone repo từ GitHub, chạy trên môi trường Linux — do đó **không có PowerShell**, xem ngoại lệ bên dưới). Routine này dịch tiếp **25 chương** mỗi lần chạy (5 cụm × 5 chương/Agent Sonnet), QA, cập nhật memo, commit + push lên `huyen-giam-tien-toc`:
- **`HuyenGiamTienToc - Dich 25 chuong (moi 5h)`** — id `trig_01VTyAKTZgU5x2cxxj5DfpkQ`, cron `53 */5 * * *` (chạy lúc 00:53, 05:53, 10:53, 15:53, 20:53 UTC = 07:53, 12:53, 17:53, 22:53, 03:53 Asia/Saigon — 5 lần/ngày, cách nhau 5h, riêng khoảng 20:53→00:53 hôm sau chỉ cách 4h vì 24h không chia hết cho 5).
- Chỉ 1 routine duy nhất chạy pipeline này (đã tắt phương án 2-routine trước đó để đơn giản và tránh dễ chạm rate limit khi 2 routine cùng gọi nhiều subagent song song).
- Quản lý (xem/sửa/tắt/xoá) tại https://claude.ai/code/routines — Claude không tự xoá routine được, chỉ có thể `update` (đổi cron/enabled) qua `RemoteTrigger`.
- **Ngoại lệ bắt buộc cho cloud routine** (đã ghi trong prompt của routine): dùng `scratchpad/qa_chapters.py` (Python) thay cho `qa_chapters.ps1` ở Bước 3, và `scratchpad/build_epub_full.py` thay cho `build_epub_full.ps1` ở Bước 4 — routine chạy build EPUB **mỗi lần** sau khi QA sạch, commit luôn file `.epub` mới cùng `chapters_out/`+`memo/`+`scratchpad/qa_output.csv` (Python script tự dọn EPUB cũ cùng prefix, không để tích file rác).
- Mỗi lần thức dậy đều bắt buộc `git pull --rebase` trước khi đọc `PROGRESS.json` và trước khi push, để không dẫm lên tiến độ dịch thủ công ở máy local.

---

## 📋 GHI CHÚ NHANH (đặc thù Claude Code)

- Model dịch bắt buộc cho subagent: **Sonnet** (đủ chất lượng văn phong, chi phí hợp lý; xem so sánh chi phí ở [PLAN.md](PLAN.md)).
- Branch Git của truyện này: **`huyen-giam-tien-toc`** — không đổi branch khi chưa được yêu cầu.
- Script `.ps1` (QA, build EPUB) chỉ chạy được trên Windows/PowerShell của main agent — không bao giờ giao cho `Agent`/Task con vì subagent có thể thực thi trên môi trường Linux không có `powershell.exe`.
- Mọi quy tắc khác (checklist commit, giới hạn retry, bài học QA...) xem `PIPELINE_SHARED.md` — không lặp lại ở đây để tránh lệch khi cập nhật.
