param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [string]$OutputDir = "$PSScriptRoot\..\chapters_zh",

    [int]$StartIndex = 1
)

if (-not (Test-Path $InputFile)) {
    Write-Host "Lỗi: Không tìm thấy file nguồn $InputFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

Write-Host "Đang đọc file $InputFile..." -ForegroundColor Cyan

# Thử đọc file bằng UTF-8, nếu lỗi thì chuyển sang GBK (CP936)
$text = $null
$encodings = @("utf8", "default")
foreach ($enc in $encodings) {
    try {
        $text = Get-Content -Raw -Encoding $enc $InputFile -ErrorAction Stop
        Write-Host "Đọc file thành công với mã hóa: $enc" -ForegroundColor Green
        break
    } catch {
        continue
    }
}

if ($text -eq $null) {
    Write-Host "Lỗi: Không thể đọc file với các bảng mã thông dụng." -ForegroundColor Red
    exit 1
}

# Regex tìm kiếm tiêu đề chương tiếng Trung
# Ví dụ: "第一章 镜子" hoặc "第1章 镜子"
$pattern = "(?m)^(第\s*[0-9一二三四五六七八九十百千万零百十]+\s*[章节].*?)$"
$matches = [regex]::Matches($text, $pattern)

if ($matches.Count -eq 0) {
    Write-Host "Lỗi: Không tìm thấy tiêu đề chương nào bằng Regex." -ForegroundColor Red
    exit 1
}

Write-Host "Tìm thấy tổng cộng $($matches.Count) chương." -ForegroundColor Green

$idx = $StartIndex
for ($i = 0; $i -lt $matches.Count; $i++) {
    $title = $matches[$i].Value.Trim()
    $startPos = $matches[$i].Index + $matches[$i].Length
    
    $endPos = if ($i -lt $matches.Count - 1) {
        $matches[$i+1].Index
    } else {
        $text.Length
    }
    
    $body = $text.Substring($startPos, $endPos - $startPos).Trim()
    
    # Làm sạch nội dung (loại bỏ dòng trống thừa)
    $lines = $body -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $cleanBody = $lines -join "`n`n"
    
    $outFile = Join-Path $OutputDir ("{0:D4}.txt" -f $idx)
    
    # Ghi file dạng UTF-8 không có BOM để tránh lỗi font khi AI đọc
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $contentToWrite = "$title`n`n$cleanBody"
    [System.IO.File]::WriteAllText($outFile, $contentToWrite, $utf8NoBom)
    
    Write-Host "Đã xuất: $(Split-Path $outFile -Leaf) -> $title" -ForegroundColor Gray
    $idx++
}

Write-Host "---"
Write-Host "Hoàn thành! Đã xuất $($idx - $StartIndex) chương vào thư mục: $OutputDir" -ForegroundColor Green
