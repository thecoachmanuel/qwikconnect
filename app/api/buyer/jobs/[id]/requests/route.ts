import { NextResponse } from 'next/server';
import { getJobProposals, getJobDetails } from '@/lib/mongodb';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const jobId = Number(id);
    const job = await getJobDetails(jobId);
    const proposals = await getJobProposals(jobId);

    return NextResponse.json({
      success: true,
      job,
      proposals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

