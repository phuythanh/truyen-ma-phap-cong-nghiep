const fs = require('fs');

async function checkChapter844() {
  // Let's scan pages from 50 to 60 where these chapters are likely located
  const baseUrl = 'https://m.boquge.com';
  const bookId = '178980';
  
  // Since we already fetched some pages in test_page.html, let's write a loop to search the index list
  // Or we can just fetch the pages around the one containing chapter 843
  // Let's write a script to find which page has chapter 843 (URL ending with 189318689)
  console.log('Searching for chapter 843 page...');
  for (let page = 50; page <= 62; page++) {
    const url = `${baseUrl}/wapbook/${bookId}-${page}.html`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      const decoder = new TextDecoder('gbk');
      const html = decoder.decode(buffer);
      
      if (html.includes('189318689')) {
        console.log(`Found chapter 843 on page ${page}!`);
        // Extract all list items
        const regex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
        let match;
        console.log('List of chapters on this page:');
        while ((match = regex.exec(html)) !== null) {
          console.log(`  - URL: ${match[1]}, Title: ${match[2]}`);
        }
        break;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

checkChapter844();
