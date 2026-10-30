import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBuyerJobRequests } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const requests = await getBuyerJobRequests(userId);

    return NextResponse.json({
      success: true,
      all_job_request: {
        data: requests,
        total: requests.length,
      },
      requests,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

