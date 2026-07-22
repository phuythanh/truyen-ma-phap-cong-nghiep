const fs = require('fs');

function scanFullTxt() {
  const filePath = 'scratchpad/475804_unzipped/家族修仙：开局成为镇族法器.txt';
  const buffer = fs.readFileSync(filePath);
  
  // Decode using GBK
  const decoder = new TextDecoder('gbk');
  const text = decoder.decode(buffer);
  
  // Let's split by newline to find chapter titles
  const lines = text.split('\n');
  console.log('Total lines in full TXT:', lines.length);
  
  // Find lines starting with 第 or containing 章节
  const chapterMatches = [];
  const regex = /^\s*(第[零一二两三四五六七八九十百千万\d]+章\s+\S+)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('解惑') || line.includes('第八百二十六章')) {
      console.log(`Line ${i}: ${line}`);
    }
    const match = line.match(regex);
    if (match) {
      chapterMatches.push({ index: i, title: match[1] });
    }
  }
  
  console.log('Number of matched chapter headers:', chapterMatches.length);
  if (chapterMatches.length > 0) {
    console.log('First 5 chapters:');
    console.log(chapterMatches.slice(0, 5));
    console.log('Last 5 chapters:');
    console.log(chapterMatches.slice(-5));
  }
}

scanFullTxt();
