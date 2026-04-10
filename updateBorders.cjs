const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let totalUpdated = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/border-\[var\(--color-(?:washi|sumi|ink)\)\](?:\/(?:10|15|20|5|30))?/g, 'border-[var(--color-shu)]/40');
  
  // also replace hardcoded hex colors
  newContent = newContent.replace(/border-\[#(?:f9f6f0|1c1c1c)\](?:\/(?:10|15|20|5|30))?/g, 'border-[var(--color-shu)]/40');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    totalUpdated++;
    console.log(`Updated borders in: ${file}`);
  }
});

console.log(`\nSuccessfully updated borders in ${totalUpdated} files.`);
