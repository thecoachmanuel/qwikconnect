import { NextRequest, NextResponse } from 'next/server';
import { getBlogById, updateBlog, deleteBlog } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blog = await getBlogById(id);
    if (!blog) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }
    return NextResponse.json({ blog, success: true });
  } catch (error: any) {
    console.error('Admin blog fetch error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error?.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateBlog(id, body);
    if (!updated) {
      return NextResponse.json({ message: 'Blog post not found or could not be updated' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Blog post updated successfully', blog: updated, success: true });
  } catch (error: any) {
    console.error('Admin blog update error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteBlog(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog post deleted successfully', success: true });
  } catch (error: any) {
    console.error('Admin blog delete error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error?.message }, { status: 500 });
  }
}
