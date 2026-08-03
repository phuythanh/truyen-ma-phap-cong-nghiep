$text = [System.IO.File]::ReadAllText('C:\truyen\maphap\chapters_out\1669.md', [System.Text.Encoding]::UTF8)
$matches = [regex]::Matches($text, '[\u3000-\u303F\uFF00-\uFFEF]')
if ($matches.Count -gt 0) {
    foreach ($m in $matches) {
        Write-Output "Found: $($m.Value)"
    }
} else {
    Write-Output 'NO CJK PUNCTUATION'
}
