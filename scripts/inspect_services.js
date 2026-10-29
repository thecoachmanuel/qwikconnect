const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const catIdx = sql.indexOf('INSERT INTO `categories`');
if (catIdx >= 0) {
  const endCat = sql.indexOf(';\n', catIdx);
  console.log('--- ALL CATEGORIES ---');
  console.log(sql.slice(catIdx, endCat + 1));
}

const srvIdx = sql.indexOf('INSERT INTO `services`');
if (srvIdx >= 0) {
  const endSrv = sql.indexOf(';\n', srvIdx);
  console.log('--- ALL SERVICES (FIRST 2000 CHARS) ---');
  console.log(sql.slice(srvIdx, Math.min(srvIdx + 2000, endSrv + 1)));
}

