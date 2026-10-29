import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUsers } from '@/lib/mongodb';
import { checkUserPresence } from '@/app/api/chat/status/route';

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : 2; // Default to seller or current user
    const users = await getUsers();
    const currentUser = users.find((u) => u.id === currentUserId) || users[1];

    // Find partners: if seller, show buyers; if buyer, show sellers
    const partners = users.filter((u) => u.id !== currentUserId && u.user_type !== currentUser.user_type);

    const conversations = partners.map((partner) => {
      const presence = checkUserPresence(partner.id);
      return {
        user: {
          ...partner,
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
        },
        lastMessage: partner.user_type === 0 ? 'Hello! I am available to work on your request.' : 'Hi, when can you start?',
        lastMessageTime: new Date().toISOString(),
      };
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
