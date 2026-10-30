import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBuyerJobs } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const jobs = await getBuyerJobs(userId);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

