const fs = require('fs');

async function testFetch() {
  const url = 'https://m.boquge.com/wapbook/178980_190055216.html';
  try {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });
    
    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    const buffer = await res.arrayBuffer();
    // Decode as GBK since response type header is GBK
    const decoder = new TextDecoder('gbk');
    const html = decoder.decode(buffer);
    
    console.log('HTML Length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    
    // Save to test file
    fs.writeFileSync('scratchpad/test_page.html', html, 'utf8');
    console.log('Saved to scratchpad/test_page.html');
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFetch();
