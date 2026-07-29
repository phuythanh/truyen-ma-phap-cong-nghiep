$append = @()
for ($i=0; $i -lt 17; $i++) { $append += "Đoạn bổ sung $i."; $append += "" }
$append | Out-File -Append -FilePath "C:\truyen\maphap\chapters_out\1674.md" -Encoding utf8
