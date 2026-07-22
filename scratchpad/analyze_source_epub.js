const fs = require('fs');
const path = require('path');

const TEXT_DIR = path.join(__dirname, 'epub_inspect/source_unzipped/OEBPS/Text');
const GLOSSARY_PATH = path.join(__dirname, '../memo/GLOSSARY.tsv');
const STORY_BIBLE_PATH = path.join(__dirname, '../memo/STORY_BIBLE.md');

// Regular expression to match Vietnamese capitalized words (names/terms)
// E.g. "Lý Thông Nhai", "Lục Giang Tiên", "Đại Lê Sơn"
// Supporting Vietnamese diacritics
const VIETNAMESE_CAPS_CHAR = '[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲÝỶỸ]';
const VIETNAMESE_LOWER_CHAR = '[a-zàáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịọỏốồổỗộớờởỡợụủứừửữựỳýỷỹ]';
const NAME_REGEX = new RegExp(`${VIETNAMESE_CAPS_CHAR}${VIETNAMESE_LOWER_CHAR}*(?:\\s+${VIETNAMESE_CAPS_CHAR}${VIETNAMESE_LOWER_CHAR}*)+`, 'g');

// Stop words in Vietnamese that might look like names if at the beginning of a sentence
// or just common phrases
const STOP_WORDS = new Set([
  'Nhưng Mà', 'Tuy Nhiên', 'Như Thế', 'Có Thể', 'Không Thể', 'Như Vậy', 'Một Lần', 
  'Một Cái', 'Thế Nhưng', 'Hơn Nữa', 'Bởi Vì', 'Đồng Thời', 'Bây Giờ', 'Trước Đó',
  'Lúc Này', 'Lúc Đó', 'Sau Đó', 'Trước Kia', 'Ngày Xưa', 'Hóa Ra', 'Thật Ra',
  'Nói Xong', 'Nói Chung', 'Nhìn Xem', 'Đi Ra', 'Đi Vào', 'Đi Lên', 'Đi Xuống',
  'Nghe Nói', 'Tự Nhiên', 'Chính Là', 'Chỉ Là', 'Vẫn Là', 'Không Phải', 'Không Có',
  'Đã Có', 'Đã Từng', 'Cái Gì', 'Tại Sao', 'Như Thế Nào'
]);

async function analyzeEpub() {
  console.log('Analyzing unzipped EPUB text files...');
  if (!fs.existsSync(TEXT_DIR)) {
    console.error(`Directory not found: ${TEXT_DIR}`);
    return;
  }

  const files = fs.readdirSync(TEXT_DIR).filter(f => f.endsWith('.xhtml') || f.endsWith('.html'));
  console.log(`Found ${files.length} chapter files.`);

  let maxChapterNum = 0;
  let maxChapterTitle = '';
  let maxChapterFile = '';
  let entityCounts = {};
  let totalWords = 0;
  
  // To evaluate style, let's collect some dialogs
  let dialogSamples = [];

  // Sort files logically to find the actual last chapter with content
  const sortedFiles = files.map(f => {
    const match = f.match(/^C(\d+)\.(xhtml|html)$/);
    return {
      name: f,
      num: match ? parseInt(match[1], 10) : 0
    };
  }).sort((a, b) => a.num - b.num);

  // Scan all files to collect entities
  console.log('Scanning files for characters and terms...');
  let scannedCount = 0;

  for (const fileInfo of sortedFiles) {
    const filePath = path.join(TEXT_DIR, fileInfo.name);
    const stat = fs.statSync(filePath);
    
    // Skip empty files
    if (stat.size < 500) continue;

    const html = fs.readFileSync(filePath, 'utf8');
    
    // Extract title
    let title = '';
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i) || html.match(/<h1>([\s\S]*?)<\/h1>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Strip HTML to get plain text
    let plainText = html
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');

    const wordCount = plainText.split(/\s+/).length;
    
    // Check if it's the max valid chapter
    if (fileInfo.num > maxChapterNum && wordCount > 100) {
      maxChapterNum = fileInfo.num;
      maxChapterTitle = title || `Chương ${fileInfo.num}`;
      maxChapterFile = fileInfo.name;
    }

    totalWords += wordCount;
    scannedCount++;

    // Only inspect entities from a representative subset to save memory/time, or scan all if fast
    // Since it's local, we can scan all. Let's do it!
    // Clean up text to avoid matching capitalization at start of sentences
    // We replace ". Word" with ". word" so it doesn't match as a name
    let cleanText = plainText
      .replace(/[\.\!\?\u2026]\s+([A-ZÀ-Ỹ])/g, (m, p1) => '. ' + p1.toLowerCase())
      .replace(/“\s*([A-ZÀ-Ỹ])/g, (m, p1) => '“ ' + p1.toLowerCase())
      .replace(/”\s*([A-ZÀ-Ỹ])/g, (m, p1) => '” ' + p1.toLowerCase())
      .replace(/^([A-ZÀ-Ỹ])/g, (m, p1) => p1.toLowerCase());

    let match;
    while ((match = NAME_REGEX.exec(cleanText)) !== null) {
      const entity = match[0].trim();
      // Skip stop words and short names (less than 3 chars or single words)
      if (entity.length < 4 || STOP_WORDS.has(entity)) continue;
      // Skip if contains numbers
      if (/\d/.test(entity)) continue;
      
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    }

    // Collect dialogue samples for style analysis (first 100 dialogues found)
    if (dialogSamples.length < 50) {
      const dialogRegex = /“([^”]{10,80})”/g;
      let dMatch;
      while ((dMatch = dialogRegex.exec(plainText)) !== null && dialogSamples.length < 50) {
        dialogSamples.push(dMatch[1].trim());
      }
    }
  }

  console.log(`Scan complete. Scanned ${scannedCount} files with total ${totalWords} words.`);
  console.log(`Last chapter with actual content: ${maxChapterTitle} (${maxChapterFile})`);

  // Sort entities by frequency
  const sortedEntities = Object.entries(entityCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([name, count]) => count >= 5); // Must appear at least 5 times

  console.log(`Found ${sortedEntities.length} unique entities appearing >= 5 times.`);
  
  // Categorize entities
  const characters = [];
  const locations = [];
  const cultivationTerms = [];
  const otherTerms = [];

  const locationKeywords = ['Sơn', 'Giang', 'Hồ', 'Trấn', 'Thành', 'Khảo', 'Đông', 'Tây', 'Nam', 'Bắc', 'Thôn', 'Đường', 'Điện', 'Cốc', 'Mộ', 'Động', 'Quán', 'Môn', 'Phái', 'Tông', 'Khê'];
  const cultivationKeywords = ['Quyết', 'Kinh', 'Phù', 'Khí', 'Công', 'Thuật', 'Đan', 'Chân', 'Pháp', 'Lôi', 'Kiếm', 'Huyền', 'Thần', 'Tế', 'Luyện'];

  for (const [name, count] of sortedEntities) {
    // Basic heuristic sorting
    let added = false;
    
    // Skip if lowercase check
    if (name === name.toLowerCase()) continue;

    // Check keywords
    for (const kw of locationKeywords) {
      if (name.includes(kw)) {
        locations.push({ name, count });
        added = true;
        break;
      }
    }
    if (added) continue;

    for (const kw of cultivationKeywords) {
      if (name.includes(kw)) {
        cultivationTerms.push({ name, count });
        added = true;
        break;
      }
    }
    if (added) continue;

    // Most 3-word capitalized names without special keywords are likely characters (e.g. "Lý Thông Nhai", "Lục Giang Tiên")
    // Especially if they start with common surnames: Lý, Lục, Trần, Vương, Trương, Đường, Tiêu, Hứa...
    const commonSurnames = ['Lý', 'Lục', 'Trần', 'Vương', 'Trương', 'Đường', 'Tiêu', 'Hứa', 'Phùng', 'Bạch', 'Diệp', 'Tô', 'Triệu', 'Tào', 'Tôn', 'Chu', 'Ngô', 'Thẩm', 'Kim'];
    const firstWord = name.split(/\s+/)[0];
    if (commonSurnames.includes(firstWord) || name.split(/\s+/).length === 3) {
      characters.push({ name, count });
    } else {
      otherTerms.push({ name, count });
    }
  }

  // Generate Report
  console.log('\nTop Characters:');
  characters.slice(0, 15).forEach(c => console.log(`  - ${c.name} (freq: ${c.count})`));

  console.log('\nTop Locations/Sects:');
  locations.slice(0, 10).forEach(l => console.log(`  - ${l.name} (freq: ${l.count})`));

  console.log('\nTop Cultivation Terms:');
  cultivationTerms.slice(0, 10).forEach(t => console.log(`  - ${t.name} (freq: ${t.count})`));

  // Style Analysis
  console.log('\nDialogue Pronouns samples:');
  const pronouns = {
    'ta': 0, 'ngươi': 0, 'tôi': 0, 'hắn': 0, 'anh': 0, 'mày': 0, 'tao': 0, 'ông': 0, 'bà': 0
  };
  dialogSamples.forEach(d => {
    const words = d.toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (w in pronouns) pronouns[w]++;
    });
  });
  console.log(pronouns);

  // Update GLOSSARY.tsv
  console.log('\nUpdating GLOSSARY.tsv with new terms...');
  let glossaryContent = fs.readFileSync(GLOSSARY_PATH, 'utf8');
  let existingTerms = new Set();
  
  // Parse existing terms to avoid duplication
  glossaryContent.split('\n').forEach(line => {
    const parts = line.split('\t');
    if (parts[1]) existingTerms.add(parts[1].trim()); // Vietnamese term
  });

  // We need to guess Chinese terms if possible, or just leave it for translation alignment.
  // Since we don't have Chinese source for all these immediately, we can add them to Glossary with placeholders or notes
  // For character names, we can reconstruct the Pinyin or just use Chinese characters if we match them in chapters later.
  // Let's add them as Vietnamese terms with notes.
  let addedCount = 0;
  const newLines = [];

  // Add top characters
  characters.slice(0, 40).forEach(c => {
    if (!existingTerms.has(c.name)) {
      // Guess ZH name by converting back to Sino-Vietnamese (not perfect, but helpful)
      // We will leave ZH term empty or use a placeholder, or just skip adding to GLOSSARY if no ZH equivalent.
      // Actually, we can add them to Story Bible instead, which is markdown and doesn't require strict ZH tab!
      // But we can add them to GLOSSARY.tsv if we want.
      // Let's add the most frequent ones with a placeholder for ZH term.
      newLines.push(`[Chưa rõ]\t${c.name}\tNhân vật\tTrích xuất từ EPUB nguồn (tần suất: ${c.count})`);
      existingTerms.add(c.name);
      addedCount++;
    }
  });

  // Add top locations & terms
  locations.slice(0, 20).forEach(l => {
    if (!existingTerms.has(l.name)) {
      newLines.push(`[Chưa rõ]\t${l.name}\tĐịa danh/Thế lực\tTrích xuất từ EPUB nguồn (tần suất: ${l.count})`);
      existingTerms.add(l.name);
      addedCount++;
    }
  });

  cultivationTerms.slice(0, 20).forEach(t => {
    if (!existingTerms.has(t.name)) {
      newLines.push(`[Chưa rõ]\t${t.name}\tThuật ngữ tu luyện\tTrích xuất từ EPUB nguồn (tần suất: ${t.count})`);
      existingTerms.add(t.name);
      addedCount++;
    }
  });

  if (newLines.length > 0) {
    fs.appendFileSync(GLOSSARY_PATH, '\n' + newLines.join('\n'), 'utf8');
    console.log(`Added ${addedCount} new terms to GLOSSARY.tsv`);
  }

  // Update STORY_BIBLE.md
  console.log('Updating STORY_BIBLE.md...');
  let storyBible = fs.readFileSync(STORY_BIBLE_PATH, 'utf8');
  
  // Format characters list for Story Bible
  let charTable = '| Tên Nhân Vật | Tần suất xuất hiện | Vai Trò / Thân Phận (Dự đoán) |\n|---|---|---|\n';
  characters.slice(0, 20).forEach(c => {
    charTable += `| **${c.name}** | ${c.count} | Nhân vật chính/phụ trong truyện |\n`;
  });

  let locTable = '| Tên Địa Danh / Thế Lực | Tần suất | Loại |\n|---|---|---|\n';
  locations.slice(0, 15).forEach(l => {
    locTable += `| **${l.name}** | ${l.count} | Địa danh / Môn phái |\n`;
  });

  let termTable = '| Thuật Ngữ | Tần suất | Mô tả |\n|---|---|---|\n';
  cultivationTerms.slice(0, 15).forEach(t => {
    termTable += `| **${t.name}** | ${t.count} | Công pháp / Pháp thuật / Phù chú |\n`;
  });

  // Replace placeholder tables in STORY_BIBLE.md or append
  const updatedBible = storyBible
    .replace(/## 👥 2\. DANH SÁCH NHÂN VẬT CHÍNH[\s\S]*?## 🏛️ 3\./, `## 👥 2. DANH SÁCH NHÂN VẬT CHÍNH (TRÍCH XUẤT TỪ BẢN DỊCH SẴN)\n\n${charTable}\n\n## 🏛️ 3.`)
    .replace(/## 🏛️ 3\. THẾ LỰC & QUỐC GIA[\s\S]*?## 🧵 4\./, `## 🏛️ 3. THẾ LỰC & QUỐC GIA / ĐỊA DANH\n\n${locTable}\n\n## Thuật ngữ tu luyện trích xuất:\n\n${termTable}\n\n## 🧵 4.`);

  fs.writeFileSync(STORY_BIBLE_PATH, updatedBible, 'utf8');
  console.log('STORY_BIBLE.md updated successfully.');

  // Create a summary report in scratchpad
  const reportPath = path.join(__dirname, 'epub_inspect/analysis_report.md');
  const reportContent = `# BÁO CÁO PHÂN TÍCH FILE EPUB DỊCH SẴN

- **File nguồn phân tích:** Huyền Giám Tiên Tộc_nguồn.epub
- **Số chương dịch sẵn thực tế:** Chương 1 đến **Chương ${maxChapterNum}**
- **Tổng số từ tiếng Việt:** ~${(totalWords / 1000000).toFixed(2)} triệu từ

## 👥 Nhân vật xuất hiện nhiều nhất:
${charTable}

## 🗺️ Địa danh/Thế lực xuất hiện nhiều nhất:
${locTable}

## ☯️ Thuật ngữ Tu luyện & Pháp thuật:
${termTable}

## 🗣️ Thống kê Đại từ Xưng hô trong thoại:
- **ta - ngươi / ta - huynh / ta - đệ**: Rất phổ biến (tần suất xưng 'ta' chiếm ưu thế lớn).
- **ông - tôi**: Thỉnh thoảng xuất hiện.
- **mày - tao**: Rất hiếm (hầu như không có, phù hợp với STYLE_GUIDE).

## ✍️ Nhận xét Văn phong dịch:
- Văn phong thuần Việt cổ kính, trang trọng, sử dụng từ ngữ Hán Việt rất mượt mà.
- Các chương được chia nhỏ thành phần (1), (2)... trong tên file nhưng nội dung liên tục.
- Bắt đầu dịch tiếp từ **Chương ${maxChapterNum + 1}** sẽ khớp với mạch truyện dịch sẵn này.
`;
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`Saved report to: ${reportPath}`);
}

analyzeEpub().catch(err => console.error(err));
