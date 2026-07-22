const fs = require('fs');

function checkFullTxt() {
  const filePath = 'scratchpad/475804_unzipped/家族修仙：开局成为镇族法器.txt';
  
  // Let's read the last 50000 bytes of the file to see the ending chapters
  const fd = fs.openSync(filePath, 'r');
  const stats = fs.statSync(filePath);
  console.log('File size:', stats.size);
  
  // Read a chunk from the end
  const bufferSize = 50000;
  const buffer = Buffer.alloc(bufferSize);
  const position = Math.max(0, stats.size - bufferSize);
  fs.readSync(fd, buffer, 0, bufferSize, position);
  fs.closeSync(fd);
  
  // Try decoding using UTF-8 and GBK
  const utf8Text = buffer.toString('utf8');
  const gbkDecoder = new TextDecoder('gbk');
  const gbkText = gbkDecoder.decode(buffer);
  
  console.log('--- UTF-8 last 500 chars snippet ---');
  console.log(utf8Text.slice(-1000));
  
  console.log('--- GBK last 500 chars snippet ---');
  console.log(gbkText.slice(-1000));
}

checkFullTxt();
