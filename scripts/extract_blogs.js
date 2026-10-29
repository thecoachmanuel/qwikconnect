const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Also extract media attachments map
const mediaMatches = sql.matchAll(/\((\d+),\s*'([^']*)',\s*'([^']*)'/g);
const mediaMap = {};
for (const m of mediaMatches) {
  mediaMap[m[1]] = m[3]; // id -> path
}

const blogsIndex = sql.indexOf('INSERT INTO `blogs`');
const blogsEnd = sql.indexOf('CREATE TABLE', blogsIndex);
const blogsSql = sql.substring(blogsIndex, blogsEnd);

// Regex to capture blog rows
// columns: id, category_id, user_id, admin_id, created_by, title, slug, blog_content, image, author, excerpt, views, visibility, featured, schedule_date, created_at, updated_at, deleted_at, status, tag_name
const lines = blogsSql.split('\n');
const blogs = [];

for (const line of lines) {
  const m = line.match(/^\((\d+),\s*'([^']*)',\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([\s\S]*?)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/);
  if (m) {
    const id = parseInt(m[1], 10);
    const category_id = m[2];
    const created_by = m[3];
    const title = m[4];
    const slug = m[5];
    const content = m[6].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    const imageId = m[7];
    const author = m[8];
    const excerpt = m[9];

    // Map image ID to media filename or fallback
    let imageName = mediaMap[imageId] || 'b11641641414.jpg';
    if (!imageName.startsWith('b') && !imageName.includes('jpg') && !imageName.includes('png')) {
      imageName = `b${(id % 9) + 1}1641641414.jpg`;
    }

    const categoryNames = {
      '1': 'Electric & AC Repair',
      '2': 'Cleaning Services',
      '3': 'Home Move',
      '4': 'Painting & Decor',
      '5': 'Salon & Spa'
    };

    blogs.push({
      id,
      title,
      slug,
      category: categoryNames[category_id] || 'General Services',
      category_id,
      image: `/assets/uploads/media-uploader/${imageName}`,
      author: author || 'Admin',
      excerpt: excerpt || title,
      content,
      created_at: '2024-03-15'
    });
  }
}

console.log('Extracted blogs count:', blogs.length);
fs.writeFileSync(path.resolve(__dirname, 'extracted_blogs.json'), JSON.stringify(blogs, null, 2));
console.log('Saved to extracted_blogs.json successfully');
