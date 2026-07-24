# HỆ THỐNG DỊCH THUẬT TỰ ĐỘNG BẰNG GEMINI CLI — HƯỚNG DẪN DỊCH TRUYỆN MỚI (TEMPLATE BRANCH)

Tài liệu này hướng dẫn các mô hình AI (Gemini CLI, Claude) cách thiết lập, quản lý và tiếp tục dịch một bộ truyện mới từ tiếng Trung sang tiếng Việt một cách tự động, chất lượng cao và đồng bộ.

---

## 📌 1. THIẾT LẬP THƯ MỤC & CẤU HÌNH TRUYỆN MỚI

Khi người dùng chuyển sang branch này và yêu cầu dịch một truyện mới, hãy thực hiện các bước chuẩn bị sau:

### A. Cấu trúc thư mục dự án
- `chapters_zh/`: Chứa file nguồn tiếng Trung, đặt tên theo định dạng `{zh_number:D4}.txt` (Ví dụ: `0001.txt`, `0002.txt`).
- `chapters_out/`: Chứa file dịch tiếng Việt đầu ra, đặt tên định dạng `{vi_number:D4}.md` (Ví dụ: `0001.md`, `0002.md`).
- `memo/`: Thư mục chứa cấu hình, từ điển và tóm tắt truyện.
- `scratchpad/`: Chứa các script QA và script đóng gói EPUB.
- `scratchpad/epub_assets/`: Chứa ảnh cover, stylesheet và trang bìa mẫu cho việc build sách.

### B. Cấu hình ban đầu trong `memo/PROGRESS.json`
Đọc và cập nhật file `memo/PROGRESS.json` với thông tin của truyện mới:
- `book_title`: Tên hiển thị của truyện mới (Ví dụ: "Ma Pháp Công Nghiệp Đế Quốc").
- `book_file_prefix`: Tên rút gọn dùng để đặt tên file EPUB xuất bản (Ví dụ: "Ma Phap").
- `offset_zh_minus_vi`: Chênh lệch số chương giữa file nguồn tiếng Trung và file dịch đầu ra.
  - Công thức: **`Zh_Chapter = Vi_Chapter + offset_zh_minus_vi`**
  - Nếu file Trung và Việt khớp 1-1 thì offset = 0.
- `first_new_chapter_vi`: Chương dịch đầu tiên của đợt này.
- `last_done_vi`: Chương dịch xong gần nhất (khởi đầu là 0 hoặc số chương đã dịch sẵn).

### C. Nạp từ điển và phong cách
- Điền các quy định xưng hô và giọng điệu chung vào `memo/STYLE_GUIDE.md`.
- Ghi nhận các nhân vật chính và bối cảnh vào `memo/STORY_BIBLE.md`.
- Reset và chuẩn bị header cho từ điển tra cứu nhanh `memo/GLOSSARY.tsv`.

---

## ⚠️ 2. CÁC LỖI NGHIÊM TRỌNG ĐÃ GẶP PHẢI & BÀI HỌC KINH NGHIỆM
*(Được tổng hợp từ dự án dịch trước đó để làm bài học xương máu cho các mô hình AI tiếp theo)*

### 1. Lỗi Mojibake (Lỗi font, rác ký tự ANSI) trên Windows/PowerShell
- **Nguyên nhân:** Khi chạy script PowerShell để xử lý file hoặc thay thế chuỗi, nếu dùng các lệnh pipe (`|`) hoặc redirect (`>`) hoặc gọi các hàm `.Replace()` trực tiếp trên console Windows (CP1252/ANSI) mà không chỉ định rõ mã hóa UTF-8, PowerShell 5.1 sẽ tự động giải mã các ký tự tiếng Việt có dấu thành rác ký tự.
- **Bài học:** Mọi thao tác đọc, ghi, xử lý file từ script PowerShell hoặc Python phải chỉ định rõ encoding là **UTF-8 (No BOM)**. Trong PowerShell, tránh dùng redirect `>` mà hãy dùng `[System.IO.File]::WriteAllText()` hoặc `Out-File -Encoding utf8`.
- **Hành động:** Luôn chạy QA kiểm tra Mojibake sau khi dịch xong. Nếu phát hiện có lỗi `FAIL_MOJIBAKE`, hãy sửa đổi file dịch trực tiếp bằng UTF-8.

### 2. Lỗi sót chữ Trung Quốc (CJK) hoặc dịch cụt/thiếu đoạn
- **Nguyên nhân:** Khi dịch cụm nhiều chương hoặc chương quá dài, mô hình AI (đặc biệt là các dòng model nhẹ như Haiku) thỉnh thoảng bỏ qua một số đoạn chữ Trung Quốc chưa dịch, hoặc kết thúc chương sớm dẫn đến cụt đoạn.
- **Bài học:** Số đoạn văn (paragraph count) của bản dịch tiếng Việt phải khớp tuyệt đối 1-1 với số đoạn văn của bản gốc tiếng Trung (ngoại trừ dòng tiêu đề).
- **Hành động:** Script QA tự động đếm dòng/đoạn sẽ phát ra cảnh báo `WARN_PARACOUNT` nếu số đoạn lệch quá 2 dòng. Hãy đối chiếu lại file nguồn để bổ sung phần dịch thiếu.

### 3. Lỗi lặp đoạn văn (Duplicate Paragraphs)
- **Nguyên nhân:** Một số mô hình thỉnh thoảng dịch lặp đi lặp lại một đoạn văn 2 lần liên tiếp trong cùng một file do hiện tượng lặp lại token.
- **Bài học:** Không được tin hoàn toàn vào kích thước file hay số dòng tổng thể nếu không có sự đối chiếu nội dung.
- **Hành động:** Script QA sẽ quét các câu đầu của các đoạn văn liên tiếp để tìm trùng lặp và phát lỗi `WARN_DUP`. Agent phải kiểm tra và xóa đoạn trùng lặp.

### 4. Lệch tên nhân vật và địa danh (Inconsistent Naming)
- **Nguyên nhân:** Khi dịch song song hoặc qua nhiều phiên, các agent tự phát phiên âm tên riêng theo cảm tính (Ví dụ: `斯坦丁` lúc dịch thành `Stan`, lúc dịch thành `Staging/Stading`).
- **Bài học:** Bắt buộc phải đọc và tra cứu nhanh tên riêng trong `memo/GLOSSARY.tsv` và `memo/STORY_BIBLE.md` trước khi dịch.
- **Hành động:** Khi xuất hiện nhân vật/địa danh mới, hãy thêm ngay vào `GLOSSARY.tsv` kèm quy định dịch để các chương tiếp theo không bị lệch.

### 5. Lỗi xưng hô đại từ
- **Bài học:** Cực kỳ hạn chế dùng "mày - tao" trừ khi nhân vật chửi bới, cãi vã dữ dội. Dùng "tôi", "ta", "ông/bà" để giữ văn phong nhã nhặn. Phân biệt rõ "chúng tôi" (không gồm người nghe) và "chúng ta" (gồm người nghe) để dịch chính xác ngữ cảnh.

---

## 🛠️ 3. PIPELINE DỊCH THUẬT TỰ ĐỘNG (FLOW DỊCH TRUYỆN MỚI)

Khi người dùng ra lệnh dịch, agent sẽ tự động chạy theo quy trình khép kín sau:

### Bước 1: Khởi động & Nạp Context
1. Đọc file `memo/PROGRESS.json` để biết trạng thái tiến độ hiện tại (`last_done_vi`) và các tham số cấu hình.
2. Xác định chương tiếp theo cần dịch: `vi_chapter = last_done_vi + 1`.
3. Xác định file nguồn tương ứng: `zh_chapter = vi_chapter + offset_zh_minus_vi`.
4. Tìm và đọc file nguồn `chapters_zh/{zh_chapter:D4}.txt`.
5. Đọc `memo/STYLE_GUIDE.md` và tra cứu `memo/GLOSSARY.tsv` để nắm bắt phong cách và từ khóa.

### Bước 2: Dịch thuật (Sử dụng subagent với model Gemini Pro)
Để đảm bảo chất lượng dịch thuật cao nhất và giữ ngữ cảnh tốt nhất:
1. Main Agent chạy bằng model `flash` (Gemini 3.5 Flash) sẽ điều phối toàn bộ quy trình.
2. Với mỗi đợt dịch, Main Agent sẽ chia cụm 5 chương liên tiếp và spawn một subagent `self` sử dụng model `pro` (Gemini 3.5 Pro) để thực hiện dịch (mỗi subagent nhận dịch song song hoặc tuần tự một cụm 5 chương để tối ưu hóa context).
3. **Định dạng file dịch (`chapters_out/{vi_chapter:D4}.md`):**
   - Dòng 1: `Chương {vi_chapter}: {Tiêu đề dịch}`
   - Dòng 2: Trống
   - Dòng 3 trở đi: Nội dung dịch (mỗi đoạn phân tách bằng 1 dòng trống, khớp 1-1 với bản gốc).

### Bước 3: Chạy QA Tự động, Đóng gói & Git Commit (Bằng Main Agent với model Gemini Flash)
Main Agent (model `flash`) quản lý toàn bộ quy trình hậu kỳ và điều hướng kiểm tra chất lượng:
1. Chạy script kiểm tra chất lượng cho các chương vừa dịch bằng PowerShell:
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start <vi_chapter> -End <vi_chapter>"
```
- Nếu kết quả trả về là `OK`: Đạt chuẩn.
- Nếu trả về lỗi (`FAIL_CJK`, `FAIL_MOJIBAKE`, `WARN_PARACOUNT`, `WARN_DUP`): Agent phải mở file dịch ra rà soát, sửa lỗi thủ công hoặc yêu cầu dịch lại phần bị hỏng.

### Bước 4: Đóng gói sách EPUB
Chạy script PowerShell để build sách điện tử tự động:
```powershell
powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
```
Script sẽ tự động:
1. Đọc cấu hình từ `PROGRESS.json`.
2. Tạo cấu trúc EPUB chuẩn trong thư mục tạm `scratchpad/epub_build/`.
3. Sao chép cover.png, css và trang bìa từ `scratchpad/epub_assets/`.
4. Quét toàn bộ các chương đã dịch trong `chapters_out/` và đóng gói thành file EPUB chất lượng cao tại thư mục gốc của dự án.
5. Dọn dẹp các file EPUB cũ để tránh lãng phí dung lượng.

### Bước 5: Cập nhật & Lưu trữ
1. Cập nhật `last_done_vi` trong `memo/PROGRESS.json` lên chương mới nhất vừa dịch.
2. Thêm các từ mới phát hiện vào `memo/GLOSSARY.tsv`.
3. Cập nhật tóm tắt nội dung vào `memo/ROLLING_SUMMARY.md` và cập nhật thông tin thế giới vào `memo/STORY_BIBLE.md`.
4. Commit toàn bộ thay đổi lên Git (bao gồm file dịch mới, file cấu hình cập nhật, và file EPUB mới nhất).
