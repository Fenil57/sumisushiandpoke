import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = 'FINAL_MENU_NEW.pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data }).promise;

let fullText = '';
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const pageText = content.items.map(item => item.str).join(' ');
  fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
}

fs.writeFileSync('menu-extracted.txt', fullText);
console.log('Pages:', doc.numPages);
console.log(fullText);
