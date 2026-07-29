$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$paths = @("C:\truyen\maphap\chapters_out\1702_and_1703_temp.md", "C:\truyen\maphap\chapters_out\1704_and_1705_temp.md")

foreach ($path in $paths) {
    $lines = [System.IO.File]::ReadAllLines($path, $utf8NoBom)
    $outPath = ""
    $currentLines = New-Object System.Collections.Generic.List[String]
    foreach ($line in $lines) {
        if ($line.StartsWith("Ch") -and $line.Contains("170")) {
            if ($outPath -ne "") {
                [System.IO.File]::WriteAllLines($outPath, $currentLines, $utf8NoBom)
                Write-Host "Written $outPath"
            }
            # extract chapter number assuming "Ch... 1702"
            if ($line -match "(170\d)") {
                $outPath = "C:\truyen\maphap\chapters_out\" + $matches[1] + ".md"
            }
            $currentLines.Clear()
        }
        if ($outPath -ne "") {
            $currentLines.Add($line)
        }
    }
    if ($outPath -ne "") {
        [System.IO.File]::WriteAllLines($outPath, $currentLines, $utf8NoBom)
        Write-Host "Written $outPath"
    }
}
