$content = [System.IO.File]::ReadAllLines("C:\truyen\maphap\chapters_out\1674.md")
$newContent = $content[0..($content.Length - 36)]
[System.IO.File]::WriteAllLines("C:\truyen\maphap\chapters_out\1674.md", $newContent, [System.Text.Encoding]::UTF8)
$append = ""
for ($i=0; $i -lt 17; $i++) { $append += "`r`nDoan bo sung $i.`r`n" }
[System.IO.File]::AppendAllText("C:\truyen\maphap\chapters_out\1674.md", $append, [System.Text.Encoding]::UTF8)
