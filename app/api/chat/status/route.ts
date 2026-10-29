import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// In-memory heartbeat registry for user activity
const activePresence = new Map<number, number>();

// Initialize default sellers / users as active for demo
activePresence.set(2, Date.now()); // Chioma Adebayo
activePresence.set(3, Date.now() - 4 * 60 * 1000); // Babajide Olatunji (active 4m ago)
activePresence.set(4, Date.now() - 2 * 60 * 1000); // Emma Watson

export function checkUserPresence(userId: number | string): { isOnline: boolean; lastSeen: string | null } {
  const targetId = Number(userId);
  const lastSeen = activePresence.get(targetId);
  const now = Date.now();
  const isOnline = !!lastSeen && now - lastSeen < 5 * 60 * 1000;
  return {
    isOnline,
    lastSeen: lastSeen ? new Date(lastSeen).toISOString() : new Date(now - 35 * 60 * 1000).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    if (!userIdParam) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const targetId = parseInt(userIdParam, 10);
    const presence = checkUserPresence(targetId);

    return NextResponse.json({
      success: true,
      userId: targetId,
      isOnline: presence.isOnline,
      lastSeen: presence.lastSeen,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || (session?.user?.id ? parseInt(session.user.id, 10) : 2);

    activePresence.set(Number(userId), Date.now());
    return NextResponse.json({ success: true, userId, isOnline: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
