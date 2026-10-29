import { NextResponse } from 'next/server';
import { getPaymentGateways, getPlatformSettings } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [allGateways, settings] = await Promise.all([
      getPaymentGateways(),
      getPlatformSettings(),
    ]);

    const usdExchangeRate = Number(settings?.usdExchangeRate) || 1500;

    // Filter to ONLY active/enabled gateways configured by the Admin
    const active = (allGateways || [])
      .filter((g: any) => g.enabled === true)
      .map((g: any) => {
        let description = 'Secure instant checkout';
        let badge = '';
        let currency = 'NGN';
        let isUsd = false;

        if (g.id === 'paystack') {
          description = 'Fast & secure payment via Debit Card, Bank Account, Transfer, or USSD (in NGN)';
          badge = 'Recommended';
          currency = 'NGN';
        } else if (g.id === 'flutterwave') {
          description = 'Pay with Cards, Bank Accounts, Transfers & Mobile Money (in NGN)';
          badge = 'Popular';
          currency = 'NGN';
        } else if (g.id === 'cod') {
          description = 'Pay in cash directly upon completion of the service (in NGN)';
          currency = 'NGN';
        } else if (g.id === 'stripe') {
          description = 'Pay securely with Visa, MasterCard, or American Express (billed in USD)';
          currency = 'USD';
          isUsd = true;
        } else if (g.id === 'paypal') {
          description = 'Pay with your PayPal balance, linked bank account, or card (billed in USD)';
          currency = 'USD';
          isUsd = true;
        } else if (g.id === 'razorpay') {
          description = 'Pay with UPI, NetBanking, and RuPay cards';
          currency = 'INR';
        } else if (g.id === 'mollie') {
          description = 'European payment methods including iDEAL, Bancontact, and cards';
          currency = 'EUR';
        }

        return {
          id: g.id,
          name: g.name,
          icon: g.icon || (g.id === 'paystack' ? 'paystack-custom-svg' : 'las la-credit-card'),
          description,
          badge,
          currency,
          isUsd,
          sandbox: !!g.sandbox,
        };
      });

    return NextResponse.json({
      success: true,
      usdExchangeRate,
      gateways: active,
    });
  } catch (error: any) {
    console.error('Failed to get active payment gateways:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve active payment gateways', gateways: [] },
      { status: 500 }
    );
  }
}
