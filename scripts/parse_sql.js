const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Match CREATE TABLE
const tableRegex = /CREATE TABLE `(\w+)` \(([\s\S]*?)\) ENGINE=/g;
let match;
const tables = {};

while ((match = tableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  tables[tableName] = { columns: [], primaryKeys: [], uniqueKeys: [] };

  const lines = body.split('\n').map(l => l.trim().replace(/,$/, '')).filter(Boolean);
  for (const line of lines) {
    // Check if column definition
    const colMatch = line.match(/^`(\w+)`\s+([a-zA-Z0-9_]+(?:\([0-9,]+\))?)(.*)$/i);
    if (colMatch) {
      const colName = colMatch[1];
      const rawType = colMatch[2].toLowerCase();
      const rest = colMatch[3] || '';
      const unsigned = rest.includes('UNSIGNED');
      const notNull = rest.includes('NOT NULL');
      const defMatch = rest.match(/DEFAULT\s+('([^']*)'|NULL|[0-9.]+)/i);
      const defaultVal = defMatch ? (defMatch[2] !== undefined ? defMatch[2] : defMatch[1]) : null;

      tables[tableName].columns.push({
        name: colName,
        rawType,
        unsigned,
        nullable: !notNull,
        defaultVal
      });
    }
  }
}

// Match ALTER TABLE ADD PRIMARY KEY
const alterRegex = /ALTER TABLE `(\w+)`([\s\S]*?);/g;
while ((match = alterRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const alterBody = match[2];
  if (tables[tableName]) {
    const pkMatch = alterBody.match(/ADD PRIMARY KEY \(([^)]+)\)/);
    if (pkMatch) {
      tables[tableName].primaryKeys = pkMatch[1].split(',').map(k => k.trim().replace(/`/g, ''));
    }
    const uqMatches = [...alterBody.matchAll(/ADD UNIQUE KEY `?(\w+)`?\s*\(([^)]+)\)/g)];
    for (const uq of uqMatches) {
      tables[tableName].uniqueKeys.push({
        name: uq[1],
        columns: uq[2].split(',').map(k => k.trim().replace(/`/g, ''))
      });
    }
  }
}

// Check which tables have no primary key
const noPk = Object.keys(tables).filter(t => tables[t].primaryKeys.length === 0);
console.log('Total tables parsed:', Object.keys(tables).length);
console.log('Tables without PK:', noPk);

for (const t of noPk) {
  console.log('Columns for ' + t + ':', tables[t].columns.map(c => c.name));
}
