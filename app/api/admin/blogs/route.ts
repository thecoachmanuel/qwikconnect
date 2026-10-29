import { NextRequest, NextResponse } from 'next/server';
import { getBlogs, createBlog } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const blogs = await getBlogs();
    return NextResponse.json({ blogs, success: true });
  } catch (error: any) {
    console.error('Admin blogs fetch error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, category, category_id, image, author, excerpt, content, status, tags, meta_title, meta_description, meta_tags } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ message: 'Blog title is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ message: 'Blog content is required' }, { status: 400 });
    }

    const newBlog = await createBlog({
      title: title.trim(),
      slug: slug?.trim() || undefined,
      category: category?.trim() || 'General',
      category_id: category_id ? String(category_id) : '1',
      image: image?.trim() || '/assets/uploads/media-uploader/banner11638279446.png',
      author: author?.trim() || 'Super Admin',
      excerpt: excerpt?.trim() || title.trim(),
      content: content.trim(),
      status: status || 'publish',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      meta_title: meta_title?.trim() || undefined,
      meta_description: meta_description?.trim() || undefined,
      meta_tags: meta_tags?.trim() || undefined,
    });

    return NextResponse.json({ message: 'Blog created successfully', blog: newBlog, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Admin blog creation error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error?.message }, { status: 500 });
  }
}
