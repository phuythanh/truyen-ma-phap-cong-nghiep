$text = [System.IO.File]::ReadAllText('C:\truyen\maphap\chapters_out\1669.md', [System.Text.Encoding]::UTF8)
$matches = [regex]::Matches($text, '[\p{IsCJKUnifiedIdeographs}]+')
if ($matches.Count -gt 0) {
    foreach ($m in $matches) {
        Write-Output $m.Value
    }
} else {
    Write-Output 'NO CJK'
}
