#!/usr/bin/env python3
"""Build full standalone EPUB from chapters_out/NNNN.md (Linux/bash-safe port of build_epub_full.ps1).

Usage: python3 scratchpad/build_epub_full.py [first] [last]
  first defaults to 387
  last defaults to memo/PROGRESS.json's last_done_vi
"""
import glob
import json
import os
import re
import sys
import uuid
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "chapters_out")
WORK = os.path.join(ROOT, "scratchpad", "epub_build")


def escape_xml(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main():
    with open(os.path.join(ROOT, "memo", "PROGRESS.json"), encoding="utf-8") as f:
        prog = json.load(f)
        first = prog.get("first_new_chapter_vi", 387)
        last = prog.get("last_done_vi", 1015)
        book_title = prog.get("book_title", "Ma Phap Cong Nghiep De Quoc")
        file_prefix = prog.get("book_file_prefix", "Ma Phap")

    if len(sys.argv) > 1:
        first = int(sys.argv[1])
    if len(sys.argv) > 2:
        last = int(sys.argv[2])

    title = f"{book_title} - Chuong {first}-{last}"
    out_epub = os.path.join(ROOT, f"{file_prefix} - Chuong {first}-{last}.epub")

    asset_dir = os.path.join(ROOT, "scratchpad", "epub_assets")
    if not os.path.exists(asset_dir):
        sys.exit(f"Khong tim thay thu muc epub_assets tai: {asset_dir}")

    if os.path.exists(WORK):
        import shutil
        shutil.rmtree(WORK)
    os.makedirs(os.path.join(WORK, "META-INF"), exist_ok=True)
    os.makedirs(os.path.join(WORK, "OEBPS", "Text"), exist_ok=True)
    os.makedirs(os.path.join(WORK, "OEBPS", "Images"), exist_ok=True)
    os.makedirs(os.path.join(WORK, "OEBPS", "Styles"), exist_ok=True)

    import shutil
    shutil.copy(os.path.join(asset_dir, "OEBPS", "Images", "cover.png"), os.path.join(WORK, "OEBPS", "Images", "cover.png"))
    shutil.copy(os.path.join(asset_dir, "OEBPS", "Styles", "stylesheet.css"), os.path.join(WORK, "OEBPS", "Styles", "stylesheet.css"))
    shutil.copy(os.path.join(asset_dir, "OEBPS", "Text", "cover.xhtml"), os.path.join(WORK, "OEBPS", "Text", "cover.xhtml"))

    with open(os.path.join(WORK, "mimetype"), "w", encoding="utf-8", newline="") as f:
        f.write("application/epub+zip")

    container_xml = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""
    with open(os.path.join(WORK, "META-INF", "container.xml"), "w", encoding="utf-8") as f:
        f.write(container_xml)

    manifest_items = []
    spine_items = []
    nav_points = []
    missing = []
    idx = 0

    for n in range(first, last + 1):
        idx += 1
        md_path = os.path.join(OUT_DIR, f"{n:04d}.md")
        if not os.path.exists(md_path):
            missing.append(n)
            continue
        with open(md_path, encoding="utf-8") as f:
            lines = [l.rstrip("\n") for l in f]
        chap_title = lines[0].strip()
        body_lines = [l.strip() for l in lines[1:] if l.strip() != ""]

        parts = [
            '<?xml version="1.0" encoding="utf-8"?>\n',
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"\n',
            '  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n\n',
            '<html xmlns="http://www.w3.org/1999/xhtml">\n<head>\n',
            f"  <title>{escape_xml(chap_title)}</title>\n",
            '  <link href="../Styles/stylesheet.css" rel="stylesheet" type="text/css"/>\n',
            '  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n',
            "</head>\n<body>\n",
            f"<h1>{escape_xml(chap_title)}</h1>\n<br/>\n",
        ]
        for p in body_lines:
            parts.append(f"<p>{escape_xml(p)}</p>\n")
        parts.append("</body>\n</html>")

        xhtml_path = os.path.join(WORK, "OEBPS", "Text", f"C{idx}.xhtml")
        with open(xhtml_path, "w", encoding="utf-8") as f:
            f.write("".join(parts))

        manifest_items.append(f'    <item id="C{idx}" href="Text/C{idx}.xhtml" media-type="application/xhtml+xml"/>')
        spine_items.append(f'    <itemref idref="C{idx}"/>')
        nav_points.append(f"""    <navPoint id="navPoint-{idx}" playOrder="{idx}">
      <navLabel>
        <text>{escape_xml(chap_title)}</text>
      </navLabel>
      <content src="Text/C{idx}.xhtml"/>
    </navPoint>""")

    if missing:
        print(f"MISSING chapters: {', '.join(map(str, missing))}")
    print(f"Built {idx - len(missing)} chapter files (expected {last - first + 1})")

    book_uuid = str(uuid.uuid4())

    opf = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>{escape_xml(title)}</dc:title>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:{book_uuid}</dc:identifier>
    <dc:creator>Ban dich tiep (Trung-Viet)</dc:creator>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="cover-image" href="Images/cover.png" media-type="image/png"/>
    <item id="css" href="Styles/stylesheet.css" media-type="text/css"/>
    <item id="cover" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>
{chr(10).join(manifest_items)}
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
{chr(10).join(spine_items)}
  </spine>
</package>
"""
    with open(os.path.join(WORK, "OEBPS", "content.opf"), "w", encoding="utf-8") as f:
        f.write(opf)

    ncx = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:{book_uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>{escape_xml(title)}</text></docTitle>
  <navMap>
{chr(10).join(nav_points)}
  </navMap>
</ncx>
"""
    with open(os.path.join(WORK, "OEBPS", "toc.ncx"), "w", encoding="utf-8") as f:
        f.write(ncx)

    if os.path.exists(out_epub):
        os.remove(out_epub)

    with zipfile.ZipFile(out_epub, "w") as zf:
        zf.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        for dirpath, _, filenames in os.walk(WORK):
            for fname in filenames:
                if fname == "mimetype":
                    continue
                full = os.path.join(dirpath, fname)
                rel = os.path.relpath(full, WORK).replace(os.sep, "/")
                zf.write(full, rel, compress_type=zipfile.ZIP_DEFLATED)

    # Don't let stale EPUB snapshots pile up in the repo.
    for stale in glob.glob(os.path.join(ROOT, f"{file_prefix} - Chuong *.epub")):
        if os.path.abspath(stale) != os.path.abspath(out_epub):
            os.remove(stale)

    size_mb = os.path.getsize(out_epub) / (1024 * 1024)
    print(f"EPUB built: {out_epub}")
    print(f"Size: {size_mb:.2f} MB")


if __name__ == "__main__":
    main()
