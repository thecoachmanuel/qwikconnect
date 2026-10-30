import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptJobProposal } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const jobId = Number(body.job_id);
    const proposalId = Number(body.proposal_id);

    if (!jobId || !proposalId) {
      return NextResponse.json({ success: false, message: 'Invalid job or proposal ID' }, { status: 400 });
    }

    await acceptJobProposal(jobId, proposalId);

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted! The artisan has been notified to begin work.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

