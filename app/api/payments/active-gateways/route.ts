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
        } else if (g.id === 'wallet') {
          description = 'Pay instantly from your Naira wallet balance with zero transaction fees';
          badge = 'Instant';
          currency = 'NGN';
        } else if (g.id === 'cod' || g.id === 'cash_on_delivery') {
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
          icon: g.icon || (g.id === 'paystack' ? 'paystack-custom-svg' : g.id === 'wallet' ? 'las la-wallet' : 'las la-credit-card'),
          description,
          badge,
          currency,
          isUsd,
          sandbox: !!g.sandbox,
          public_key: g.fields?.public_key || g.fields?.publishable_key || g.fields?.key_id || '',
        };
      });

    return NextResponse.json({
      success: true,
      usdExchangeRate,
      escrow: {
        enabled: settings?.escrowEnabled !== false,
        type: settings?.escrowType || 'percentage',
        rate: Number(settings?.escrowRate || 5),
        payer: settings?.escrowPayer || 'buyer',
        description: settings?.escrowDescription || 'Safe Escrow Protection & Satisfaction Guarantee',
      },
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
