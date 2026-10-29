const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const m = sql.match(/INSERT INTO `page_builders`[\s\S]*?;/g);
if (m) {
  console.log('Page builder rows count:', (m[0].match(/VALUES/g) || []).length);
  // print first 5 items
  console.log(m[0].slice(0, 1500));
} else {
  console.log('No page_builders insert found');
}
