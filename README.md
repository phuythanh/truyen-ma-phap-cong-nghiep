# 📖 HỆ THỐNG DỊCH THUẬT TỰ ĐỘNG BẰNG AI (ANTIGRAVITY CLI)

Dự án này cung cấp một hệ thống dịch thuật tự động khép kín từ tiếng Trung sang tiếng Việt chất lượng cao dành cho các tác phẩm mạng/truyện chữ, sử dụng **Google Antigravity CLI (agy)** kết hợp các mô hình AI tiên tiến (Gemini, Claude). Hệ thống tích hợp sẵn các công cụ dịch thuật, tự động kiểm tra chất lượng (QA) chống lỗi font, lệch đoạn, và tự động đóng gói sách điện tử **EPUB** chuyên nghiệp.

---

## 🛠️ I. CÀI ĐẶT CÁC CÔNG CỤ NỀN TẢNG (DÀNH CHO WINDOWS)

Để chạy hệ thống này, bạn cần cài đặt Git và Antigravity CLI theo các bước đơn giản dưới đây qua PowerShell.

### 1. Cài đặt Git
Git được dùng để quản lý mã nguồn, bản dịch và đồng bộ hóa tiến độ lên GitHub.
1. Mở **PowerShell** (nhấn phím `Windows`, gõ `powershell` và nhấn Enter).
2. Chạy lệnh cài đặt Git nhanh thông qua Windows Package Manager (`winget`):
   ```powershell
   winget install --id Git.Git -e --source winget
   ```
3. Sau khi cài đặt xong, khởi động lại PowerShell và cấu hình thông tin cá nhân của bạn:
   ```powershell
   git config --global user.name "Ten Cua Ban"
   git config --global user.email "email_cua_ban@example.com"
   ```

### 2. Cài đặt Google Antigravity CLI (`agy`)
Antigravity CLI là giao diện dòng lệnh giúp bạn giao tiếp và ra lệnh cho các Agent AI tự động hóa việc dịch thuật.
1. Mở PowerShell dưới quyền **Administrator** (nhấn chuột phải vào PowerShell -> chọn *Run as Administrator*).
2. Chạy script cài đặt chính thức của Google Antigravity:
   ```powershell
   irm https://antigravity.google/install.ps1 | iex
   ```
3. Khởi động lại terminal và gõ lệnh sau để kiểm tra xem công cụ đã hoạt động chưa:
   ```powershell
   agy --version
   ```
4. Ở lần đầu tiên khởi động, chạy lệnh `agy` và làm theo hướng dẫn trên màn hình để xác thực tài khoản Google/Gemini API của bạn.

---

## 📥 II. CLONE DỰ ÁN DỊCH THUẬT

1. Di chuyển tới thư mục làm việc trên máy tính của bạn (Ví dụ: tạo thư mục `C:\work` hoặc `D:\truyen` tùy chọn và truy cập vào đó):
   ```powershell
   cd D:\truyen
   ```
2. Clone repository này về máy của bạn:
   * Nếu dùng HTTPS:
     ```powershell
     git clone https://github.com/phuythanh/truyen-ma-phap-cong-nghiep.git
     ```
   * Nếu dùng SSH (đã cấu hình SSH Key trên GitHub):
     ```powershell
     git clone git@github.com:phuythanh/truyen-ma-phap-cong-nghiep.git
     ```
3. Truy cập vào thư mục dự án vừa tải về:
   ```powershell
   cd truyen-ma-phap-cong-nghiep
   ```

---

## 🚀 III. BẮT ĐẦU DỊCH TRUYỆN MỚI (VÍ DỤ MINH HỌA: "HUYỀN GIÁM TIÊN TỘC")

Để dịch một bộ truyện mới từ nhánh mẫu `template`, hãy làm theo đúng quy trình sau:

### Bước 1: Tạo nhánh Git mới từ Template
1. Chuyển sang nhánh mẫu `template`:
   ```powershell
   git checkout template
   ```
2. Tạo một nhánh mới dành riêng cho bộ truyện của bạn (Ví dụ: `huyen-giam-tien-toc`):
   ```powershell
   git checkout -b huyen-giam-tien-toc
   ```

### Bước 2: Thiết lập cấu hình Truyện trong `memo/PROGRESS.json`
Mở tệp [memo/PROGRESS.json](memo/PROGRESS.json) bằng phần mềm chỉnh sửa văn bản bất kỳ (như Notepad, VS Code) và thay đổi thông tin của truyện mới:
```json
{
  "book_title": "Huyền Giám Tiên Tộc",
  "book_file_prefix": "Huyen Giam Tien Toc",
  "offset_zh_minus_vi": 0,
  "first_new_chapter_vi": 1,
  "last_done_vi": 0,
  "note": "Truyện tiên hiệp gia tộc tu tiên của tác giả Quý Việt Nhân. Bắt đầu dịch từ chương 1.",
  "next_action": "Cho raw tieng Trung vao chapters_zh va bat dau dich"
}
```
*Lưu ý: `offset_zh_minus_vi` là chênh lệch số chương giữa file tiếng Trung và chương tiếng Việt. Nếu khớp 1-1 thì để là `0`.*

### Bước 3: Định hình văn phong dịch trong `memo/STYLE_GUIDE.md`
Mở tệp [memo/STYLE_GUIDE.md](memo/STYLE_GUIDE.md) để cấu hình văn phong cho phù hợp với truyện mới (Ví dụ với truyện tiên hiệp cổ phong):
* **Tên nhân vật/bí tịch:** Dịch âm Hán Việt hoàn toàn (Lục Giang Tiên, Lục Vọng Tông, Lục Trường Hy, thái âm thổ nạp pháp...).
* **Xưng hô đặc trưng:**
  * Con cháu gọi Lục Giang Tiên là: **"Lão tổ"**, xưng **"tôn nhi"** hoặc **"con/cháu"**.
  * Trưởng bối ↔ vãn bối: **"ta - ngươi"** hoặc **"ta - con"**.
  * Phu thê: **"phu quân - thiếp thân"** hoặc **"chàng - thiếp"**.
  * Người ngoài/kẻ thù: **"ta - ngươi"** / **"lão phu"** / **"vãn bối"** tùy địa vị.

### Bước 4: Chuẩn bị file raw tiếng Trung và chia nhỏ chương
Để chuẩn bị raw tiếng Trung, bạn có thể tự tải offline file `.txt` full của truyện:
1. **Tìm nguồn tải raw offline:** Truy cập các trang web chia sẻ ebook TXT miễn phí của Trung Quốc như `ixdzs8.com`, `txt80.com`, `zxcs.me` và tìm kiếm từ khóa `玄鉴仙族` (hoặc tên phụ của truyện là `家族修仙：开局成为镇族法器`). Tải file `.zip` chứa file `.txt` full về máy.
2. **Giải nén:** Giải nén để lấy file raw `.txt` lớn (Ví dụ đặt tên là `huyen_giam_full.txt`).
3. **Copy vào repo:** Đặt file `huyen_giam_full.txt` vào thư mục gốc của repository.
4. **Chạy script chia nhỏ chương tự động:** Chạy lệnh sau trong PowerShell để tự động cắt nhỏ file txt lớn thành các chương đơn lẻ lưu vào thư mục `chapters_zh/` (được đặt tên `0001.txt`, `0002.txt`...):
   ```powershell
   python .\scratchpad\split_chapters.py huyen_giam_full.txt
   ```
   *(Nếu máy của bạn chưa cấu hình python trong PATH, hãy sử dụng đường dẫn đầy đủ của bộ cài Python để chạy).*

### Bước 5: Ra lệnh cho AI thực hiện dịch thuật
Mở **Antigravity CLI** bằng cách gõ `agy` trong thư mục dự án và gửi yêu cầu cực kỳ ngắn gọn:
> **"Dịch cho tao từ chương 1 đến chương 5."**

Hệ thống AI sẽ tự động đọc tệp chỉ dẫn [GEMINI.md](GEMINI.md) và chạy quy trình khép kín:
1. **Dịch thuật:** Gọi các subagent dịch song song 5 chương trên (tiết kiệm token và chi phí).
2. **Đầu ra:** Ghi bản dịch vào `chapters_out/0001.md` đến `0005.md` dạng Markdown chuẩn hóa.
3. **Chạy QA:** Chạy script PowerShell `qa_chapters.ps1` kiểm tra rác ký tự CJK, lỗi Mojibake, và trùng lặp đoạn văn.
4. **Build EPUB:** Tự động tạo file sách điện tử `Huyen Giam Tien Toc - Chuong 1-5.epub` ở thư mục gốc để nạp vào điện thoại đọc ngay.
5. **Cập nhật:** Tự ghi nhận các từ mới vào [GLOSSARY.tsv](memo/GLOSSARY.tsv) và ghi tóm tắt vào [ROLLING_SUMMARY.md](memo/ROLLING_SUMMARY.md).

### Bước 6: Lưu trữ tiến độ lên Git
Sau khi AI chạy xong, bạn chỉ cần gõ các lệnh sau trong PowerShell để lưu trữ tiến độ lên Github:
```powershell
git add -A
git commit -m "Dịch xong chương 1-5 Huyền Giám Tiên Tộc"
git push origin huyen-giam-tien-toc
```

Từ đợt tiếp theo, bạn chỉ việc tải tiếp các chương raw tiếng Trung mới nhất và bỏ vào `chapters_zh`, sau đó vào `agy` ra lệnh: *"Dịch tiếp từ chương 6 đến 15"* là xong!
