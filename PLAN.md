# PLAN — Ma Pháp Công Nghiệp Đế Quốc (魔法工业帝国)
## Dịch tiếp bản Trung → Việt theo văn phong epub, gộp thành 1 epub mới

Cập nhật: 2026-07-08. Persona khi dịch: **dịch giả truyện chuyên nghiệp 10 năm kinh nghiệm + developer** — script làm hết việc cơ bắp, LLM chỉ dịch.

---

## ✅ ĐÃ XONG (Phase 0 — nguồn & extract)

### Nguồn bản Trung — ĐÃ CHỐT
- **Nguồn chọn: txt80.cc** — file TXT nguyên bộ, đã tải về và verify:
  - `raw_zh/txt80_mofa.txt` (gốc GB18030) → `raw_zh/mofa_full_utf8.txt` (UTF-8 canonical)
  - **1280 chương, 完本 (đã hoàn thành), ~4.5 triệu chữ**
  - Text SẠCH: header chương nằm riêng dòng, câu cuối chương nguyên vẹn
- Nguồn bị LOẠI: ixdzs8 (mỗi chương mất câu cuối — header dán vào giữa câu), zxcs/知轩藏书 (mạng chặn), 69shu/quanben/bqgui (403 hoặc sai truyện)
- Fallback nếu cần: crawl ixdzs8.com/read/66187/ từng trang HTML (text trang web đầy đủ, chỉ file txt của nó bị lỗi)

### Đã tách & đối chiếu
- `chapters_zh\0001.txt … 1280.txt` — mỗi chương 1 file, đánh **số thứ tự toàn cục** (số trong header 第N章 restart theo từng quyển, ĐỪNG dùng số đó)
- `raw_zh/toc_zh.txt` — mục lục 1280 chương (index toàn cục | tiêu đề)
- `raw_zh/toc_vi_unique.txt` — 386 tiêu đề chương gốc của epub (sau khi gộp các phần (1/2)(2/2); epub có 759 file nhưng chỉ 386 chương thật)

### ĐIỂM NỐI — ĐÃ XÁC NHẬN 100%
- Epub kết thúc = **zh chương toàn cục #391** (第60章 离去之前 / "Rời đi")
- Đã so nội dung đoạn cuối: khớp từng câu
- **→ DỊCH TIẾP TỪ `chapters_zh\0392.txt`. Còn 889 chương (392→1280).**

---

## Phase 1 — Tạo bộ FILE GHI NHỚ (làm 1 lần, trước khi dịch)

Tất cả lưu tại `C:\truyen\maphap\memo\`:

| File | Nội dung | Cách tạo | Token |
|---|---|---|---|
| `GLOSSARY.tsv` | `中文 → Tiếng Việt → loại (nhân vật/địa danh/tổ chức/thuật ngữ)` | Script: regex cụm viết hoa bên epub + n-gram tần suất bên zh → LLM map 2 danh sách (2-3 call) | ~10k |
| `STYLE_GUIDE.md` | Quy tắc văn phong: tên Trung → Hán Việt (许亦=Hứa Dịch), tên Tây giữ nguyên (Bontar, Camillo, Senkohel), xưng hô từng cặp nhân vật, giọng kể, format tiêu đề | Đọc 4 chương epub rải rác (đầu/giữa/cuối) → rút quy tắc | ~25k |
| `STORY_BIBLE.md` | Nhân vật + quan hệ + trạng thái hiện tại, thế lực, hệ thống ma pháp–công nghiệp, mạch truyện dang dở tại ch.391 | Tóm tắt kỹ 60 chương epub cuối (batch 10 chương/lần, model rẻ) + khung tiêu đề toàn bộ (miễn phí từ toc) | ~200k (Haiku) |
| `ROLLING_SUMMARY.md` | Tóm tắt 10 chương vừa dịch gần nhất (~300 từ), cập nhật liên tục | Sinh ra trong pipeline dịch | — |
| `PROGRESS.json` | `{last_done: 391, glossary_version: ..., failed: []}` — resume được khi đứt giữa chừng | Script tự ghi | 0 |

## Phase 2 — Pipeline dịch (chi phí chính)

**Trả lời câu "có translate-book không": KHÔNG có skill sẵn tên đó trong Claude Code.** Cách đỡ tốn nhất là tự build script gọi thẳng Claude API (chính là plan này) — rẻ hơn nhiều so với dịch trong session chat vì: (1) prompt caching cho system prompt, (2) Batch API giảm 50%, (3) chọn được model rẻ.

### Cấu trúc mỗi request (thiết kế để cache tối đa)
```
[SYSTEM - CỐ ĐỊNH, CACHE 1h]:
  Persona: "Bạn là dịch giả truyện mạng chuyên nghiệp 10 năm kinh nghiệm,
  chuyên dịch Trung→Việt thể loại huyền huyễn/công nghiệp..."
  + STYLE_GUIDE.md (toàn bộ)
  + GLOSSARY: ~150 tên xuất hiện nhiều nhất (phần ổn định — để cache không vỡ)
[USER - THAY ĐỔI TỪNG CHƯƠNG]:
  + Glossary phụ: script grep sẵn những tên hiếm CÓ trong chương này
  + ROLLING_SUMMARY (ngữ cảnh 10 chương trước)
  + Nguyên văn chương tiếng Trung
→ OUTPUT: bản dịch tiếng Việt hoàn chỉnh
```
- Sau mỗi 10 chương: 1 call rẻ cập nhật ROLLING_SUMMARY + script phát hiện tên Trung mới chưa có trong glossary → bổ sung (vào phần user, không đụng phần cache).
- Retry + validate: script check output có đủ độ dài (~70-130% bản gốc), có tiêu đề, không lẫn tiếng Trung sót.

### Chọn model & chi phí (ước tính 889 chương × ~5k in + ~7k out)

| Cách chạy | Chi phí ước tính | Ghi chú |
|---|---|---|
| **Sonnet 5 + Batch API** ← khuyên dùng | **~$35-40** (giá intro $2/$10 tới 31/8/2026) | Chất lượng văn dịch tốt nhất trong tầm giá; batch trả kết quả trong ~1h/đợt |
| Haiku 4.5 + Batch API | ~$18-20 | Rẻ nhất, văn phong sẽ đơ hơn — dịch thử để so |
| Opus 4.8 + Batch | ~$90 | Không cần thiết cho dịch thuật |
| Chạy trong Claude Code (subagent) | $0 tiền API (ăn quota subscription) | Chậm, ngốn quota; chỉ hợp nếu không muốn tạo API key |

**Bước bắt buộc trước khi chạy đại trà: dịch thử chương 392-394 bằng Sonnet 5 và Haiku, mày đọc so văn phong với epub rồi chốt model.**

### Script chạy (PowerShell/curl hoặc Node, không cần Python)
- `translate.ps1`: đọc PROGRESS.json → gom 25-50 chương/batch → submit Batch API → poll → validate → ghi `chapters_out\NNNN.md` → cập nhật PROGRESS + ROLLING_SUMMARY.
- Đứt mạng/lỗi giữa chừng: chạy lại là tự resume.

## Phase 3 — Gộp thành 1 EPUB MỚI (yêu cầu đã chốt: 1 file duy nhất)

Script build epub (0 token):
1. Bung epub cũ, giữ nguyên 759 file chương cũ + CSS + cover + metadata.
2. Chương mới: tiếp số từ **Chương 760** (1 chương raw = 1 chương epub, không tách (1/2) nữa) → `C760.xhtml … C1648.xhtml`.
3. Cập nhật `content.opf` + `toc.ncx`, zip lại đúng chuẩn (mimetype store-only đầu file).
4. Output: `Ma Pháp Công Nghiệp Đế Quốc - FULL 1648 chương.epub`.
- Build lại được nhiều lần — dịch tới đâu đóng epub tới đó để đọc dần.

## Thứ tự thực hiện
1. Phase 1: glossary + style guide + story bible (≈ 1 buổi chạy)
2. Dịch thử 3 chương (Sonnet vs Haiku) → **mày duyệt văn phong**
3. Phase 2 chạy đại trà theo batch (theo dõi qua PROGRESS.json)
4. Phase 3 build epub mỗi ~100 chương

## Cần từ mày
1. **API key Anthropic** (console.anthropic.com) — hoặc chọn chạy bằng quota Claude Code
2. Duyệt bản dịch thử trước khi chạy 889 chương
