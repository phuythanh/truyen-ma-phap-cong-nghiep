const fs = require('fs');
const path = require('path');

// Configuration
const BOOK_ID = '178980';
const BASE_URL = 'https://m.boquge.com';
const OUTPUT_DIR = path.join(__dirname, '../chapters_zh');
const CACHE_FILE = path.join(__dirname, 'chapters_list.json');

// Chinese number translation helpers
const chnNumChar = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
};
const chnNameValue = {
  '十': { value: 10, secUnit: false },
  '百': { value: 100, secUnit: false },
  '千': { value: 1000, secUnit: false },
  '万': { value: 10000, secUnit: true },
  '亿': { value: 100000000, secUnit: true }
};

function ChineseToNumber(chnStr) {
  let rtnVal = 0;
  let section = 0;
  let number = 0;
  let secUnit = false;
  
  chnStr = chnStr.replace(/[第章]/g, '').trim();
  
  if (/^\d+$/.test(chnStr)) {
    return parseInt(chnStr, 10);
  }
  
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
      if (typeof unit !== 'undefined') {
        secUnit = unit.secUnit;
        if (secUnit) {
          section = (section + number) * unit.value;
          rtnVal += section;
          section = 0;
        } else {
          if (char === '十' && number === 0 && section === 0) {
            number = 1;
          }
          section += number * unit.value;
        }
        number = 0;
      } else {
        // Ignore non-number characters
      }
    }
  }
  return rtnVal + section;
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch and decode GBK
async function fetchGbk(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': `${BASE_URL}/wapbook/${BOOK_ID}.html`
    }
  });
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder('gbk');
  return decoder.decode(buffer);
}

// Main logic
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (command === 'scan') {
    await scanChapters();
  } else if (command === 'download') {
    const start = parseInt(args[1], 10) || 1;
    const end = parseInt(args[2], 10) || null;
    await downloadChapters(start, end);
  } else {
    console.log(`
Usage:
  node scratchpad/crawl_chapters.js scan
      Scan all chapter URLs and save to cache.

  node scratchpad/crawl_chapters.js download <start_chapter> [end_chapter]
      Download chapters from <start_chapter> to [end_chapter] and save to chapters_zh/ directory.
      Examples:
        node scratchpad/crawl_chapters.js download 1 10
        node scratchpad/crawl_chapters.js download 910
    `);
  }
}

// Scan all pages to build chapter list
async function scanChapters() {
  console.log('Starting catalog scan...');
  let page = 1;
  let allChapters = [];
  let consecutiveEmptyPages = 0;

  while (page <= 100) { // Safety limit of 100 pages
    console.log(`Scanning page ${page}...`);
    try {
      const html = await fetchGbk(`${BASE_URL}/wapbook/${BOOK_ID}-${page}.html`);
      
      // Parse chapters using regex
      // Format: <li><a href="/wapbook/178980_190055216.html">第九百一十章 今不复也</a></li>
      const chapterRegex = /<li><a href="(\/wapbook\/178980_\d+\.html)">([^<]+)<\/a><\/li>/g;
      let match;
      let count = 0;

      while ((match = chapterRegex.exec(html)) !== null) {
        const href = match[1];
        const title = match[2].trim();
        
        // Extract chapter number
        // Matches "第X章" or "第X百X章" etc.
        const chNumMatch = title.match(/第([零一二两三四五六七八九十百千万亿\d]+)章/);
        if (chNumMatch) {
          const chNumStr = chNumMatch[1];
          const chNum = ChineseToNumber(chNumStr);
          
          if (chNum > 0) {
            allChapters.push({
              number: chNum,
              title: title,
              url: BASE_URL + href
            });
            count++;
          }
        }
      }

      console.log(`Found ${count} valid chapters on page ${page}.`);

      if (count === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 3) {
          console.log('Detected 3 consecutive empty pages. Stopping scan.');
          break;
        }
      } else {
        consecutiveEmptyPages = 0;
      }

      page++;
      await sleep(1000); // Friendly politeness delay
    } catch (err) {
      console.error(`Error scanning page ${page}:`, err.message);
      break;
    }
  }

  // Remove duplicates and sort by chapter number
  const uniqueChapters = {};
  for (const ch of allChapters) {
    if (!uniqueChapters[ch.number] || ch.title.length > uniqueChapters[ch.number].title.length) {
      uniqueChapters[ch.number] = ch;
    }
  }

  const sortedChapters = Object.values(uniqueChapters).sort((a, b) => a.number - b.number);
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(sortedChapters, null, 2), 'utf8');
  console.log(`Successfully scanned ${sortedChapters.length} unique chapters.`);
  console.log(`Chapter range: Chapter ${sortedChapters[0]?.number} to Chapter ${sortedChapters[sortedChapters.length - 1]?.number}`);
  console.log(`Saved index cache to: ${CACHE_FILE}`);
}

// Download chapters
async function downloadChapters(startNum, endNum) {
  if (!fs.existsSync(CACHE_FILE)) {
    console.log('Chapter cache not found! Running scan first...');
    await scanChapters();
  }

  const chapters = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  if (chapters.length === 0) {
    console.error('No chapters found in cache! Please check if scan succeeded.');
    return;
  }

  const targetEndNum = endNum || chapters[chapters.length - 1].number;
  console.log(`Preparing to download chapters from ${startNum} to ${targetEndNum}...`);

  const toDownload = chapters.filter(c => c.number >= startNum && c.number <= targetEndNum);
  console.log(`Total chapters to fetch: ${toDownload.length}`);

  for (let i = 0; i < toDownload.length; i++) {
    const ch = toDownload[i];
    const fileName = String(ch.number).padStart(4, '0') + '.txt';
    const filePath = path.join(OUTPUT_DIR, fileName);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`[${i+1}/${toDownload.length}] Chapter ${ch.number} already exists offline. Skipping.`);
      continue;
    }

    console.log(`[${i+1}/${toDownload.length}] Downloading Chapter ${ch.number}: ${ch.title} ...`);
    let success = false;
    let retries = 3;

    while (retries > 0 && !success) {
      try {
        const html = await fetchGbk(ch.url);
        
        // Parse content
        // Content lies in <div id="cContent">...</div>
        const contentMatch = html.match(/<div id="cContent">([\s\S]*?)<\/div>/);
        if (!contentMatch) {
          throw new Error('Could not find content container (<div id="cContent">)');
        }

        const rawContent = contentMatch[1];
        
        // Extract paragraph texts
        let paragraphs = [];
        const pRegex = /<p>([\s\S]*?)<\/p>/gi;
        let pMatch;
        while ((pMatch = pRegex.exec(rawContent)) !== null) {
          let pTextHtml = pMatch[1].replace(/<br\s*\/?>/gi, '\n');
          let text = pTextHtml.replace(/<[^>]+>/g, '').trim();
          // Clean up HTML entities
          text = text.replace(/&nbsp;/g, ' ')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&amp;/g, '&');
          if (text) {
            const lines = text.split('\n').map(t => t.trim()).filter(t => t.length > 0);
            paragraphs.push(...lines);
          }
        }

        // Fallback if no <p> tags but raw text is present
        if (paragraphs.length === 0) {
          const cleanedText = rawContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '\n');
          paragraphs = cleanedText.split('\n')
                                  .map(t => t.trim())
                                  .filter(t => t.length > 0);
        }

        // Format to save:
        // Line 1: Title
        // Line 2: empty
        // Line 3+: Paragraphs separated by empty line
        const fileContent = `${ch.title}\n\n` + paragraphs.join('\n\n');
        
        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`Successfully saved to chapters_zh/${fileName} (${paragraphs.length} paragraphs)`);
        success = true;
      } catch (err) {
        retries--;
        console.error(`Error downloading chapter ${ch.number}: ${err.message}. Retries left: ${retries}`);
        if (retries > 0) {
          await sleep(2000);
        }
      }
    }

    if (!success) {
      console.error(`FAILED to download Chapter ${ch.number} after all retries!`);
    }

    // Delay between chapters
    if (i < toDownload.length - 1) {
      const delay = Math.floor(Math.random() * 1000) + 800; // Random delay between 800ms and 1800ms
      await sleep(delay);
    }
  }

  console.log('All downloads completed!');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
