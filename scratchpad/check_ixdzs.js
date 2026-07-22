async function checkIxdzs() {
  const url = 'https://ixdzs8.com/read/475804/';
  try {
    console.log('Fetching', url, '...');
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    console.log('HTML length:', text.length);
    
    // Look for down links
    const regex = /href="([^"]*down[^"]*)"/gi;
    let match;
    console.log('Links containing "down":');
    while ((match = regex.exec(text)) !== null) {
      console.log('  -', match[1]);
    }
    
    // Look for any links with .txt or .zip or .epub
    const fileRegex = /href="([^"]*\.(?:txt|zip|epub|rar)[^"]*)"/gi;
    console.log('Links with file extensions:');
    while ((match = fileRegex.exec(text)) !== null) {
      console.log('  -', match[1]);
    }
  } catch (err) {
    console.error(err);
  }
}
checkIxdzs();
