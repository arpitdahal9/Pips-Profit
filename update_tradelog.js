const fs = require('fs');
const path = 'c:\\Users\\Comp\\Downloads\\PipsProfit\\PipsProfit\\components\\TradeLog.tsx';
const content = fs.readFileSync(path, 'utf8');
let lines = content.split('\r\n'); // Handle Windows line endings
if (lines.length === 1) lines = content.split('\n'); // Fallback

// Target line to start replacement (1-based index 590 -> 0-based index 589)
// Start: line 590: type="file"
// End: line 654: />

const startIndex = 589;
const endIndex = 653; // inclusive
const count = endIndex - startIndex + 1;

console.log(`Replacing lines ${startIndex + 1} to ${endIndex + 1}`);
console.log(`Original content start: ${lines[startIndex]}`);
console.log(`Original content end: ${lines[endIndex]}`);

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

fs.writeFileSync(path, lines.join('\n')); // Write back with LF, standard
console.log('Update complete');
