async function check59() {
  const url = 'https://m.boquge.com/wapbook/178980-59.html';
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('gbk');
    const html = decoder.decode(buffer);
    const regex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
    let match;
    console.log('List of chapters on page 59:');
    while ((match = regex.exec(html)) !== null) {
      console.log(`  - URL: ${match[1]}, Title: ${match[2]}`);
    }
  } catch (err) {
    console.error(err);
  }
}
check59();
