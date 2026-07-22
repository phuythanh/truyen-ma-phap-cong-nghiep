const fs = require('fs');
const path = require('path');

function splitChapters() {
    const filePath = path.join(__dirname, 'extracted', '玄鉴仙族_utf8.txt');
    const outputDir = path.join(__dirname, '..', 'chapters_zh');
    
    if (!fs.existsSync(filePath)) {
        console.error("Source file not found:", filePath);
        return;
    }
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log("Reading raw file...");
    const text = fs.readFileSync(filePath, 'utf8');
    
    // Regex matches chapter titles
    const regex = /(^|\r?\n)(第\s*[0-9一二三四五六七八九十百千万零百十]+\s*[章节].*?)(?=\r?\n|$)/g;
    
    const chapters = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        chapters.push({
            index: match.index,
            title: match[2].trim(),
            titleLength: match[2].length
        });
    }
    
    console.log(`Found ${chapters.length} chapter markers.`);
    
    // We expect the first chapter marker to be "第一千零九十七章大璺在身" and duplicate, let's verify
    if (chapters[0].title.includes("第一千零九") || chapters[0].title.includes("1097")) {
        console.log(`First marker is duplicate: "${chapters[0].title}". Removing it.`);
        chapters.shift();
    }
    
    console.log(`Remaining chapters to output: ${chapters.length}`);
    
    for (let i = 0; i < chapters.length; i++) {
        const current = chapters[i];
        const next = chapters[i + 1];
        
        const titleStart = current.index;
        // The body starts after the title (we search for the newline after title)
        const titleEnd = text.indexOf('\n', titleStart);
        const bodyStart = titleEnd !== -1 ? titleEnd + 1 : titleStart + current.titleLength;
        const bodyEnd = next ? next.index : text.length;
        
        let body = text.substring(bodyStart, bodyEnd).trim();
        
        // Clean up body (remove web signatures or ads if any)
        // Split by lines, trim, and remove empty lines
        let lines = body.split(/\r?\n/).map(line => line.trim());
        
        // Filter out typical signature lines if any
        lines = lines.filter(line => {
            if (line === '') return false;
            if (line.includes('爱下电子书') || line.includes('ixdzs8') || line.includes('E-mail:')) return false;
            if (line.includes('------章节内容开始-------') || line.includes('------章节内容结束-------')) return false;
            return true;
        });

        // Remove duplicated title at the beginning of the body
        if (lines.length > 0) {
            const cleanedFirstLine = lines[0].replace(/\s+/g, '');
            const cleanedTitle = current.title.replace(/\s+/g, '');
            if (cleanedFirstLine === cleanedTitle || cleanedFirstLine.includes(cleanedTitle) || cleanedTitle.includes(cleanedFirstLine)) {
                lines.shift();
            }
        }
        
        const outputFilename = path.join(outputDir, `${(i + 1).toString().padStart(4, '0')}.txt`);
        
        const fileContent = current.title + "\n\n" + lines.join("\n\n");
        fs.writeFileSync(outputFilename, fileContent, 'utf8');
        
        if ((i + 1) === 1 || (i + 1) === chapters.length || (i + 1) % 100 === 0) {
            console.log(`Saved: ${outputFilename} -> "${current.title}" (${lines.length} paragraphs)`);
        }
    }
    
    console.log("Done splitting chapters!");
}

splitChapters();
