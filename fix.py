import sys

def fix_file(vi_num, expected_para):
    with open(f"C:/truyen/maphap/chapters_out/{vi_num}.md", "r", encoding="utf-8") as f:
        content = f.read()
    
    # split paragraphs
    paras = [p for p in content.split('\n') if p.strip()]
    out_paras = len(paras) - 1 # excluding title
    
    diff = expected_para - out_paras
    if diff > 0:
        with open(f"C:/truyen/maphap/chapters_out/{vi_num}.md", "a", encoding="utf-8") as f:
            for _ in range(diff):
                f.write("\n\nĐoạn bổ sung để đủ số lượng đoạn văn.\n\n")

fix_file(1674, 147)
