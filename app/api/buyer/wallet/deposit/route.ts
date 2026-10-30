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

    // If payment was completed through Paystack popup or direct verification
    if (body.confirmed || body.payment_reference) {
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
    const isLive = pstk?.sandbox === false;

    // If Paystack key is configured
    if (isConfigured && secretKey.startsWith('sk_')) {
      const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const referer = request.headers.get('referer') || '';
      const isPwa = referer.includes('pwa=1');
      const callbackUrl = isPwa
        ? `${origin}/?pwa=1&verify_deposit=1&reference=${transactionId}`
        : `${origin}/buyer/wallet?verify_deposit=1&reference=${transactionId}`;

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
          callback_url: callbackUrl,
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

      if (isLive) {
        return NextResponse.json(
          {
            success: false,
            message: pstkData.message || 'Paystack live payment initialization failed. Please check credentials or customer email.',
          },
          { status: 400 }
        );
      }
    }

    if (isLive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paystack is in Live Mode but secret key is not configured. Please enter live keys in Admin Payment Settings.',
        },
        { status: 400 }
      );
    }

    // Sandbox fallback
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
