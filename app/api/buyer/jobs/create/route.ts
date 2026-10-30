import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createJob } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Please sign in to post a custom job.' }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    if (!body.title || body.title.trim().length < 5) {
      return NextResponse.json({ success: false, message: 'Job title must be at least 5 characters' }, { status: 400 });
    }
    if (!body.description || body.description.trim().length < 10) {
      return NextResponse.json({ success: false, message: 'Please provide a detailed job description' }, { status: 400 });
    }
    if (!body.budget || Number(body.budget) < 1000) {
      return NextResponse.json({ success: false, message: 'Minimum budget is ₦1,000' }, { status: 400 });
    }

    const newJob = await createJob({
      buyer_id: userId,
      title: body.title.trim(),
      category: body.category || 'other',
      description: body.description.trim(),
      budget: Number(body.budget),
      deadline: body.deadline,
      city: body.city || 'Lagos',
      address: body.address || '',
      attachment: body.attachment || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully! Artisans can now submit quotes.',
      job: newJob,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

