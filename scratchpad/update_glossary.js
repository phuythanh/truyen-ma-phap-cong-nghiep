const fs = require('fs');
const path = require('path');

const GLOSSARY_PATH = path.join(__dirname, '../memo/GLOSSARY.tsv');

const replacements = {
  'Lý Hi Minh': { zh: '李曦明', cat: 'Nhân vật' },
  'Lý Uyên Giao': { zh: '李渊蛟', cat: 'Nhân vật' },
  'Lý Hi Trị': { zh: '李曦治', cat: 'Nhân vật' },
  'Lý Hi Tuấn': { zh: '李曦峻', cat: 'Nhân vật' },
  'Lý Chu Vi': { zh: '李周巍', cat: 'Nhân vật' },
  'Lý Hạng Bình': { zh: '李项平', cat: 'Nhân vật' },
  'Lý Xích Kính': { zh: '李赤镜', cat: 'Nhân vật' },
  'Lý Thông Nhai': { zh: '李通崖', cat: 'Nhân vật' },
  'Lý Thanh Hồng': { zh: '李清虹', cat: 'Nhân vật' },
  'Lý Huyền Phong': { zh: '李玄锋', cat: 'Nhân vật' },
  'Lý Huyền Tuyên': { zh: '李玄宣', cat: 'Nhân vật' },
  'Lý Mộc Điền': { zh: '李木田', cat: 'Nhân vật' },
  'Vọng Nguyệt Hồ': { zh: '望月湖', cat: 'Địa danh' },
  'Luyện Khí': { zh: '炼气', cat: 'Thuật ngữ' },
  'Kim Đan': { zh: '金丹', cat: 'Thuật ngữ' },
  'Chân Nhân': { zh: '真人', cat: 'Thuật ngữ' },
  'Chân Quân': { zh: '真君', cat: 'Thuật ngữ' },
  'Đông Hải': { zh: '东海', cat: 'Địa danh' },
  'Giang Nam': { zh: '江南', cat: 'Địa danh' },
  'Sơn Việt': { zh: '山越', cat: 'Địa danh/Thế lực' },
  'Khí Hải': { zh: '气海', cat: 'Thuật ngữ' }
};

function updateGlossary() {
  if (!fs.existsSync(GLOSSARY_PATH)) {
    console.error('Glossary file not found.');
    return;
  }

  let content = fs.readFileSync(GLOSSARY_PATH, 'utf8');
  let lines = content.split('\n');
  let updatedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const viTerm = parts[1].trim();
      if (replacements[viTerm]) {
        parts[0] = replacements[viTerm].zh; // Update ZH term
        parts[2] = replacements[viTerm].cat; // Update Category if needed
        lines[i] = parts.join('\t');
        updatedCount++;
      }
    }
  }

  fs.writeFileSync(GLOSSARY_PATH, lines.join('\n'), 'utf8');
  console.log(`Updated ${updatedCount} translation pairs in GLOSSARY.tsv`);
}

updateGlossary();
