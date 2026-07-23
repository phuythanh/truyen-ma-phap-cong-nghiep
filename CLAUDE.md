# CLAUDE WORKFLOW — Ma Pháp Công Nghiệp Đế Quốc (魔法工业帝国)

Tài liệu này hướng dẫn riêng cho **Claude Code** (hoặc các AI Agent khác sử dụng Claude) cách phối hợp dịch thuật và quản trị codebase trong dự án này.

---

## 📌 LIÊN KẾT ĐẾN BỘ TÀI LIỆU CHÍNH (NGUỒN CHÂN LÝ)

Mọi quy định cốt lõi về hệ thống ánh xạ chương, quy tắc xưng hô, văn văn phong, từ điển và tiến độ đều được đồng bộ hóa với Gemini CLI và được lưu tại các tài liệu sau:

1. **[GEMINI.md](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/GEMINI.md)**: **BẮT BUỘC ĐỌC TRƯỚC**. File này chứa toàn bộ pipeline dịch thuật chi tiết, nguyên tắc mã hóa UTF-8, và cách đóng gói EPUB. Claude cần tuân thủ 100% các nguyên tắc trong đó.
2. **[memo/PROGRESS.json](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/PROGRESS.json)**: Lưu tiến độ dịch hiện tại (trường `last_done_vi`).
3. **[memo/STYLE_GUIDE.md](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/STYLE_GUIDE.md)**: Quy chuẩn xưng hô (Hứa Dịch xưng "tôi" - gọi "anh", default ngôi 2 xưng "tôi", cực kỳ hạn chế mày-tao).
4. **[memo/GLOSSARY.tsv](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/GLOSSARY.tsv)**: Tra cứu nhanh từ vựng, tên nhân vật, địa danh.
5. **[memo/ROLLING_SUMMARY.md](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/ROLLING_SUMMARY.md)**: Tóm tắt ngữ cảnh 10 chương gần nhất.

---

## ⚠️ NGUYÊN TẮC QUAN TRỌNG KHI CHẠY TRÊN CLAUDE CODE

Khi hoạt động trong môi trường Claude Code, bạn phải tuyệt đối lưu ý các vấn đề sau để tránh phát sinh lỗi hệ thống hoặc làm gián đoạn tiến trình:

### 1. Tránh lỗi thoát lệnh chạy ngầm (Hung PowerShell process)
* Khi gọi các lệnh quét kiểm tra tệp tin hoặc script kiểm tra QA, hãy đảm bảo lệnh thực thi kết thúc hoàn toàn. Tránh viết các vòng lặp vô hạn hoặc để terminal đợi phản hồi thủ công.
* Nếu phát hiện một tiến trình PowerShell chạy ngầm bị treo, hãy dùng công cụ quản lý task của hệ thống để hủy (`kill`) nó ngay lập tức.

### 2. Cảnh giác lỗi nội suy biến (PowerShell CLI Variable Interpolation)
* **Tuyệt đối KHÔNG dùng dấu nháy kép `"`** để bọc câu lệnh PowerShell chạy trực tiếp qua CLI (ví dụ: `powershell -Command "..."`) nếu trong câu lệnh có sử dụng ký hiệu `$` (như các biến PowerShell `$p`, `$_`).
* Việc dùng nháy kép sẽ khiến Command Prompt / shell cha tự động nội suy biến thành trống trước khi truyền cho PowerShell, gây lỗi cú pháp nghiêm trọng (như lỗi không nhận diện dấu `=`).
* **BẮT BUỘC dùng dấu nháy đơn `'...'`** để giữ nguyên vẹn ký tự câu lệnh khi truyền qua CLI:
  ```powershell
  # Ví dụ lệnh đúng:
  powershell.exe -NoProfile -Command '1190..1214 | ForEach-Object { $p = "E:/work/truyen/truyen-ma-phap-cong-nghiep/chapters_out/" + $_.ToString("0000") + ".md"; if (Test-Path $p) { Write-Host ($_.ToString("0000") + ".md exists") } }'
  ```

### 3. Đồng bộ hóa tiến trình sau khi dịch
Sau khi hoàn thành dịch bất kỳ nhóm chương nào, bắt buộc thực hiện theo trình tự:
1. **Chạy QA tự động:** `powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start <Start> -End <End>"`
2. **Cập nhật tiến độ:** Ghi nhận vào [memo/PROGRESS.json](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/PROGRESS.json) (tăng `last_done_vi`) và thêm tóm tắt vào [memo/ROLLING_SUMMARY.md](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/ROLLING_SUMMARY.md).
3. **Đóng gói sách:** `powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"`
4. **Git Commit & Push:**
   * Stage các file mới và sửa đổi.
   * *Lưu ý:* Cần chạy `git add -f` đối với các file cấu trúc EPUB bị bỏ qua trong `.gitignore` (như `scratchpad/epub_build/OEBPS/content.opf` và `scratchpad/epub_build/OEBPS/toc.ncx`).
   * Commit với thông điệp rõ ràng và chạy `git push`.
