# Build full standalone EPUB from chapters_out/NNNN.md (387..792)
# Reuses assets (stylesheet.css, cover.png, cover.xhtml) from existing epub in project root.

$root = "C:\truyen\maphap"
$outDir = Join-Path $root "chapters_out"
$work = Join-Path $root "scratchpad\epub_build"
$first = 387
$last = 833
$title = "Ma Pháp Công Nghiệp Đế Quốc — Chương $first-$last (bản dịch tiếp)"
$outEpub = Join-Path $root "Ma Phap - Chuong $first-$last.epub"

# Nguon asset (cover.png, stylesheet.css, cover.xhtml): lay tu 1 epub "Ma Phap - Chuong *.epub" da build truoc do
# (dung cau truc OEBPS/Images,Styles,Text nhu script nay tao ra). Khong dung epub goc cua user (cau truc khac).
# Khong phu thuoc scratchpad/epub_inspect (thu muc tam, co the khong con o phien sau).
$refEpub = Get-ChildItem -Path $root -Filter "Ma Phap - Chuong *.epub" | Where-Object { $_.FullName -ne $outEpub } | Select-Object -First 1
if (-not $refEpub) { throw "Khong tim thay epub tham chieu 'Ma Phap - Chuong *.epub' nao trong $root de lay asset (cover.png/css)." }

if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force -Path "$work\META-INF" | Out-Null
New-Item -ItemType Directory -Force -Path "$work\OEBPS\Text" | Out-Null
New-Item -ItemType Directory -Force -Path "$work\OEBPS\Images" | Out-Null
New-Item -ItemType Directory -Force -Path "$work\OEBPS\Styles" | Out-Null

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$refZip = [System.IO.Compression.ZipFile]::OpenRead($refEpub.FullName)
foreach ($pair in @(
    @{ entry = "OEBPS/Images/cover.png"; dest = "$work\OEBPS\Images\cover.png" },
    @{ entry = "OEBPS/Styles/stylesheet.css"; dest = "$work\OEBPS\Styles\stylesheet.css" },
    @{ entry = "OEBPS/Text/cover.xhtml"; dest = "$work\OEBPS\Text\cover.xhtml" }
)) {
    $e = $refZip.GetEntry($pair.entry)
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $pair.dest, $true)
}
$refZip.Dispose()

# mimetype (no BOM, no trailing newline)
[System.IO.File]::WriteAllText("$work\mimetype", "application/epub+zip", (New-Object System.Text.UTF8Encoding($false)))

# container.xml
$containerXml = @'
<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
'@
[System.IO.File]::WriteAllText("$work\META-INF\container.xml", $containerXml, (New-Object System.Text.UTF8Encoding($false)))

function Escape-Xml($s) {
    $s = $s -replace '&', '&amp;'
    $s = $s -replace '<', '&lt;'
    $s = $s -replace '>', '&gt;'
    return $s
}

$manifestItems = New-Object System.Collections.Generic.List[string]
$spineItems = New-Object System.Collections.Generic.List[string]
$navPoints = New-Object System.Collections.Generic.List[string]

$idx = 0
$missing = @()
for ($n = $first; $n -le $last; $n++) {
    $idx++
    $mdFile = Join-Path $outDir ("{0:D4}.md" -f $n)
    if (-not (Test-Path $mdFile)) {
        $missing += $n
        continue
    }
    $lines = Get-Content -Encoding UTF8 $mdFile
    $titleLine = $lines[0].Trim()
    $chapTitle = $titleLine
    $bodyLines = $lines[1..($lines.Count - 1)] | Where-Object { $_.Trim() -ne "" }

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("<?xml version=`"1.0`" encoding=`"utf-8`"?>`n")
    [void]$sb.Append("<!DOCTYPE html PUBLIC `"-//W3C//DTD XHTML 1.1//EN`"`n")
    [void]$sb.Append("  `"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd`">`n`n")
    [void]$sb.Append("<html xmlns=`"http://www.w3.org/1999/xhtml`">`n")
    [void]$sb.Append("<head>`n")
    [void]$sb.Append("  <title>$(Escape-Xml $chapTitle)</title>`n")
    [void]$sb.Append("  <link href=`"../Styles/stylesheet.css`" rel=`"stylesheet`" type=`"text/css`"/>`n")
    [void]$sb.Append("  <meta http-equiv=`"Content-Type`" content=`"text/html; charset=utf-8`" />`n")
    [void]$sb.Append("</head>`n")
    [void]$sb.Append("<body>`n")
    [void]$sb.Append("<h1>$(Escape-Xml $chapTitle)</h1>`n")
    [void]$sb.Append("<br/>`n")
    foreach ($p in $bodyLines) {
        [void]$sb.Append("<p>$(Escape-Xml $p.Trim())</p>`n")
    }
    [void]$sb.Append("</body>`n</html>")

    $xhtmlPath = "$work\OEBPS\Text\C$idx.xhtml"
    [System.IO.File]::WriteAllText($xhtmlPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

    $manifestItems.Add("    <item id=`"C$idx`" href=`"Text/C$idx.xhtml`" media-type=`"application/xhtml+xml`"/>")
    $spineItems.Add("    <itemref idref=`"C$idx`"/>")
    $navPoints.Add(@"
    <navPoint id="navPoint-$idx" playOrder="$idx">
      <navLabel>
        <text>$(Escape-Xml $chapTitle)</text>
      </navLabel>
      <content src="Text/C$idx.xhtml"/>
    </navPoint>
"@)
}

if ($missing.Count -gt 0) {
    Write-Host "MISSING chapters: $($missing -join ', ')" -ForegroundColor Red
}
Write-Host "Built $idx chapter files (expected $($last - $first + 1))"

$uuid = [guid]::NewGuid().ToString()

$opf = @"
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>$(Escape-Xml $title)</dc:title>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:$uuid</dc:identifier>
    <dc:creator>Ban dich tiep (Trung-Viet)</dc:creator>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="cover-image" href="Images/cover.png" media-type="image/png"/>
    <item id="css" href="Styles/stylesheet.css" media-type="text/css"/>
    <item id="cover" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>
$($manifestItems -join "`n")
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
$($spineItems -join "`n")
  </spine>
</package>
"@
[System.IO.File]::WriteAllText("$work\OEBPS\content.opf", $opf, (New-Object System.Text.UTF8Encoding($false)))

$ncx = @"
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:$uuid"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>$(Escape-Xml $title)</text></docTitle>
  <navMap>
$($navPoints -join "`n")
  </navMap>
</ncx>
"@
[System.IO.File]::WriteAllText("$work\OEBPS\toc.ncx", $ncx, (New-Object System.Text.UTF8Encoding($false)))

# Zip: mimetype must be first entry, stored (no compression)
if (Test-Path $outEpub) { Remove-Item -Force $outEpub }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($outEpub, [System.IO.Compression.ZipArchiveMode]::Create)

$mimeEntry = $zip.CreateEntry("mimetype", [System.IO.Compression.CompressionLevel]::NoCompression)
$stream = $mimeEntry.Open()
$bytes = [System.Text.Encoding]::ASCII.GetBytes("application/epub+zip")
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()

$filesToAdd = Get-ChildItem -Path $work -Recurse -File | Where-Object { $_.Name -ne "mimetype" }
foreach ($f in $filesToAdd) {
    $relPath = [IO.Path]::GetRelativePath($work, $f.FullName) -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}
$zip.Dispose()

Write-Host "EPUB built: $outEpub"
Write-Host "Size: $((Get-Item $outEpub).Length / 1MB) MB"
