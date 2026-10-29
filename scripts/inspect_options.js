const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.resolve(__dirname, '../../database.sql'), 'utf8');

const mediaStart = sql.indexOf("INSERT INTO `media_uploads`");
if (mediaStart !== -1) {
  const mediaEnd = sql.indexOf(";\n", mediaStart);
  const chunk = sql.slice(mediaStart, mediaEnd);
  const regex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;
  let m;
  while ((m = regex.exec(chunk)) !== null) {
    if (m[2].includes('logo') || m[3].includes('logo') || ['901', '126'].includes(m[1])) {
      console.log(`Media ${m[1]}: title=${m[2]} path=${m[3]}`);
    }
  }
}

