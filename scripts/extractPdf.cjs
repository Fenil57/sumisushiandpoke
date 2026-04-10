const fs = require('fs');
const pdf = require('pdf-parse');

async function main() {
  const buf = fs.readFileSync('FINAL_MENU_NEW.pdf');
  const data = await pdf(buf);
  fs.writeFileSync('menu-text.txt', data.text);
  console.log('Pages:', data.numpages);
  console.log('Text length:', data.text.length);
  console.log('--- Full text ---');
  console.log(data.text);
}

main().catch(console.error);
