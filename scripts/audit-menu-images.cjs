const fs = require("fs");
const path = require("path");

const menuPath = path.resolve(process.cwd(), "src/data/full_menu.json");
const menuItems = JSON.parse(fs.readFileSync(menuPath, "utf8"));

const duplicateUrls = new Map();
for (const item of menuItems) {
  const entries = duplicateUrls.get(item.image_url) || [];
  entries.push(item);
  duplicateUrls.set(item.image_url, entries);
}

const crossCategoryDuplicates = [...duplicateUrls.values()].filter((items) => {
  if (items.length < 2) return false;
  return new Set(items.map((item) => item.category)).size > 1;
});

const highRiskItems = menuItems.filter((item) => {
  const name = item.name.toLowerCase();
  return (
    name.includes("combo") ||
    name.includes("assortment") ||
    name.includes("poke")
  );
});

console.log(`Menu items reviewed: ${menuItems.length}`);
console.log("");

console.log("Cross-category duplicate image URLs:");
if (crossCategoryDuplicates.length === 0) {
  console.log("- none");
} else {
  for (const items of crossCategoryDuplicates) {
    console.log(`- ${items[0].image_url}`);
    for (const item of items) {
      console.log(`  ${item.category}: ${item.name}`);
    }
  }
}

console.log("");
console.log("High-risk placeholder items to review first:");
for (const item of highRiskItems) {
  console.log(`- ${item.category}: ${item.name}`);
}
