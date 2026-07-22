# GEMINI WORKFLOW — Ma Pháp Công Nghiệp Đế Quốc (魔法工业帝国)

Tài liệu này hướng dẫn Gemini CLI (và các LLM khác như Claude) cách phối hợp, tiếp tục dịch tiếp bộ truyện **Ma Pháp Công Nghiệp Đế Quốc** từ tiếng Trung sang tiếng Việt một cách thống nhất và không bị lệch nhịp.

---

## 📌 THÔNG TIN HỆ THỐNG & ĐƯỜNG DẪN

- **Thư mục nguồn chứa chương tiếng Trung:** Thư mục `chapters_zh` ở thư mục gốc của project (ví dụ: `.\chapters_zh\`)
  - Tên file: `{zh_number:D4}.txt` (ví dụ: `1021.txt` tương ứng với chương dịch 1016)
- **Thư mục lưu chương tiếng Việt đã dịch:** Thư mục `chapters_out` ở thư mục gốc của project (ví dụ: `.\chapters_out\`)
  - Tên file: `{vi_number:D4}.md` (ví dụ: `1016.md`)
- **Quy luật ánh xạ (Mapping Offset = 5):**
  - `Chương dịch N (Vietnamese)` tương ứng với `File nguồn N + 5 (Chinese)`
  - Công thức: **`Vi_Chapter = Zh_Chapter - 5`** hoặc **`Zh_Chapter = Vi_Chapter + 5`**
  - Ví dụ: Để dịch **Chương 1016**, đọc file nguồn `chapters_zh\1021.txt` và ghi ra `chapters_out\1016.md`.

---

## 📖 BỘ TÀI LIỆU CỐ ĐỊNH (NGUỒN CHÂN LÝ)

Trước khi thực hiện bất kỳ hoạt động dịch thuật hay bổ sung thông tin nào, hãy đọc kỹ các file cấu hình tại thư mục `memo\` (nằm ở thư mục gốc của project):

1. **`memo\PROGRESS.json`**: Lưu trạng thái tiến độ hiện tại (`last_done_vi`).
   - *Trạng thái hiện tại:* Đã hoàn thành dịch đến Chương **1116** (file nguồn `1121.txt`). Chương dịch tiếp theo là **1117** (file nguồn `1122.txt`).
2. **`memo\STYLE_GUIDE.md`**: Quy tắc văn phong, xưng hô, giọng điệu đặc trưng của bản dịch gốc.
   - Nhân vật chính (Hứa Dịch) xưng **"tôi"**, văn kể gọi là **"anh"**.
   - Tên nhân vật gốc Trung dùng âm **Hán Việt** (许亦 = Hứa Dịch).
   - Tên nhân vật/địa danh Tây dùng tên **Latin/Tây** (Stark, Bontar, Senkohel).
   - Tên thị tộc Elf dịch nghĩa sang **tiếng Anh** (Shadow Moon, Night Song).
3. **`memo\GLOSSARY.tsv`**: Từ điển tra cứu tên riêng và thuật ngữ để đảm bảo tính nhất quán (Mọi LLM cần tuân thủ triệt để).
4. **`memo\ROLLING_SUMMARY.md`**: Tóm tắt ngữ cảnh 10 chương gần nhất để tránh mất mạch truyện.
5. **`memo\STORY_BIBLE.md`**: Bách khoa toàn thư tóm tắt toàn bộ nhân vật, thế lực, cốt truyện và các mạch truyện đang mở.

---

## ⚠️ NGUYÊN TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI)

Để ngăn ngừa triệt để các lỗi nghiêm trọng về **sai lệch nhân vật/địa danh** và **lỗi mã hóa font chữ (Mojibake)**, tất cả các tác vụ dịch thuật và xử lý file phải tuân thủ nghiêm ngặt các nguyên tắc sau:

### 1. Đồng bộ và thống nhất Nhân vật/Địa danh (Không dịch lệch tên)
* **Tra cứu từ điển trước:** Trước khi tiến hành dịch bất kỳ chương nào, bắt buộc phải đọc và tra cứu các tên riêng (nhân vật, địa danh, quốc gia, tổ chức) trong file [memo/GLOSSARY.tsv](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/GLOSSARY.tsv) và [memo/STORY_BIBLE.md](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/STORY_BIBLE.md).
* **Cấm phiên âm tự phát:** Tuyệt đối không tự ý phiên âm bừa bãi khi từ điển đã có quy ước (ví dụ: `斯坦丁公国` phải dịch nhất quán là `Công quốc Stan` theo glossary, không được tự ý dịch thành `Công quốc Stading/Staging/Standing`).
* **Bổ sung từ điển kịp thời:** Khi có nhân vật hoặc thuật ngữ mới xuất hiện trong chương nguồn tiếng Trung:
  * Xác định dịch nghĩa (ví dụ: tên Tây dịch sang Latin như *Stark, Bontar*; tên gốc Trung dịch âm Hán Việt như *Hứa Dịch*).
  * **Phải ghi nhận ngay** từ mới này vào file [memo/GLOSSARY.tsv](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/GLOSSARY.tsv) kèm phân loại và ghi chú.

### 2. Đảm bảo Encoding và phòng ngừa lỗi font (Tuyệt đối không bị Mojibake)
* **Thiết lập UTF-8 mặc định:** Mọi thao tác đọc, viết hoặc ghi đè file trong project phải chỉ định rõ encoding **UTF-8** (không dùng bảng mã mặc định của Windows là ANSI/Windows-1252/CP1258).
* **Cảnh giác khi chạy script tự động (PowerShell/Python):**
  * Trong **PowerShell (5.1 mặc định)**: Tránh dùng pipe (`|`) hoặc redirect (`>`) trực tiếp từ stdout của các lệnh console (như `git show`) mà không thiết lập encoding, vì PowerShell sẽ tự động giải mã thành rác ký tự ANSI. Luôn dùng các phương thức của hệ thống như `[System.IO.File]::WriteAllLines()` hoặc chỉ định tham số `-Encoding UTF8` rõ ràng.
  * Trong **Python**: Luôn mở file với tham số `encoding='utf-8'` (ví dụ: `open(file, 'r', encoding='utf-8')`).
  * Trong **Node.js**: Luôn chỉ định `'utf8'` khi đọc ghi (ví dụ: `fs.writeFileSync(path, content, 'utf8')`).
* **Bắt buộc chạy QA:** Sau khi dịch xong bất kỳ cụm chương nào, bắt buộc phải chạy script kiểm tra chất lượng [scratchpad/qa_chapters.ps1](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/scratchpad/qa_chapters.ps1). Nếu kết quả trả về có lỗi `FAIL_MOJIBAKE` hoặc `FAIL_CJK`, phải lập tức mở file dịch ra sửa lại và build lại EPUB.

---

## 🛠️ PIPELINE DỊCH BẰNG GEMINI CLI (CHI TIẾT)

Khi nhận lệnh dịch tiếp, Gemini CLI sẽ hoạt động theo chu trình **Research -> Strategy -> Execution (Plan -> Act -> Validate)**.

### Bước 1: Chuẩn bị Ngữ cảnh
Đọc các file sau để nạp bộ nhớ đệm hoặc tham chiếu trực tiếp:
- `memo\STYLE_GUIDE.md`
- `memo\GLOSSARY.tsv` (Sử dụng các công cụ tìm kiếm hoặc grep để tra cứu nhanh khi gặp từ mới)
- `memo\ROLLING_SUMMARY.md`
- File nguồn `chapters_zh\{Zh_Chapter:D4}.txt` (với `Zh_Chapter = Vi_Chapter + 5`)

### Bước 2: Dịch thuật (Gợi ý sử dụng subagent để tiết kiệm token)
Để giữ context của phiên chính sạch và tiết kiệm token, hãy sử dụng subagent `self` hoặc `research` để dịch theo cụm/batch (ví dụ 5 chương liên tục):
```json
// Mẫu gọi subagent qua tool invoke_subagent:
invoke_subagent(
    Subagents=[{
        "TypeName": "self",
        "Role": "Translator",
        "Prompt": "Dịch tiếp 5 chương từ Chương 1039 đến 1043. Đọc file nguồn tương ứng chapters_zh/1044.txt đến 1048.txt. Tuân thủ tuyệt đối memo/STYLE_GUIDE.md và memo/GLOSSARY.tsv..."
    }]
)
```

**Định dạng file đầu ra (`chapters_out\{Vi_Chapter:D4}.md`):**
- Dòng 1: `Chương {Vi_Chapter}: {Tiêu đề dịch}`
- Dòng 2: Trống
- Dòng 3 trở đi: Nội dung dịch (mỗi đoạn văn bản tương ứng một dòng, phân tách bằng 1 dòng trống. **Tuyệt đối khớp 1-1 với các đoạn của chương gốc Trung**).

### Bước 3: Kiểm tra chất lượng (Quality Assurance)
Sau khi dịch xong, hãy chạy script QA tự động bằng PowerShell để kiểm tra xem file dịch có đạt chuẩn không (không lỗi CJK, khớp đoạn, tỉ lệ từ phù hợp, không lặp đoạn):

**Lệnh chạy QA bằng PowerShell (Gemini CLI):**
```powershell
# Chạy QA cho range chương vừa dịch (ví dụ từ 1039 đến 1043)
powershell.exe -NoProfile -Command ".\scratchpad\qa_chapters.ps1 -Start 1039 -End 1043"
```

Nếu phát hiện bất kỳ lỗi nào (như `FAIL_CJK`, `WARN_PARACOUNT`, `WARN_DUP`), hãy tiến hành sửa chữa trực tiếp hoặc yêu cầu dịch lại chương lỗi đó.

### Bước 4: Cập nhật Tiến độ & Từ điển
- Cập nhật file `memo\PROGRESS.json` (tăng `last_done_vi` lên chương mới nhất vừa dịch xong).
- Nếu phát hiện các tên riêng mới xuất hiện, hãy bổ dung vào `memo\GLOSSARY.tsv` kèm phân loại và ghi chú rõ ràng.
- Cập nhật tóm tắt chương vào `memo\ROLLING_SUMMARY.md` sau mỗi cụm dịch (~10 chương).
- Commit toàn bộ các thay đổi vào Git, bao gồm: các file dịch mới trong `chapters_out/`, file PROGRESS.json, GLOSSARY.tsv, ROLLING_SUMMARY.md, file EPUB mới, các file cấu trúc EPUB (`scratchpad/epub_build/OEBPS/content.opf`, `scratchpad/epub_build/OEBPS/toc.ncx`) và file kết quả QA (`scratchpad/qa_output.csv`).

---

## 📦 HƯỚNG DẪN DỰNG SÁCH EPUB

Để xuất bản bản dịch mới nhất ra định dạng EPUB nhằm mục đích đọc cá nhân, hãy thực hiện các bước sau:

1. Mở file script `.\scratchpad\build_epub_full.ps1` (hoặc chạy trực tiếp script Python `.\scratchpad\build_epub_full.py`).
2. Script PowerShell đã được cấu hình tự động lấy giá trị `$last` từ `memo\PROGRESS.json`. Bạn chỉ cần chạy script để đóng gói toàn bộ bản dịch từ chương 387 đến chương mới nhất:
   ```powershell
   powershell.exe -NoProfile -Command ".\scratchpad\build_epub_full.ps1"
   ```
3. Hoặc chạy bằng Python:
   ```bash
   python .\scratchpad\build_epub_full.py
   ```
4. File đầu ra sẽ nằm tại thư mục gốc của project: `Ma Phap - Chuong 387-{last}.epub`.
   - *Lưu ý quan trọng:* Script sẽ tự động xóa sạch toàn bộ các file `.epub` xuất cũ ở thư mục gốc, chỉ duy trì 1 file epub mới nhất để tránh lộn xộn trong repository.

---

## 🔄 PHỐI HỢP LIÊN THÔNG GIỮA CLAUDE VÀ GEMINI CLI

Cả Claude và Gemini CLI đều chia sẻ chung một cơ sở hạ tầng tệp tin và các kịch bản PowerShell tự động trong thư mục làm việc này. Bạn có thể chuyển đổi qua lại bất kỳ lúc nào:
- **Tiến trình đồng bộ tuyệt đối** thông qua `memo\PROGRESS.json` và thư mục `chapters_out\`.
- **Dữ liệu từ điển đồng bộ** qua `memo\GLOSSARY.tsv`.
- Khi bắt đầu một phiên mới ở bất kỳ mô hình nào, chỉ cần yêu cầu LLM đọc file `PROGRESS.json` và `GEMINI.md` để tự động khôi phục ngữ cảnh dịch thuật hoàn chỉnh.
