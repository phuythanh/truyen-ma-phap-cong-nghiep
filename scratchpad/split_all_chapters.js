const fs = require('fs');
const path = require('path');

// Helper to convert Chinese numeral to Arabic numeral
function chineseToArabic(chnStr) {
  const chnNumChar = {
    零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9
  };
  const chnNameValue = {
    十: { value: 10, secUnit: false },
    百: { value: 100, secUnit: false },
    千: { value: 1000, secUnit: false },
    万: { value: 10000, secUnit: true },
    亿: { value: 100000000, secUnit: true }
  };
  
  let rtValue = 0;
  let section = 0;
  let number = 0;
  for (let i = 0; i < chnStr.length; i++) {
    const char = chnStr[i];
    const num = chnNumChar[char];
    if (typeof num !== 'undefined') {
      number = num;
      if (i === chnStr.length - 1) {
        section += number;
      }
    } else {
      const unit = chnNameValue[char];
      if (typeof unit === 'undefined') {
        continue;
      }
      if (unit.secUnit) {
        section = (section + number) * unit.value;
        rtValue += section;
        section = 0;
        number = 0;
      } else {
        if (number === 0 && char === '十') {
          number = 1;
        }
        section += number * unit.value;
        number = 0;
      }
    }
  }
  return rtValue + section;
}

function splitAllChapters() {
  const filePath = 'chapters_zh/full_source.txt';
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  console.log('Reading full source file...');
  const buffer = fs.readFileSync(filePath);
  const decoder = new TextDecoder('gbk');
  const text = decoder.decode(buffer);
  const lines = text.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  const chapters = [];
  const regex = /^\s*第([零一二两三四五六七八九十百千万\d]+)章(.*)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(regex);
    if (match) {
      const chChineseNum = match[1];
      const chTitlePart = match[2].trim();
      const chArabicNum = chineseToArabic(chChineseNum);
      if (chArabicNum > 0) {
        chapters.push({
          number: chArabicNum,
          chineseNum: chChineseNum,
          title: `第${chChineseNum}章 ${chTitlePart}`.trim(),
          lineIndex: i
        });
      }
    }
  }
  
  console.log(`Found ${chapters.length} chapter headers in the source file.`);
  
  // Create output directory if not exists
  const outputDir = 'chapters_zh';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Sort chapters by number
  chapters.sort((a, b) => a.number - b.number);
  
  // Split content
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const startIndex = ch.lineIndex;
    const endIndex = (i + 1 < chapters.length) ? chapters[i + 1].lineIndex : lines.length;
    
    const chapterLines = lines.slice(startIndex, endIndex).map(l => l.trim()).filter(l => l.length > 0);
    
    // The first line is title, the rest are paragraphs
    const title = chapterLines[0];
    const paragraphs = chapterLines.slice(1);
    
    const fileContent = `${title}\n\n` + paragraphs.join('\n\n');
    const fileName = String(ch.number).padStart(4, '0') + '.txt';
    const outPath = path.join(outputDir, fileName);
    
    fs.writeFileSync(outPath, fileContent, 'utf8');
  }
  
  console.log(`Successfully split and saved ${chapters.length} chapters to ${outputDir}/`);
}

splitAllChapters();
