Add-Type -AssemblyName System.IO.Compression

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$epubPath = Join-Path $root "Ma Pháp Công Nghiệp Đế Quốc - Buổi Tối Giờ Cao Điểm.epub"
if (Test-Path $epubPath) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($epubPath)
    Write-Host "Total entries: $($zip.Entries.Count)"
    Write-Host "First 50 entries:"
    $entries = $zip.Entries
    for ($i = 0; $i -lt $entries.Count -and $i -lt 50; $i++) {
        Write-Host $entries[$i].FullName
    }
    $zip.Dispose()
} else {
    Write-Host "Epub file not found"
}
