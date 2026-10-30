import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSellerProposals, createJobProposal } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const proposals = await getSellerProposals(sellerId);

    return NextResponse.json({
      success: true,
      proposals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const sellerName = session?.user?.name || 'Verified Artisan';
    const body = await request.json();

    const jobId = Number(body.job_id);
    const proposedAmount = Number(body.proposed_amount);
    const coverLetter = body.cover_letter || body.message || '';

    if (!jobId || !proposedAmount || !coverLetter) {
      return NextResponse.json(
        { success: false, message: 'Please provide job ID, proposed amount, and cover letter.' },
        { status: 400 }
      );
    }

    const proposal = await createJobProposal({
      job_id: jobId,
      seller_id: sellerId,
      seller_name: sellerName,
      proposed_amount: proposedAmount,
      expected_salary: proposedAmount,
      cover_letter: coverLetter,
      message: coverLetter,
    });

    return NextResponse.json({
      success: true,
      message: 'Your quote has been submitted to the client!',
      proposal,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

