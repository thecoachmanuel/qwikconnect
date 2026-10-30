import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateways, updatePaymentGateways, getPlatformSettings, updatePlatformSettings } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const [gateways, settings] = await Promise.all([
      getPaymentGateways(),
      getPlatformSettings(),
    ]);

    const escrow = {
      escrowEnabled: settings.escrowEnabled !== false,
      escrowType: settings.escrowType || 'percentage',
      escrowRate: settings.escrowRate || '5',
      escrowPayer: settings.escrowPayer || 'buyer',
      escrowDescription: settings.escrowDescription || '100% Secure Escrow Protection. Funds held safely until service completion is approved.',
    };

    return NextResponse.json({ gateways, escrow });
  } catch (error: any) {
    console.error('Failed to get payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment gateway configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { gateways, escrow } = body;

    let updatedGateways: any[] = [];
    if (Array.isArray(gateways)) {
      updatedGateways = await updatePaymentGateways(gateways);
    }

    if (escrow && typeof escrow === 'object') {
      await updatePlatformSettings({
        escrowEnabled: Boolean(escrow.escrowEnabled),
        escrowType: escrow.escrowType || 'percentage',
        escrowRate: String(escrow.escrowRate || '5'),
        escrowPayer: escrow.escrowPayer || 'buyer',
        escrowDescription: escrow.escrowDescription || '',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment gateway configurations and Escrow settings saved successfully',
      gateways: updatedGateways,
      escrow,
    });
  } catch (error: any) {
    console.error('Failed to update payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payment gateway configurations' },
      { status: 500 }
    );
  }
}
