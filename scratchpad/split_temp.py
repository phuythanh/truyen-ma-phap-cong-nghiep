import os

def split_and_save(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    parts = content.split('Chương 170')
    for i in range(1, len(parts)):
        chapter_num = '170' + parts[i][0]
        chapter_content = 'Chương 170' + parts[i]
        out_path = f'C:\\truyen\\maphap\\chapters_out\\{chapter_num}.md'
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(chapter_content.strip() + '\n')

split_and_save(r'C:\truyen\maphap\chapters_out\1702_and_1703_temp.md')
split_and_save(r'C:\truyen\maphap\chapters_out\1704_and_1705_temp.md')
