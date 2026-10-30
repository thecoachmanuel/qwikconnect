import { NextRequest, NextResponse } from 'next/server';
import { getOrders, getServices, getPlatformSettings, updateOrderStatus, deductWallet } from '@/lib/mongodb';
import { createStripeCheckoutSession } from '@/lib/payments/stripe';
import { createPaypalOrder } from '@/lib/payments/paypal';
import { initializePaystack } from '@/lib/payments/paystack';
import { initializeFlutterwave } from '@/lib/payments/flutterwave';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { initializeMollie } from '@/lib/payments/mollie';
import { PaymentIntentOptions } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, gateway } = body;

    if (!orderId) {
      return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
    }

    const [allOrders, settings] = await Promise.all([
      getOrders(),
      getPlatformSettings(),
    ]);

    const order = (allOrders as any[]).find((o: any) => Number(o.id) === Number(orderId) || String(o.id) === String(orderId));

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const allServices = await getServices();
    const service = (allServices as any[]).find((s: any) => Number(s.id) === Number(order.service_id));

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invoiceNum = order.invoice || `INV-${order.id}`;
    const successUrl = `${origin}/order-success?order_id=${order.id}&invoice=${encodeURIComponent(invoiceNum)}`;
    const cancelUrl = `${origin}/service-list`;

    const selectedGateway = (gateway || order.payment_gateway || 'cash_on_delivery').toLowerCase();
    const isUsdGateway = selectedGateway === 'stripe' || selectedGateway === 'paypal';
    const isEurGateway = selectedGateway === 'mollie';
    const isInrGateway = selectedGateway === 'razorpay';
    const usdExchangeRate = Number(settings?.usdExchangeRate) || 1500;

    let amountInCurrency = Number(order.total);
    let chargeCurrency = 'NGN';

    if (isUsdGateway) {
      amountInCurrency = Math.max(1, Math.round((Number(order.total) / usdExchangeRate) * 100) / 100);
      chargeCurrency = 'USD';
    } else if (isEurGateway) {
      amountInCurrency = Math.max(1, Math.round((Number(order.total) / 1600) * 100) / 100);
      chargeCurrency = 'EUR';
    } else if (isInrGateway) {
      amountInCurrency = Math.max(1, Math.round(Number(order.total) / 18));
      chargeCurrency = 'INR';
    }

    const paymentOptions: PaymentIntentOptions = {
      orderId: Number(order.id),
      amount: amountInCurrency,
      currency: chargeCurrency,
      title: isUsdGateway
        ? `${service?.title || 'Order #' + order.id} (₦${Number(order.total).toLocaleString()} ≈ $${amountInCurrency.toFixed(2)} USD)`
        : (service?.title || `Order #${order.id}`),
      customerName: order.name,
      customerEmail: order.email,
      successUrl,
      cancelUrl,
    };

    let result;
    switch (selectedGateway) {
      case 'wallet': {
        const buyerId = order.buyer_id || order.user_id;
        if (!buyerId) {
          return NextResponse.json(
            { message: 'A valid buyer account is required to pay using in-app wallet balance.' },
            { status: 400 }
          );
        }
        const deduction = await deductWallet(buyerId, Number(order.total), order.id);
        if (!deduction.success) {
          return NextResponse.json(
            { message: deduction.message || 'Insufficient wallet balance. Please fund your wallet via Paystack to proceed.' },
            { status: 400 }
          );
        }
        result = {
          redirectUrl: successUrl,
          isDirectSuccess: true,
          gatewayOrderId: `wallet_${Date.now()}`,
        };
        break;
      }
      case 'paystack':
        result = await initializePaystack(paymentOptions);
        break;
      case 'flutterwave':
      case 'flw':
        result = await initializeFlutterwave(paymentOptions);
        break;
      case 'stripe':
        result = await createStripeCheckoutSession(paymentOptions);
        break;
      case 'paypal':
        result = await createPaypalOrder(paymentOptions);
        break;
      case 'razorpay':
        result = await createRazorpayOrder(paymentOptions);
        break;
      case 'mollie':
        result = await initializeMollie(paymentOptions);
        break;
      case 'cod':
      case 'cash_on_delivery':
      case 'manual_payment':
      default:
        result = {
          redirectUrl: successUrl,
          isDirectSuccess: true,
          gatewayOrderId: `cod_${Date.now()}`,
        };
        break;
    }

    if (result.gatewayOrderId) {
      const isPendingMethod = selectedGateway === 'cash_on_delivery' || selectedGateway === 'cod' || selectedGateway === 'manual_payment';
      await updateOrderStatus(Number(orderId), 0, {
        transaction_id: result.gatewayOrderId,
        payment_gateway: selectedGateway,
        charge_currency: chargeCurrency,
        charge_amount: amountInCurrency,
        exchange_rate: isUsdGateway ? usdExchangeRate : 1,
        payment_status: isPendingMethod ? 'pending' : 'complete',
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment checkout initiation error:', error);
    return NextResponse.json(
      { message: 'Payment processing error', error: error.message },
      { status: 500 }
    );
  }
}
