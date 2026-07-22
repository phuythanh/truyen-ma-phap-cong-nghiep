const fs = require('fs');
const path = require('path');

async function downloadZip() {
    const url = 'https://down7.ixdzs8.com/508570.zip';
    const outputPath = path.join(__dirname, '508570.zip');
    
    console.log(`Starting download from ${url} to ${outputPath}...`);
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ixdzs8.com/read/508570/'
    };
    
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(outputPath, buffer);
        console.log(`Download completed! File size: ${buffer.length} bytes`);
    } catch (e) {
        console.error('Error downloading zip:', e);
    }
}

downloadZip();
