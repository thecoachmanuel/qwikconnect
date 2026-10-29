const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

function getPage(id) {
  const match = sql.match(new RegExp('\\(' + id + ',\\s*\'([^\']+)\',\\s*\'([^\']+)\',\\s*\'([\\s\\S]*?)\',\\s*\'all\''));
  if (match) {
    return {
      id,
      title: match[1],
      slug: match[2],
      content: match[3].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
    };
  }
  return null;
}

const p41 = getPage(41);
const p42 = getPage(42);

console.log('Privacy Title:', p41 ? p41.title : 'None');
console.log('Privacy Snippet:', p41 ? p41.content.substring(0, 200) : 'None');
console.log('Terms Title:', p42 ? p42.title : 'None');
console.log('Terms Snippet:', p42 ? p42.content.substring(0, 200) : 'None');

if (p41 && p42) {
  fs.writeFileSync(path.resolve(__dirname, 'extracted_policies.json'), JSON.stringify({ privacy: p41, terms: p42 }, null, 2));
  console.log('Extracted to extracted_policies.json successfully');
}
