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

$offset = 0
$progressFile = Join-Path $root "memo\PROGRESS.json"
if (Test-Path $progressFile) {
    $progress = Get-Content -Raw -Encoding UTF8 $progressFile | ConvertFrom-Json
    if ($progress.offset_zh_minus_vi -ne $null) {
        $offset = $progress.offset_zh_minus_vi
    }
}

$results = @()
for ($vi = $Start; $vi -le $End; $vi++) {
    $zh = $vi + $offset
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

    # Filter out ZH ad/promo lines before counting (website footer/author-note junk,
    # not real story content, so it must not count against paragraph-count parity)
    $zhAllLines = $zhText -split "`r?`n"

    # Author-note / lottery-footer keywords: verified against the whole chapters_zh corpus to
    # only ever appear in web-serial footer blocks (patron shout-outs, monthly-vote lottery
    # draws, "extra chapter" notices), never inside actual story narrative.
    $adKeywords = @(
        "月票", "抽奖", "中奖", "活动群", "管理QQ", "请大家核对", "视同放弃资格", "折现", "月饼",
        "打赏", "加更", "订阅", "作者的话", "盟主", "书友", "推荐票", "求月票", "求收藏", "本章说"
    )

    # 1) Trailing ad/footer block: scan the last ~80 non-empty lines for the first line hit by an
    # ad keyword, then cut everything from there to EOF (footers are always a contiguous block
    # at the very end, spanning multiple paragraphs — patron lists, lottery number dumps, etc).
    $nonEmptyIdx = for ($ri = 0; $ri -lt $zhAllLines.Length; $ri++) { if ($zhAllLines[$ri].Trim() -ne '') { $ri } }
    $zhCutAt = $zhAllLines.Length
    $tailStart = [Math]::Max(0, $nonEmptyIdx.Count - 80)
    for ($k = $tailStart; $k -lt $nonEmptyIdx.Count; $k++) {
        $ri = $nonEmptyIdx[$k]
        $rl = $zhAllLines[$ri]
        $isAd = $false
        foreach ($kw in $adKeywords) { if ($rl.Contains($kw)) { $isAd = $true; break } }
        if ($isAd) { $zhCutAt = $ri; break }
    }

    $zhLines = $zhAllLines[1..($zhCutAt-1)] | Where-Object {
        $l = $_.Trim()
        if ($l -eq '') { return $false }
        # 2) Mid-chapter pagination notice ("本章未完，请点击下一页继续阅读...") — a single
        # injected line with real story content both before and after it, so only that one
        # paragraph is dropped rather than truncating the rest of the chapter.
        if ($l.Contains("下一页")) { return $false }
        # Also skip lines with 3+ ideographic commas U+3001 (lottery number dumps)
        $ideoCommaCount = ($l.ToCharArray() | Where-Object { [int][char]$_ -eq 0x3001 }).Count
        if ($ideoCommaCount -ge 3) { return $false }
        return $true
    }
    $zhParaCount = if ($zhLines.Count -gt 0) { $zhLines.Count } else { 0 }  # already excluded title

    # consecutive duplicate paragraph check (exact match)
    $dupCount = 0
    for ($i = 1; $i -lt $outLines.Count - 1; $i++) {
        if ($outLines[$i].Trim() -ne "" -and $outLines[$i].Trim() -eq $outLines[$i+1].Trim()) {
            $dupCount++
        }
    }

    # Mojibake check using Unicode escape characters to prevent console encoding issues
    $hasMojibake = $false
    $mojibakePatterns = @(
        "$([char]198)$([char]176)", # Æ°
        "$([char]198)$([char]161)", # Æ¡
        "$([char]225)$([char]186)", # áº
        "$([char]225)$([char]187)", # á»
        "$([char]195)$([char]185)"  # Ã¹
    )
    foreach ($pat in $mojibakePatterns) {
        if ($outText.Contains($pat)) {
            $hasMojibake = $true
            break
        }
    }

    # Informal Slang Check (using escape chars, non-accented regex & exact Unicode patterns)
    $slangRegex = '(?i)(\b(dach|sui tam|con ranh|con a|thang on|dut lot|boc phet|bo doi|xach dit)\b|' + [char]0x0111 + 'á' + [char]0x00AD + 'ch|' + [char]0x0111 + 'á' + [char]0x0063 + 'h)'
    $slangPatterns = @("đách", "sủi tăm", "mày tao", "con ranh", "con ả", "thằng ôn", "đút lót", "bốc phét", "bố đời", "xách đít")
    # "mày"/"tao" as rude 2nd/1st-person pronouns must be excluded when they're actually part of
    # legitimate eyebrow/anatomy compound words (chân mày, nhíu mày, mày tâm, mày ngài...) or
    # elegance compounds (tao nhã, phong tao) which are unrelated common Vietnamese vocabulary.
    $mayEyebrowBefore = "nhíu|nhướng|nhướn|cau|chau|lông|mặt|cúi|cụp|chân|đôi|nhấc|ngước|ngẩng|giãn|hàng|giữa|đầu|chặt|xương|rũ|dưới|trên|đẹp|nhếch|rướn|hẹp|trong|khóe|nét|nhăn|vẽ|mi|thanh|kiếm|ăn"
    $mayEyebrowAfter = "tâm|mắt|rậm|ngài|liễu|cao|dài|thanh|nhíu"
    $slangMayRegex = "(?<!\b($mayEyebrowBefore)\s)\bmày\b(?!\s($mayEyebrowAfter)\b)"
    $slangTaoRegex = "(?<!\b(phong|thanh)\s)\btao\b(?!\snhã)"
    $slangCount = 0
    if ($outText -match $slangRegex) { $slangCount++ }
    if ($outText -match $slangMayRegex) { $slangCount++ }
    if ($outText -match $slangTaoRegex) { $slangCount++ }
    foreach ($sp in $slangPatterns) {
        if ($outText.Contains($sp)) { $slangCount++ }
    }

    # Ad / Web Junk & Explanatory Note Check
    $adPatterns = @(
        "quảng cáo", "quang cao", "trang web", "lọc rác", "xóa quảng cáo", "lược bỏ quảng cáo",
        "loại bỏ quảng cáo", "chú thích dịch", "lời người dịch", "note:", "chú thích:"
    )
    $adCount = 0
    foreach ($ap in $adPatterns) {
        if ($outText.ToLower().Contains($ap)) { $adCount++ }
    }

    $status = "OK"
    if ($cjkCount -gt 0) { $status = "FAIL_CJK" }
    elseif ($hasMojibake) { $status = "FAIL_MOJIBAKE" }
    elseif ($slangCount -gt 0) { $status = "FAIL_SLANG" }
    elseif ($adCount -gt 0) { $status = "FAIL_AD_NOTE" }
    elseif ($ratio -lt 1.0 -or $ratio -gt 2.2) { $status = "FAIL_RATIO" }
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

# Smart Merge into existing CSV to preserve historical QA records
if (Test-Path $OutCsv) {
    try {
        $existing = Import-Csv -Path $OutCsv -Encoding UTF8
        $dict = @{}
        foreach ($item in $existing) {
            $dict[[string]$item.Chuong] = $item
        }
        foreach ($item in $results) {
            $dict[[string]$item.Chuong] = $item
        }
        $finalResults = $dict.Values | Sort-Object { [int]$_.Chuong }
        $finalResults | Export-Csv -Path $OutCsv -NoTypeInformation -Encoding UTF8
    } catch {
        $results | Export-Csv -Path $OutCsv -NoTypeInformation -Encoding UTF8
    }
} else {
    $results | Export-Csv -Path $OutCsv -NoTypeInformation -Encoding UTF8
}
Write-Host "---"
Write-Host "QA Results exported to: $OutCsv" -ForegroundColor Green
$failCount = ($results | Where-Object { $_.Status -ne "OK" }).Count
if ($failCount -gt 0) {
    Write-Host "FAIL/WARN count: $failCount" -ForegroundColor Red
} else {
    Write-Host "ALL PASS! No issues found." -ForegroundColor Green
}
