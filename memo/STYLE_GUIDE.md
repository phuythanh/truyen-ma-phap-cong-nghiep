# HƯỚNG DẪN VĂN PHONG DỊCH (STYLE GUIDE TEMPLATE)

*Tài liệu này định hình phong cách dịch thuật cho truyện mới. Khi bắt đầu truyện mới, hãy chỉnh sửa tài liệu này để phù hợp với văn phong của truyện đó. Dưới đây là khung mẫu và các bài học kinh nghiệm.*

---

## 📌 1. VAI TRÒ & GIỌNG VĂN CHUNG
- **Vai trò:** Dịch giả truyện mạng chuyên nghiệp, chuyên dịch Trung → Việt các thể loại (Huyền huyễn, Đô thị, Võ hiệp, Khoa học ma pháp, Công nghiệp, v.v.).
- **Tiêu chuẩn:** Văn phong mượt mà, thuần Việt, trung thành với bản gốc, không dịch word-by-word kiểu Convert thô, nhưng cũng không phóng tác quá đà.
- **Tính nhất quán:** Giữ nguyên cấu trúc câu thoại và văn tả tự nhiên, tránh lạm dụng từ Hán Việt quá nặng nề trong những bối cảnh hiện đại/kinh doanh/kỹ thuật.

---

## 👥 2. ĐẠI TỪ XƯNG HÔ (QUY TẮC MẪU - CẦN CẤU HÌNH CHO TRUYỆN MỚI)
*Hãy điền quy tắc xưng hô cụ thể cho các nhân vật chính ở đây khi dịch truyện mới:*

- **Nhân vật chính (tên):**
  - Xưng hô trong hội thoại: Mặc định xưng **"tôi"** (hoặc **"ta"** tùy bối cảnh cổ đại/hiện đại).
  - Văn kể (ngôi thứ ba) gọi nhân vật chính là: **"anh"** / **"y"** / **"hắn"** (tùy giới tính và tính cách).
- **Quy tắc đại từ chung (Bài học rút ra từ các dự án trước):**
  - **Hạn chế dùng "mày - tao":** Chỉ dùng khi nhân vật thực sự căm phẫn, tức giận tột độ, cãi vã lớn hoặc chửi bới. Bình thường, dù trịch thượng hay tức giận nhẹ, hãy dịch là "ta - ngươi", "tôi", "ông/bà" để giữ văn phong nhã nhặn.
  - **Phân biệt "chúng tôi" vs "chúng ta" (Cực kỳ quan trọng):**
    - **"Chúng tôi" (Chúng tôi/Chúng ta không gồm người nghe):** Nói về nhóm của mình với người ngoài.
    - **"Chúng ta" (Chúng tôi/Chúng ta có gồm người nghe):** Rủ rê, bàn luận chung có bao gồm người đối diện.
    - Chú ý dịch đúng từ `我们` (chúng tôi/chúng ta) và `咱们` (chúng ta).

---

## 🗺️ 3. PHÂN LOẠI TÊN RIÊNG & THUẬT NGỮ (TRANSLATION RULES)
- **Tên nhân vật gốc Trung:** Dùng âm **Hán Việt** (Ví dụ: `许亦` = `Hứa Dịch`).
- **Tên phương Tây / Latin (Nếu có):** Chuyển về dạng **chữ Latin/Tây gốc**, KHÔNG dùng âm Hán Việt (Ví dụ: `邦塔` = `Bontar`, `斯塔克` = `Stark`).
- **Tên mang ý nghĩa đặc trưng (Ví dụ: Tên tộc Elf, địa danh tự nhiên):** Dịch nghĩa sang **tiếng Anh** hoặc **tiếng Việt** tương ứng để tạo cảm giác kỳ ảo tự nhiên (Ví dụ: `影歌` = `Shadowsong`).
- **Thuật ngữ lặp đi lặp lại:** Ghi nhận ngay vào [memo/GLOSSARY.tsv](file:///E:/work/truyen/truyen-ma-phap-cong-nghiep/memo/GLOSSARY.tsv). Tuyệt đối cấm dịch tự phát lệch tên khi từ điển đã có quy ước.

---

## 🔊 4. TỪ TƯỢNG THANH & THÁN TỪ (BÀI HỌC KINH NGHIỆM)
- Việt hóa tự nhiên các thán từ:
  - `啧啧` (Tsk tsk) → dịch thành **"chậc chậc"** (tuyệt đối không để nguyên tiếng Anh "tsk tsk" hay dịch convert "trách trách").
  - `砰` → **"Rầm" / "Đoàng"** (tùy ngữ cảnh).
  - `哦 / 嗯` → **"Ồ / Ừm"**.
  - Không giữ nguyên các từ tượng thanh phiên âm Latin kiểu pinyin hoặc dịch nửa vời.

---

## 📝 5. FORMAT ĐẦU RA (MẶC ĐỊNH)
- **Dòng 1:** `Chương {N}: {Tiêu đề dịch}` (Ví dụ: `Chương 1: Khởi đầu`).
- **Dòng 2:** Để trống.
- **Dòng 3 trở đi:** Nội dung dịch.
- **Đoạn văn:** Mỗi đoạn cách nhau bằng một dòng trống. Khớp 1-1 với số đoạn của chương gốc Trung. Không gộp hoặc tách đoạn tùy tiện để tránh lỗi đếm đoạn khi chạy QA.
- **Không thêm** ghi chú dịch giả, tóm tắt chương, hay các bình luận cá nhân vào trong file dịch.
