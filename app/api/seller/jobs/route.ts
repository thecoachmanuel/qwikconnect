import { NextResponse } from 'next/server';
import { getAllOpenJobs } from '@/lib/mongodb';

export async function GET() {
  try {
    const jobs = await getAllOpenJobs();

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

