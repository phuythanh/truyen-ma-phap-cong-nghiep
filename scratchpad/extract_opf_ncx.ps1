Add-Type -AssemblyName System.IO.Compression

$epubPath = "C:\truyen\maphap\Ma Pháp Công Nghiệp Đế Quốc - Buổi Tối Giờ Cao Điểm.epub"
$work = "C:\truyen\maphap\scratchpad\epub_inspect"

if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force -Path $work | Out-Null

$zip = [System.IO.Compression.ZipFile]::OpenRead($epubPath)
$opfEntry = $zip.GetEntry("OEBPS/content.opf")
$ncxEntry = $zip.GetEntry("OEBPS/toc.ncx")

if ($opfEntry) {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($opfEntry, "$work\content.opf", $true)
    Write-Host "Extracted content.opf"
} else {
    Write-Host "content.opf not found"
}

if ($ncxEntry) {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($ncxEntry, "$work\toc.ncx", $true)
    Write-Host "Extracted toc.ncx"
} else {
    Write-Host "toc.ncx not found"
}

$zip.Dispose()
