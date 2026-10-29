import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';


const UPLOAD_DIR = path.join(process.cwd(), 'public', 'assets', 'uploads', 'media-uploader');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG are allowed.' },
        { status: 400 }
      );
    }

    // Limit to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamped name
    const ext = path.extname(file.name) || '.jpg';
    const cleanBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'image';
    const uniqueFilename = `${cleanBaseName}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/assets/uploads/media-uploader/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { message: 'Failed to upload image', error: error.message },
      { status: 500 }
    );
  }
}
