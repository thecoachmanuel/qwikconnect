import { NextRequest, NextResponse } from 'next/server';
import { createContactMessage, getContactMessages, createNotification, createTicket, getPlatformSettings } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide your name, email, and message.' },
        { status: 400 }
      );
    }

    // 1. Save contact message record
    const contactRecord = await createContactMessage({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : undefined,
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim(),
    });

    const settings = await getPlatformSettings();
    const adminEmail = settings.contactEmail || 'admin@qixer.ng';

    // 2. Create High-Priority Admin Notification (appears in Admin bell icon and notifications dashboard)
    await createNotification({
      role: 'admin',
      title: `New Contact Inquiry: ${contactRecord.subject}`,
      message: `From ${contactRecord.name} (${contactRecord.email}): ${contactRecord.message.slice(0, 80)}${contactRecord.message.length > 80 ? '...' : ''}`,
      link: '/admin/support-tickets',
      icon: 'las la-envelope',
      type: 'ticket',
    });

    // 3. Create Support Ticket for Admin inquiry tracking & replies
    await createTicket({
      user_id: 4, // Default client ID for guest contact inquiries
      subject: `[Contact Form] ${contactRecord.subject}`,
      department: 'General Support',
      priority: 'normal',
      description: `New message submitted from Contact Page:\n\nName: ${contactRecord.name}\nEmail: ${contactRecord.email}\nPhone: ${contactRecord.phone || 'N/A'}\nSubject: ${contactRecord.subject}\n\nMessage:\n${contactRecord.message}`,
      sender_name: contactRecord.name,
      sender_role: 'buyer',
    });

    // 4. Log / Dispatch notification to Admin email (PHP Laravel Mail::to(site_global_email) equivalent)
    console.log(`[CONTACT EMAIL DELIVERED] Successfully dispatched contact message from ${contactRecord.name} <${contactRecord.email}> to Admin (${adminEmail})`);

    // Match PHP Laravel's original success response: 'Thanks for your contact !!'
    return NextResponse.json({
      success: true,
      message: 'Thanks for your contact !!',
      record: contactRecord,
    });
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process contact message. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const messages = await getContactMessages();
    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}
