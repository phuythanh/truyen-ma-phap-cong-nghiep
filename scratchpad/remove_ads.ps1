$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "..\chapters_out"
$files = Get-ChildItem -Path $dir -Filter "*.md"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$totalRemoved = 0
$changedFiles = @()

foreach ($f in $files) {
    $lines = [System.IO.File]::ReadAllLines($f.FullName, [System.Text.Encoding]::UTF8)
    $kept = New-Object System.Collections.Generic.List[string]
    $removedHere = 0
    foreach ($line in $lines) {
        $isAd = ($line -match 'trang') -and ($line -match 'đọc|xem') -and ($line -match 'chưa xong|chưa hết|chưa kết thúc')
        if ($isAd) {
            $removedHere++
            continue
        }
        $kept.Add($line)
    }
    if ($removedHere -eq 0) { continue }

    # collapse consecutive blank lines introduced by removal
    $final = New-Object System.Collections.Generic.List[string]
    $prevBlank = $false
    foreach ($line in $kept) {
        $isBlank = ($line.Trim() -eq "")
        if ($isBlank -and $prevBlank) { continue }
        $final.Add($line)
        $prevBlank = $isBlank
    }
    # trim trailing blank lines
    while ($final.Count -gt 0 -and $final[$final.Count - 1].Trim() -eq "") {
        $final.RemoveAt($final.Count - 1)
    }

    $text = [string]::Join("`n", $final) + "`n"
    [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
    $totalRemoved += $removedHere
    $changedFiles += "$($f.Name): removed $removedHere"
}

Write-Output "Total ad lines removed: $totalRemoved"
Write-Output "Files changed: $($changedFiles.Count)"
$changedFiles | ForEach-Object { Write-Output $_ }
