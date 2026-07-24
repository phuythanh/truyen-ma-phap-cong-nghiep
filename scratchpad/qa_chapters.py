#!/usr/bin/env python3
"""Cross-platform port of qa_chapters.ps1 (for Linux/cloud agents without PowerShell).
Checks: missing files, CJK leftover, mojibake, length ratio, space %, bad control bytes,
paragraph count mismatch, consecutive duplicate paragraphs.

Usage: python qa_chapters.py --start 1683 --end 1707 [--out-csv scratchpad/qa_output.csv]
Exit code: 0 if all OK, 1 if any FAIL_*/WARN_* found.
"""
import argparse
import csv
import json
import os
import re
import sys

CJK_RE = re.compile(r'[一-鿿]')
SPACE_RE = re.compile(r' ')

MOJIBAKE_PATTERNS = [
    bytes([0xC3, 0x86, 0xC2, 0xB0]).decode('utf-8'),  # "Æ°"
    bytes([0xC3, 0x86, 0xC2, 0xA1]).decode('utf-8'),  # "Æ¡"
    bytes([0xC3, 0xA1, 0xC2, 0xBA]).decode('utf-8'),  # "áº"
    bytes([0xC3, 0xA1, 0xC2, 0xBB]).decode('utf-8'),  # "á»"
    bytes([0xC3, 0x83, 0xC2, 0xB9]).decode('utf-8'),  # "Ã¹"
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', type=int, required=True)
    ap.add_argument('--end', type=int, required=True)
    ap.add_argument('--out-csv', default=None)
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'chapters_out')
    zh_dir = os.path.join(root, 'chapters_zh')
    progress_file = os.path.join(root, 'memo', 'PROGRESS.json')
    out_csv = args.out_csv or os.path.join(root, 'scratchpad', 'qa_output.csv')

    offset = 0
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        offset = progress.get('offset_zh_minus_vi', 0) or 0

    results = []
    for vi in range(args.start, args.end + 1):
        zh = vi + offset
        out_file = os.path.join(out_dir, f'{vi:04d}.md')
        zh_file = os.path.join(zh_dir, f'{zh:04d}.txt')

        row = {'Chuong': vi, 'Zh': zh, 'OutPara': 0, 'ZhPara': 0, 'Ratio': 0,
               'SpacePct': 0, 'CJK': 0, 'BadBytes': 0, 'Dup': 0, 'Status': 'OK'}

        if not os.path.exists(out_file):
            row['Status'] = 'MISSING_OUT'
            results.append(row)
            continue
        if not os.path.exists(zh_file):
            row['Status'] = 'MISSING_ZH'
            results.append(row)
            continue

        out_bytes_len = os.path.getsize(out_file)
        zh_bytes_len = os.path.getsize(zh_file)
        ratio = round(out_bytes_len / zh_bytes_len, 2) if zh_bytes_len > 0 else 0

        with open(out_file, 'r', encoding='utf-8') as f:
            out_text = f.read()
        with open(zh_file, 'r', encoding='utf-8') as f:
            zh_text = f.read()

        cjk_count = len(CJK_RE.findall(out_text))

        space_count = len(SPACE_RE.findall(out_text))
        total_chars = len(out_text)
        space_pct = round((space_count / total_chars) * 100, 2) if total_chars > 0 else 0

        with open(out_file, 'rb') as f:
            raw_bytes = f.read()
        bad_bytes = sum(1 for b in raw_bytes if b < 32 and b not in (9, 10, 13))

        out_lines = [l for l in re.split(r'\r?\n', out_text) if l.strip() != '']
        out_para_count = len(out_lines) - 1 if out_lines else 0

        zh_lines = [l for l in re.split(r'\r?\n', zh_text) if l.strip() != '']
        zh_para_count = len(zh_lines) - 1 if zh_lines else 0

        dup_count = 0
        for i in range(1, len(out_lines) - 1):
            if out_lines[i].strip() != '' and out_lines[i].strip() == out_lines[i + 1].strip():
                dup_count += 1

        has_mojibake = any(pat in out_text for pat in MOJIBAKE_PATTERNS)

        status = 'OK'
        if cjk_count > 0:
            status = 'FAIL_CJK'
        elif has_mojibake:
            status = 'FAIL_MOJIBAKE'
        elif ratio < 1.0 or ratio > 2.0:
            status = 'FAIL_RATIO'
        elif space_pct < 9:
            status = 'FAIL_SPACE'
        elif bad_bytes > 0:
            status = 'FAIL_BADBYTE'
        elif abs(out_para_count - zh_para_count) > 2:
            status = 'WARN_PARACOUNT'
        elif dup_count > 0:
            status = 'WARN_DUP'

        row.update({'OutPara': out_para_count, 'ZhPara': zh_para_count, 'Ratio': ratio,
                    'SpacePct': space_pct, 'CJK': cjk_count, 'BadBytes': bad_bytes,
                    'Dup': dup_count, 'Status': status})
        results.append(row)

    fieldnames = ['Chuong', 'Zh', 'OutPara', 'ZhPara', 'Ratio', 'SpacePct', 'CJK', 'BadBytes', 'Dup', 'Status']
    with open(out_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            writer.writerow(row)

    print(f"{'Chuong':<7}{'Zh':<7}{'OutPara':<9}{'ZhPara':<8}{'Ratio':<7}{'SpacePct':<10}{'CJK':<5}{'BadBytes':<9}{'Dup':<5}{'Status'}")
    for row in results:
        print(f"{row['Chuong']:<7}{row['Zh']:<7}{row['OutPara']:<9}{row['ZhPara']:<8}{row['Ratio']:<7}{row['SpacePct']:<10}{row['CJK']:<5}{row['BadBytes']:<9}{row['Dup']:<5}{row['Status']}")

    print('---')
    print(f'QA Results exported to: {out_csv}')
    fail_count = sum(1 for r in results if r['Status'] != 'OK')
    if fail_count > 0:
        print(f'FAIL/WARN count: {fail_count}')
        sys.exit(1)
    else:
        print('ALL PASS! No issues found.')
        sys.exit(0)


if __name__ == '__main__':
    main()
