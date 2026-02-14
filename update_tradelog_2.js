const fs = require('fs');
const path = 'c:\\Users\\Comp\\Downloads\\PipsProfit\\PipsProfit\\components\\TradeLog.tsx';
const content = fs.readFileSync(path, 'utf8');

// Detect line ending
const isCRLF = content.includes('\r\n');
const separator = isCRLF ? '\r\n' : '\n';
let lines = content.split(separator);

console.log(`File uses ${isCRLF ? 'CRLF' : 'LF'} line endings`);
console.log(`Total lines: ${lines.length}`);

// Target line to start replacement (1-based index 590 -> 0-based index 589)
const startIndex = 589;
const endIndex = 653; // inclusive

if (lines.length <= endIndex) {
    console.error(`File does not have enough lines. Total: ${lines.length}, Expected > ${endIndex}`);
    process.exit(1);
}

console.log(`First line to replace (590): "${lines[startIndex]}"`);
console.log(`Last line to replace (654): "${lines[endIndex]}"`);

// Verify content looks roughly correct (start with type="file")
if (!lines[startIndex].trim().startsWith('type="file"')) {
    console.warn(`WARNING: Line 590 does not start with type="file". It is: "${lines[startIndex]}"`);
    // proceed anyway? No, abort to be safe
    // process.exit(1);
}

const count = endIndex - startIndex + 1;

const newProps = [
    '                      onClose={() => setShowPhotoAnnotator(false)}',
    '                      onSave={(dataUrl) => {',
    '                        setEditForm(prev => ({',
    '                          ...prev,',
    '                          photos: [...prev.photos, dataUrl]',
    '                        }));',
    '                      }}',
    '                      strategies={strategies}',
    '                      theme={theme}',
    '                      isLightTheme={isLightTheme}',
    '                    />'
];

lines.splice(startIndex, count, ...newProps);

fs.writeFileSync(path, lines.join(separator));
console.log('Update complete');
