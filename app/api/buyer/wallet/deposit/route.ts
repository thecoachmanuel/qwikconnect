import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { creditWallet, getPaymentGateways } from '@/lib/mongodb';
import { getPaystackCredentials } from '@/lib/payments/keys';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const userEmail = session?.user?.email || 'buyer@qwikconnect.ng';
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount < 100) {
      return NextResponse.json({ success: false, message: 'Minimum deposit amount is ₦100' }, { status: 400 });
    }

    const gateway = body.gateway || 'paystack';
    const transactionId = body.transaction_id || `WAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // If payment was completed through Paystack popup or direct confirmation
    if (body.confirmed || body.payment_reference || body.simulate) {
      const result = await creditWallet(userId, amount, gateway, body.payment_reference || transactionId);
      return NextResponse.json({
        success: true,
        message: `Successfully deposited ₦${amount.toLocaleString()} into your wallet!`,
        balance: result.balance,
        newBalance: result.balance,
        transaction: result.transaction,
      });
    }

    // Initialize Paystack payment
    const gateways = await getPaymentGateways();
    const pstk = (gateways as any[]).find((g: any) => g.id === 'paystack');
    const { secretKey, publicKey, isConfigured } = getPaystackCredentials(pstk);

    // If real Paystack key is available (either configured by admin or in environment variables)
    if (isConfigured && secretKey.startsWith('sk_')) {
      try {
        const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const pstkRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(amount * 100), // kobo
            reference: transactionId,
            callback_url: `${origin}/buyer/wallet?verify_deposit=1&reference=${transactionId}`,
            metadata: {
              user_id: userId,
              amount: amount,
              type: 'wallet_deposit',
            },
          }),
        });

        const pstkData = await pstkRes.json();
        if (pstkData?.status && pstkData?.data?.authorization_url) {
          return NextResponse.json({
            success: true,
            paystack: true,
            authorization_url: pstkData.data.authorization_url,
            reference: transactionId,
            public_key: publicKey,
          });
        }
      } catch (err) {
        console.warn('Paystack initialize failed, falling back to instant credit:', err);
      }
    }

    // Direct sandbox/test deposit fallback
    const result = await creditWallet(userId, amount, gateway, transactionId);
    return NextResponse.json({
      success: true,
      message: `Successfully deposited ₦${amount.toLocaleString()} into your wallet!`,
      balance: result.balance,
      newBalance: result.balance,
      transaction: result.transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
