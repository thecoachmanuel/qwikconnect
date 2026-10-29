const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const idx = sql.indexOf('INSERT INTO `media_uploads`');
if (idx >= 0) {
  console.log(sql.slice(idx, idx + 1000));
} else {
  console.log('Not found');
}
