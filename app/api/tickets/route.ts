import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTickets, createTicket, updateTicket } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get('user_id');
    const allParam = searchParams.get('all') === 'true' || searchParams.get('all') === '1';

    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.guard === 'admin' || (session?.user as any)?.email === 'admin@qixer.com';

    let userId: number | undefined = undefined;
    if (userParam) {
      userId = parseInt(userParam, 10);
    } else if (!allParam && !isAdmin && session?.user?.id) {
      userId = parseInt(session.user.id, 10);
    }

    const tickets = await getTickets(userId);

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
    });
  } catch (error: any) {
    console.error('Tickets GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve tickets', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { subject, department, priority, description, order_id } = body;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ message: 'Subject and description are required' }, { status: 400 });
    }

    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.guard === 'admin' || (session?.user as any)?.email === 'admin@qixer.com';
    const isSeller = !isAdmin && ((session?.user as any)?.user_type === 2 || (session?.user as any)?.role === 'seller');

    let defaultUserId = 2;
    if (session?.user?.id) {
      defaultUserId = parseInt(session.user.id, 10);
    } else if (body.role === 'buyer') {
      defaultUserId = 4;
    }

    const userId = body.user_id ? parseInt(body.user_id, 10) : defaultUserId;
    const senderRole = isAdmin ? 'admin' : (body.role || (isSeller ? 'seller' : 'buyer'));
    const senderName = session?.user?.name || (userId === 2 ? 'Chioma Adebayo' : userId === 4 ? 'Emma Watson' : 'Client');

    const newTicket = await createTicket({
      user_id: userId,
      order_id: order_id || undefined,
      subject: subject.trim(),
      department: department || 'General Support',
      priority: priority || 'normal',
      description: description.trim(),
      sender_name: senderName,
      sender_role: senderRole,
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error('Tickets POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create ticket', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { id, status, admin_reply, priority, message } = body;

    if (!id) {
      return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.guard === 'admin' || (session?.user as any)?.email === 'admin@qixer.com';
    const isSeller = !isAdmin && ((session?.user as any)?.user_type === 2 || (session?.user as any)?.role === 'seller');
    const senderRole = isAdmin ? 'admin' : (isSeller ? 'seller' : 'buyer');
    const senderName = session?.user?.name || (senderRole === 'admin' ? 'Support Team' : senderRole === 'seller' ? 'Chioma Adebayo' : 'Emma Watson');

    let formattedMessage = message;
    if (formattedMessage && typeof formattedMessage === 'object') {
      formattedMessage = {
        sender: formattedMessage.sender || senderRole,
        sender_name: formattedMessage.sender_name || senderName,
        message: formattedMessage.message,
      };
    }

    const updated = await updateTicket(Number(id), status, admin_reply, {
      priority,
      message: formattedMessage,
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updated,
    });
  } catch (error: any) {
    console.error('Tickets PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket', error: error.message },
      { status: 500 }
    );
  }
}
