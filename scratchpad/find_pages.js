async function testPage(pageNum) {
  const url = `https://m.boquge.com/wapbook/178980-${pageNum}.html`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { pageNum, status: res.status, count: 0 };
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('gbk');
    const html = decoder.decode(buffer);
    
    // Count matches of /wapbook/178980_
    const matches = html.match(/\/wapbook\/178980_\d+\.html/g);
    const count = matches ? matches.length : 0;
    
    // Find first and last chapter name in this page
    let range = '';
    const nameMatches = html.match(/<a href="\/wapbook\/178980_\d+\.html">([^<]+)<\/a>/g);
    if (nameMatches && nameMatches.length > 0) {
      const first = nameMatches[0].replace(/<[^>]+>/g, '');
      const last = nameMatches[nameMatches.length - 1].replace(/<[^>]+>/g, '');
      range = `${first} -> ${last}`;
    }
    
    return { pageNum, status: res.status, count, range };
  } catch (err) {
    return { pageNum, error: err.message };
  }
}

async function findPages() {
  const pages = [1, 2, 3, 5, 10, 20, 30, 40, 50, 60, 61, 62];
  console.log('Testing pages...');
  for (const p of pages) {
    const result = await testPage(p);
    console.log(`Page ${p}:`, result);
  }
}

findPages();
