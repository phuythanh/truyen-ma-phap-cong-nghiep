$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$paths = @("C:\truyen\maphap\chapters_out\1702_and_1703_temp.md", "C:\truyen\maphap\chapters_out\1704_and_1705_temp.md")

foreach ($path in $paths) {
    $content = [System.IO.File]::ReadAllText($path, $utf8NoBom)
    $parts = $content -split '(?=Ch.ng 170\d:)'
    foreach ($part in $parts) {
        if ($part -match 'Ch.ng (170\d):') {
            $chapterNum = $matches[1]
            $outPath = "C:\truyen\maphap\chapters_out\$chapterNum.md"
            [System.IO.File]::WriteAllText($outPath, $part.Trim() + "`r`n", $utf8NoBom)
            Write-Host "Written $outPath"
        }
    }
}
