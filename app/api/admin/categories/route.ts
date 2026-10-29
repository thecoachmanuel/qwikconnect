import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === '1';
    const categories = await getCategories(all);
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Admin categories fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newCategory = await createCategory({
      name: name.trim(),
      slug,
      icon: icon || 'las la-tools',
      description: description || '',
    });

    return NextResponse.json({ message: 'Category created successfully', category: newCategory });
  } catch (error: any) {
    console.error('Category creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, icon, description } = body;

    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name?.trim()) {
      updates.name = name.trim();
      updates.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;

    const updated = await updateCategory(Number(id), updates);
    return NextResponse.json({ message: 'Category updated successfully', category: updated });
  } catch (error: any) {
    console.error('Category update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    await deleteCategory(Number(id));
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Category delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
