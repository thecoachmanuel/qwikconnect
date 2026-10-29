import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReports, createReport, updateReportStatus, deleteReport } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    let sellerId = searchParams.get('seller_id') ? parseInt(searchParams.get('seller_id')!, 10) : undefined;
    let buyerId = searchParams.get('buyer_id') ? parseInt(searchParams.get('buyer_id')!, 10) : undefined;
    const status = searchParams.get('status') || undefined;

    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.guard === 'admin' || (session?.user as any)?.email === 'admin@qixer.com';
    const isSeller = !isAdmin && ((session?.user as any)?.user_type === 2 || (session?.user as any)?.role === 'seller');
    const isBuyer = !isAdmin && ((session?.user as any)?.user_type === 1 || (session?.user as any)?.role === 'buyer');

    if (!sellerId && !buyerId && session?.user?.id && !isAdmin) {
      if (isSeller) {
        sellerId = parseInt(session.user.id, 10);
      } else if (isBuyer) {
        buyerId = parseInt(session.user.id, 10);
      }
    }

    const reports = await getReports({ seller_id: sellerId, buyer_id: buyerId, status });
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dispute reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    if (!body.order_id || !body.description || !body.reason) {
      return NextResponse.json(
        { success: false, message: 'Order ID, reason, and description are required.' },
        { status: 400 }
      );
    }

    const newReport = await createReport({
      order_id: body.order_id,
      service_name: body.service_name,
      seller_name: body.seller_name,
      buyer_name: body.buyer_name,
      seller_id: body.seller_id,
      buyer_id: body.buyer_id,
      report_from: body.report_from || 'buyer',
      report_to: body.report_to || 'seller',
      reason: body.reason,
      description: body.description,
    });

    return NextResponse.json(
      { success: true, message: 'Dispute report submitted successfully.', report: newReport },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting dispute report:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id || !body.status) {
      return NextResponse.json(
        { success: false, message: 'Dispute ID and status are required.' },
        { status: 400 }
      );
    }

    const updated = await updateReportStatus(id, body.status, body.admin_decision);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute updated successfully.',
      report: updated,
    });
  } catch (error: any) {
    console.error('Error updating dispute report:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')!, 10) : null;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid or missing dispute ID' }, { status: 400 });
    }

    const success = await deleteReport(id);
    return NextResponse.json({ success, message: success ? 'Dispute record deleted.' : 'Dispute not found.' });
  } catch (error: any) {
    console.error('Error deleting dispute report:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete report' },
      { status: 500 }
    );
  }
}
