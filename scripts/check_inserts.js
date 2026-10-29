const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const matches = [...sql.matchAll(/INSERT INTO `(\w+)`/g)].map(m => m[1]);
console.log('Tables with seed data:', [...new Set(matches)]);
