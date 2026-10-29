import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMessages, sendMessage, getUsers } from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const { searchParams } = new URL(request.url);
    const targetUserIdStr = searchParams.get('userId');

    if (!targetUserIdStr) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    const targetUserId = parseInt(targetUserIdStr, 10);
    const messages = await getMessages(currentUserId, targetUserId);

    const users = await getUsers();
    const targetUser = users.find((u) => u.id === targetUserId) || {
      id: targetUserId,
      name: 'User',
      username: 'user',
      user_type: 1,
    };

    return NextResponse.json({
      messages,
      targetUser,
    });
  } catch (error: any) {
    console.error('Chat messages fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const body = await request.json();
    const { to_user, message } = body;

    if (!to_user || !message?.trim()) {
      return NextResponse.json(
        { message: 'Recipient and message are required' },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(to_user, 10);
    const newMessage = await sendMessage(currentUserId, targetUserId, message.trim());

    if (pusherServer) {
      try {
        await pusherServer.trigger(`chat-user-${targetUserId.toString()}`, 'message-received', newMessage);
      } catch (pusherErr) {
        console.warn('Pusher trigger failed:', pusherErr);
      }
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error: any) {
    console.error('Chat message send error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
