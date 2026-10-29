import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTodos, createTodo, updateTodo, deleteTodo } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get('user_id');
    const userId = userParam ? parseInt(userParam, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const todos = await getTodos(userId);
    return NextResponse.json({ success: true, todos });
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch to-do items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const userId = body.user_id ? parseInt(body.user_id, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, message: 'Task title is required' }, { status: 400 });
    }

    const newTodo = await createTodo({
      user_id: userId,
      title: body.title,
      description: body.description || '',
    });

    return NextResponse.json({ success: true, message: 'To-do item added successfully', todo: newTodo }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create to-do item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid or missing task ID' }, { status: 400 });
    }

    const updated = await updateTodo(id, {
      title: body.title,
      description: body.description,
      status: body.status !== undefined ? Number(body.status) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'To-do item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task updated successfully', todo: updated });
  } catch (error: any) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update to-do item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam, 10) : null;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid or missing task ID' }, { status: 400 });
    }

    const success = await deleteTodo(id);
    return NextResponse.json({ success, message: success ? 'Task removed' : 'Task not found' });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete to-do item' },
      { status: 500 }
    );
  }
}
