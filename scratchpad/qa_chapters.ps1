param(
    [Parameter(Mandatory=$true)]
    [int]$Start,

    [Parameter(Mandatory=$true)]
    [int]$End,

    [string]$OutCsv = "$PSScriptRoot\qa_output.csv"
)

[System.Text.Encoding]::RegisterProvider([System.Text.CodePagesEncodingProvider]::Instance)

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "chapters_out"
$zhDir = Join-Path $root "chapters_zh"

Write-Host "Running QA check on chapters $Start to $End..." -ForegroundColor Cyan

$results = @()
for ($vi = $Start; $vi -le $End; $vi++) {
    $zh = $vi + 5
    $outFile = Join-Path $outDir ("{0:D4}.md" -f $vi)
    $zhFile = Join-Path $zhDir ("{0:D4}.txt" -f $zh)

    if (-not (Test-Path $outFile)) {
        $results += [PSCustomObject]@{Chuong=$vi; Status="MISSING_OUT"; Zh=$zh; OutPara=0; ZhPara=0; Ratio=0; SpacePct=0; CJK=0; BadBytes=0; Dup=0}
        continue
    }
    if (-not (Test-Path $zhFile)) {
        $results += [PSCustomObject]@{Chuong=$vi; Status="MISSING_ZH"; Zh=$zh; OutPara=0; ZhPara=0; Ratio=0; SpacePct=0; CJK=0; BadBytes=0; Dup=0}
        continue
    }

    $outBytes = (Get-Item $outFile).Length
    $zhBytes = (Get-Item $zhFile).Length
    $ratio = if ($zhBytes -gt 0) { [math]::Round($outBytes / $zhBytes, 2) } else { 0 }

    $outText = Get-Content -Raw -Encoding UTF8 $outFile
    $zhText = Get-Content -Raw -Encoding UTF8 $zhFile

    # CJK check
    $cjkMatches = [regex]::Matches($outText, '[\p{IsCJKUnifiedIdeographs}]')
    $cjkCount = $cjkMatches.Count

    # space %
    $spaceCount = ([regex]::Matches($outText, ' ')).Count
    $totalChars = $outText.Length
    $spacePct = if ($totalChars -gt 0) { [math]::Round(($spaceCount / $totalChars) * 100, 2) } else { 0 }

    # bad control bytes
    $bytes = [System.IO.File]::ReadAllBytes($outFile)
    $badBytes = 0
    foreach ($b in $bytes) {
        if ($b -lt 32 -and $b -ne 9 -and $b -ne 10 -and $b -ne 13) { $badBytes++ }
    }

    # paragraph count (non-empty lines, excluding title line)
    $outLines = $outText -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $outParaCount = if ($outLines.Count -gt 0) { $outLines.Count - 1 } else { 0 }  # minus title line

    $zhLines = $zhText -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $zhParaCount = if ($zhLines.Count -gt 0) { $zhLines.Count - 1 } else { 0 }  # minus header line

    # consecutive duplicate paragraph check (exact match)
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
$results | Export-Csv -Path $OutCsv -NoTypeInformation -Encoding UTF8
Write-Host "---"
Write-Host "QA Results exported to: $OutCsv" -ForegroundColor Green
$failCount = ($results | Where-Object { $_.Status -ne "OK" }).Count
if ($failCount -gt 0) {
    Write-Host "FAIL/WARN count: $failCount" -ForegroundColor Red
} else {
    Write-Host "ALL PASS! No issues found." -ForegroundColor Green
}
