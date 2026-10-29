import { NextRequest, NextResponse } from 'next/server';
import { getUsers, updateUser, deleteUser } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_status, user_type } = body;

    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof user_status === 'number') updateData.user_status = user_status;
    if (typeof user_type === 'number') updateData.user_type = user_type;

    await updateUser(Number(id), updateData);
    return NextResponse.json({ message: 'User updated successfully', user: { id, ...updateData } });
  } catch (error: any) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await deleteUser(Number(id));
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
