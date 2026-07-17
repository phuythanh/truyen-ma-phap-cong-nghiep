[System.Text.Encoding]::RegisterProvider([System.Text.CodePagesEncodingProvider]::Instance)
$outDir = "C:\truyen\maphap\chapters_out"
$zhDir = "C:\truyen\maphap\chapters_zh"

$results = @()
for ($vi = 856; $vi -le 877; $vi++) {
    $zh = $vi + 5
    $outFile = Join-Path $outDir ("{0:D4}.md" -f $vi)
    $zhFile = Join-Path $zhDir ("{0:D4}.txt" -f $zh)

    if (-not (Test-Path $outFile)) {
        $results += [PSCustomObject]@{Chuong=$vi; Status="MISSING_OUT"}
        continue
    }
    if (-not (Test-Path $zhFile)) {
        $results += [PSCustomObject]@{Chuong=$vi; Status="MISSING_ZH"}
        continue
    }

    $outBytes = (Get-Item $outFile).Length
    $zhBytes = (Get-Item $zhFile).Length
    $ratio = [math]::Round($outBytes / $zhBytes, 2)

    $outText = Get-Content -Raw -Encoding UTF8 $outFile
    $zhText = Get-Content -Raw -Encoding UTF8 $zhFile

    $cjkMatches = [regex]::Matches($outText, '[\p{IsCJKUnifiedIdeographs}]')
    $cjkCount = $cjkMatches.Count

    $spaceCount = ([regex]::Matches($outText, ' ')).Count
    $totalChars = $outText.Length
    $spacePct = if ($totalChars -gt 0) { [math]::Round(($spaceCount / $totalChars) * 100, 2) } else { 0 }

    $bytes = [System.IO.File]::ReadAllBytes($outFile)
    $badBytes = 0
    foreach ($b in $bytes) {
        if ($b -lt 32 -and $b -ne 9 -and $b -ne 10 -and $b -ne 13) { $badBytes++ }
    }

    $outLines = $outText -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $outParaCount = $outLines.Count - 1

    $zhLines = $zhText -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $zhParaCount = $zhLines.Count - 1

    $dupCount = 0
    for ($i = 1; $i -lt $outLines.Count - 1; $i++) {
        if ($outLines[$i].Trim() -ne "" -and $outLines[$i].Trim() -eq $outLines[$i+1].Trim()) {
            $dupCount++
        }
    }

    $status = "OK"
    if ($cjkCount -gt 0) { $status = "FAIL_CJK" }
    elseif ($ratio -lt 1.0 -or $ratio -gt 2.0) { $status = "FAIL_RATIO" }
    elseif ($spacePct -lt 9) { $status = "FAIL_SPACE" }
    elseif ($badBytes -gt 0) { $status = "FAIL_BADBYTE" }
    elseif ([math]::Abs($outParaCount - $zhParaCount) -gt 2) { $status = "WARN_PARACOUNT" }
    elseif ($dupCount -gt 0) { $status = "WARN_DUP" }

    $results += [PSCustomObject]@{
        Chuong = $vi
        Zh = $zh
        OutPara = $outParaCount
        ZhPara = $zhParaCount
        Ratio = $ratio
        SpacePct = $spacePct
        CJK = $cjkCount
        BadBytes = $badBytes
        Dup = $dupCount
        Status = $status
    }
}

$results | Format-Table -AutoSize
$results | Export-Csv -Path "C:\truyen\maphap\scratchpad\qa_856_877.csv" -NoTypeInformation -Encoding UTF8
Write-Host "---"
Write-Host "FAIL/WARN count:" ($results | Where-Object { $_.Status -ne "OK" }).Count
