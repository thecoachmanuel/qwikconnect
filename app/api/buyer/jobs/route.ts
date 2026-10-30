import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBuyerJobs } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        jobs: [],
      });
    }
    const userId = parseInt(session.user.id, 10);
    const jobs = await getBuyerJobs(userId);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

