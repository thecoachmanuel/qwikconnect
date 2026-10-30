import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markNotificationsBatchAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/lib/mongodb';

export interface NotificationItem {
  id: number | string;
  role: 'admin' | 'seller' | 'buyer';
  user_id?: number | null;
  order_id?: number | string | null;
  ticket_id?: number | string | null;
  job_post_id?: number | string | null;
  title: string;
  message: string;
  link: string;
  icon: string;
  type: string;
  created_at: string;
  time: string;
  status: number; // 0 = unread, 1 = read
  read: boolean;
}

function formatRelativeTime(dateInput?: string): string {
  if (!dateInput) return 'Recently';
  const now = Date.now();
  const date = new Date(dateInput).getTime();
  if (isNaN(date)) return 'Recently';
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateInput).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const role = (roleParam || (session?.user as any)?.role || 'seller') as 'admin' | 'seller' | 'buyer';
    const userId = session?.user?.id
      ? parseInt(session.user.id, 10)
      : role === 'seller'
      ? 2
      : role === 'buyer'
      ? 4
      : undefined;

    const { notifications: rawList, unread_count } = await getNotifications({
      role,
      user_id: role === 'admin' ? undefined : userId,
    });

    const notifications: NotificationItem[] = rawList.map((n: any) => ({
      ...n,
      time: formatRelativeTime(n.created_at),
      read: Number(n.status) === 1,
    }));

    return NextResponse.json({
      success: true,
      notifications,
      unread_count,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve notifications', notifications: [], unread_count: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { action, id, role: bodyRole, user_id: bodyUserId } = body;

    const role = bodyRole || (session?.user as any)?.role || 'seller';
    const userId = bodyUserId || (session?.user?.id ? parseInt(session.user.id, 10) : role === 'seller' ? 2 : role === 'buyer' ? 4 : undefined);

    if (action === 'mark_read' && id) {
      await markNotificationAsRead(id);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    if (action === 'mark_batch_read' && Array.isArray(body.ids)) {
      await markNotificationsBatchAsRead(body.ids);
      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }

    if (action === 'mark_all_read') {
      await markAllNotificationsAsRead({ role, user_id: role === 'admin' ? undefined : userId });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'clear_all') {
      await clearAllNotifications({ role, user_id: role === 'admin' ? undefined : userId });
      return NextResponse.json({ success: true, message: 'Notifications cleared' });
    }

    // Creating notification manually
    if (body.title && body.message) {
      const created = await createNotification(body);
      return NextResponse.json({ success: true, notification: created });
    }

    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling notification POST:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Notification ID required' }, { status: 400 });
    }

    await deleteNotification(id);
    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
