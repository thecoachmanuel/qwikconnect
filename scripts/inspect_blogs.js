const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Build media_uploads map: id -> path
const mediaMap = {};
const mediaStart = sql.indexOf("INSERT INTO `media_uploads`");
if (mediaStart !== -1) {
  const mediaEnd = sql.indexOf(";\n", mediaStart);
  const mediaSql = sql.slice(mediaStart, mediaEnd);
  // Match rows like (id, 'title', 'path', ...)
  // e.g. (1, 'young...', 'young-beautiful-cleaner...', ...)
  const rowRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;
  let match;
  while ((match = rowRegex.exec(mediaSql)) !== null) {
    mediaMap[match[1]] = match[3];
  }
}
console.log('Total media_uploads parsed:', Object.keys(mediaMap).length);

// Now inspect blogs
const blogIdx = sql.indexOf("INSERT INTO `blogs`");
if (blogIdx !== -1) {
  const blogEnd = sql.indexOf(";\n", blogIdx);
  const blogsSql = sql.slice(blogIdx, blogEnd);
  
  // Let's find blog rows
  // Columns: id, category_id, user_id, admin_id, created_by, title, slug, blog_content, image, author, excerpt, ...
  const blogRegex = /\((\d+),\s*'([^']*)',\s*([^,]+),\s*([^,]+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([\s\S]*?)',\s*'([^']*)'/g;
  let bMatch;
  const results = [];
  while ((bMatch = blogRegex.exec(blogsSql)) !== null) {
    const id = bMatch[1];
    const category_id = bMatch[2];
    const title = bMatch[6];
    const slug = bMatch[7];
    const imageMediaId = bMatch[9];
    const imagePath = mediaMap[imageMediaId] || null;
    
    // Check if imagePath exists in public
    const diskPath = imagePath ? path.resolve(__dirname, '../public/assets/uploads/media-uploader', imagePath) : null;
    const exists = diskPath ? fs.existsSync(diskPath) : false;
    
    results.push({ id, title, imageMediaId, imagePath, exists });
  }
  console.log('Parsed blogs count:', results.length);
  console.log(JSON.stringify(results, null, 2));
}
