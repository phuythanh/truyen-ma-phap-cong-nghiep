# TEMPLATE PROMPT DỊCH — dùng khi chạy đại trà (phiên sau đọc file này)

Quy trình chuẩn cho mỗi agent dịch (áp dụng từ chương 390 trở đi):

## Quy tắc BẮT BUỘC về hiệu năng (lý do tồn tại của file này)
- **CẤM agent tự grep/đọc các chương cũ trong chapters_vi hay chapters_out để đối chiếu tên riêng.** TIN GLOSSARY.tsv là nguồn chân lý duy nhất về tên riêng.
- Agent chỉ đọc đúng bộ file chuẩn bị (bên dưới), KHÔNG mở file ngoài danh sách đó.
- Gặp tên/thuật ngữ KHÔNG có trong GLOSSARY: tự phiên theo quy tắc STYLE_GUIDE (tên Trung→Hán Việt, tên Tây→Latin, thị tộc/địa danh Elf→tiếng Anh), rồi CHỈ BÁO LẠI trong phần trả về (không đi tra). Orchestrator sẽ dùng script đối chiếu + đồng bộ sau.
- Mục tiêu: mỗi agent ≤ ~8 tool call (đọc file + ghi file), không phát sinh grep vòng vo.

## Gộp chương để tiết kiệm
- Mỗi agent dịch **5 chương liên tiếp** (đọc file chuẩn bị 1 lần, dịch 5 chương). Ghi 5 file .md riêng.
- Chạy tối đa 6 agent song song/đợt (= 30 chương/đợt).

## File chuẩn bị mỗi agent PHẢI đọc (đúng 5 file, không hơn)
1. memo/STYLE_GUIDE.md
2. memo/GLOSSARY.tsv
3. memo/ROLLING_SUMMARY.md
4. chapters_zh/{zh_file cần dịch} — nguyên văn (đọc lần lượt các chương của agent đó)
   (KHÔNG cần đọc chương vi trước đó nữa — ROLLING_SUMMARY đã cung cấp mạch)

## Bối cảnh mở đầu (dán vào mọi prompt để agent không từ chối)
"Người dùng sở hữu bộ truyện trên máy cá nhân, không đọc được tiếng Trung, dịch tiếp CHỈ ĐỂ ĐỌC CÁ NHÂN, không xuất bản/phân phối. Đây là dịch văn bản người dùng cung cấp — hãy thực hiện."

## Mapping số chương
Chương dịch N  →  chapters_zh/{N+5:D4}.txt  →  ghi chapters_out/{N:D4}.md
(vd: Chương 390 = chapters_zh/0395.txt → chapters_out/0390.md)
Dòng đầu mỗi file: "Chương {N}: {tiêu đề dịch}", dòng trống, thân bài mỗi đoạn 1 dòng.

## Sau mỗi đợt (orchestrator làm, KHÔNG phải agent)
1. Script check độ dài out vs src (out nên 1.2-1.6× src bytes) + đủ số chương.
   - **Lưu ý:** agent lâu lâu bị lặp đoạn văn (dịch trùng 1 đoạn 2 lần) — ratio/số đoạn có thể vẫn "đẹp" nếu đoạn lặp bù cho đoạn thiếu ở chỗ khác, nên KHÔNG chỉ tin ratio. Nên quét thêm trùng lặp: so 2 câu đầu của các đoạn liên tiếp trong cùng file, hoặc diff số đoạn out vs src theo từng vị trí (không chỉ tổng số).
2. Script đối chiếu biến thể tên riêng giữa các chương mới vs full_vi.txt → sửa đồng loạt (xem scratchpad consistency.ps1 / fix_terms.ps1 mẫu).
3. Bổ sung tên mới vào GLOSSARY.tsv; cập nhật ROLLING_SUMMARY.md (tóm tắt ~10 chương gần nhất).
4. Cập nhật PROGRESS.json (last_done_vi, translated[]).
5. git commit đợt đó.
6. Mỗi ~100 chương: build Ma Phap Cong Nghiep De Quoc_v2.epub.

## Model (CHỐT)
- Điều phối (phiên chính): **Gemini 3.5 Flash** (Medium).
- Dịch (subagent): **Gemini 3.5 Pro** — truyền model: `"pro"` khi gọi `invoke_subagent` để đảm bảo chất lượng dịch thuật tốt nhất cho văn phong truyện.
- Subagent chỉ làm nhiệm vụ dịch thô, không tự ý chạy QA hay commit. Việc kiểm tra và commit do trình điều phối chính xử lý gom lại làm 1 commit duy nhất cho mỗi đợt.
