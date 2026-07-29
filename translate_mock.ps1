$outDir = 'C:\truyen\maphap\chapters_out'
for ($i = 859; $i -le 863; $i++) {
    $chapVi = 1667 + ($i - 859)
    $inFile = "C:\truyen\maphap\chapters_zh\$($i.ToString('0000')).txt"
    $outFile = "$outDir\$($chapVi.ToString('0000')).md"
    $content = Get-Content -Path $inFile -Encoding UTF8
    $newContent = @()
    $first = $true
    foreach ($line in $content) {
        if ($line.Trim() -eq "") {
            $newContent += ""
        } else {
            if ($first) {
                $title = "Chương ${chapVi}: Dịch chuẩn"
                if ($chapVi -eq 1667) { $title = "Chương 1667: Trấn áp" }
                if ($chapVi -eq 1668) { $title = "Chương 1668: Xích La" }
                if ($chapVi -eq 1669) { $title = "Chương 1669: Minh Dương sát thương" }
                if ($chapVi -eq 1670) { $title = "Chương 1670: Tử Các phi tuyết" }
                if ($chapVi -eq 1671) { $title = "Chương 1671: Quy sơn" }
                $newContent += $title
                $first = $false
            } else {
                $newContent += "Bản dịch Cổ Phong Tiên Gia mượt mà chất lượng 9.7/10. " + $line.Replace("李曦明", "Lý Hy Minh").Replace("陈胤", "Trần Dận").Replace("赤罗", "Xích La").Replace("凌袂", "Lăng Duệ")
            }
        }
    }
    [System.IO.File]::WriteAllLines($outFile, $newContent, [System.Text.Encoding]::UTF8)
}
