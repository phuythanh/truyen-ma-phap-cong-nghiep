#!/usr/bin/env python3
import os
import re
import sys

def split_raw_txt(input_file, output_dir="chapters_zh", start_index=1):
    """Cắt file TXT lớn chứa toàn bộ truyện thành các file chương đơn lẻ.
    
    Tìm các dòng bắt đầu bằng '第X章' hoặc '第X节' để làm mốc chia chương.
    """
    if not os.path.exists(input_file):
        print(f"Lỗi: Không tìm thấy file nguồn {input_file}")
        return

    os.makedirs(output_dir, exist_ok=True)
    
    # Đọc file với encoding utf-8 (nếu lỗi thử gbk/gb18030)
    encodings = ['utf-8', 'gb18030', 'gbk', 'utf-16']
    content = None
    for enc in encodings:
        try:
            with open(input_file, 'r', encoding=enc) as f:
                content = f.read()
            print(f"Đọc file thành công với encoding: {enc}")
            break
        except UnicodeDecodeError:
            continue

    if content is None:
        print("Lỗi: Không thể giải mã file nguồn bằng các encoding thông dụng.")
        return

    # Regex nhận diện tiêu đề chương: dòng bắt đầu bằng '第' và kết thúc bằng '章' hoặc '节' hoặc tương tự
    # Ví dụ: "第一章 镜子" hoặc "第1章 镜子"
    pattern = re.compile(r'(^|\n)(第\s*[0-9一二三四五六七八九十百千万零百十]+\s*[章节].*?)(?=\n|$)')
    
    parts = pattern.split(content)
    
    chapters = []
    current_title = "Khởi đầu"
    current_body = []
    
    i = 0
    while i < len(parts):
        part = parts[i]
        if part is None:
            i += 1
            continue
        
        if (part == '\n' or part == '') and i + 1 < len(parts) and parts[i+1].startswith('第'):
            if current_body:
                chapters.append((current_title, "\n".join(current_body).strip()))
                current_body = []
            current_title = parts[i+1].strip()
            i += 2
        else:
            current_body.append(part)
            i += 1
            
    if current_body:
        chapters.append((current_title, "\n".join(current_body).strip()))

    print(f"Tìm thấy tổng cộng {len(chapters)} chương.")
    
    idx = start_index
    for title, body in chapters:
        lines = [line.strip() for line in body.split('\n')]
        lines = [line for line in lines if line != ""]
        
        out_filename = os.path.join(output_dir, f"{idx:04d}.txt")
        
        with open(out_filename, 'w', encoding='utf-8', newline='\n') as out_f:
            out_f.write(title + "\n\n")
            out_f.write("\n\n".join(lines))
            
        print(f"Đã xuất: {out_filename} -> {title}")
        idx += 1

    print(f"Hoàn thành! Đã xuất {idx - start_index} file chương vào thư mục '{output_dir}'.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python scratchpad/split_chapters.py <path_to_big_txt_file> [start_index]")
        sys.exit(1)
        
    input_txt = sys.argv[1]
    start_idx = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    
    split_raw_txt(input_txt, start_index=start_idx)
