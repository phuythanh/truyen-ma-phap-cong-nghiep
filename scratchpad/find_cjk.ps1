$content = Get-Content 'C:\truyen\maphap\chapters_out\1669.md' -Encoding UTF8
$cjk = @()
foreach ($line in $content) {
    if ($line -match '[\p{IsCJKUnifiedIdeographs}]') {
        $cjk += $line
    }
}
$cjk | Out-File 'C:\truyen\maphap\scratchpad\cjk_found.txt' -Encoding UTF8
