const fs = require('fs');

function extractChapter(chNum) {
  const filePath = 'chapters_zh/full_source.txt';
  const buffer = fs.readFileSync(filePath);
  
  // Decode using GBK
  const decoder = new TextDecoder('gbk');
  const text = decoder.decode(buffer);
  const lines = text.split('\n');
  
  // Helper to convert number to Chinese characters
  const chNumMap = {
    826: '第八百二十六章',
    827: '第八百二十七章',
    828: '第八百二十八章',
    829: '第八百二十九章',
    830: '第八百三十章',
    831: '第八百三十一章',
    832: '第八百三十二章'
  };
  
  // A generic function to convert number to Chinese characters for matching
  function getChineseChapterHeader(num) {
    // If mapped, return
    if (chNumMap[num]) return chNumMap[num];
    return `第${num}章`; // Fallback or we can write a full converter if needed
  }
  
  const currentHeader = getChineseChapterHeader(chNum);
  const nextHeader = getChineseChapterHeader(chNum + 1);
  
  console.log(`Searching for chapter ${chNum}...`);
  console.log(`Current header: ${currentHeader}`);
  console.log(`Next header: ${nextHeader}`);
  
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith(currentHeader)) {
      startIndex = i;
    } else if (startIndex !== -1 && line.startsWith(nextHeader)) {
      endIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    console.error(`Could not find chapter header: ${currentHeader}`);
    return false;
  }
  
  if (endIndex === -1) {
    // If next chapter header not found, read till the end of file (or we can search for next generic header)
    console.log('Next chapter header not found. Finding next generic chapter header...');
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^第[零一二两三四五六七八九十百千万\d]+章/.test(line)) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      endIndex = lines.length;
    }
  }
  
  console.log(`Found chapter ${chNum} between lines ${startIndex} and ${endIndex}`);
  const chapterLines = lines.slice(startIndex, endIndex).map(l => l.trim()).filter(l => l.length > 0);
  
  // Format the output
  const title = chapterLines[0];
  const paragraphs = chapterLines.slice(1);
  
  const outputContent = `${title}\n\n` + paragraphs.join('\n\n');
  const outFileName = String(chNum).padStart(4, '0') + '.txt';
  const outPath = `chapters_zh/${outFileName}`;
  
  fs.writeFileSync(outPath, outputContent, 'utf8');
  console.log(`Successfully extracted and saved ${paragraphs.length} paragraphs to ${outPath}`);
  return true;
}

// Extract chapter 826 as requested
const args = process.argv.slice(2);
const num = args[0] ? parseInt(args[0]) : 826;
extractChapter(num);
