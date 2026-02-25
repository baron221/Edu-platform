const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('c:\\Users\\baron\\Documents\\Edu-platform\\Edu-platform\\edunation\\src', function (filePath) {
    if (filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/color:\s*#f1f5f9;/g, 'color: var(--text-primary);')
            .replace(/color:\s*#fff(?:fff)?;/g, 'color: var(--text-primary);')
            .replace(/border(-[a-z]+)?:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.\d+\);/g, 'border$1: 1px solid var(--border);')
            .replace(/border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.\d+\);/g, 'border-color: var(--border);')
            .replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.0[1-7]\);/g, 'background: var(--bg-card);')
            .replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.1[0-5]?\);/g, 'background: var(--bg-glass-strong);')
            .replace(/color:\s*white;/g, 'color: var(--text-primary);');

        // Exceptions for avatar text which should be white (cause gradient bg is dark)
        newContent = newContent.replace(/\.avatar\s*{[^}]*color:\s*var\(--text-primary\);[^}]*}/g, (match) => match.replace('color: var(--text-primary);', 'color: white;'));
        newContent = newContent.replace(/\.testimonialAvatar\s*{[^}]*color:\s*var\(--text-primary\);[^}]*}/g, (match) => match.replace('color: var(--text-primary);', 'color: white;'));
        newContent = newContent.replace(/\.popularBadge\s*{[^}]*color:\s*var\(--text-primary\);[^}]*}/g, (match) => match.replace('color: var(--text-primary);', 'color: white;'));

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated', filePath);
        }
    }
});
