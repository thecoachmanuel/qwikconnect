import { PaymentIntentOptions, PaymentInitResult } from './types';
import { getPaymentGateways } from '@/lib/mongodb';
import { getPaystackCredentials } from './keys';

export async function initializePaystack(options: PaymentIntentOptions): Promise<PaymentInitResult> {
  let pstkConfig: any = null;

  try {
    const gateways = await getPaymentGateways();
    pstkConfig = (gateways as any[]).find((g: any) => g.id === 'paystack');
    if (pstkConfig && pstkConfig.enabled === false) {
      throw new Error('Paystack payment gateway is currently disabled by administrator.');
    }
  } catch (err: any) {
    if (err.message?.includes('disabled')) throw err;
  }

  const { secretKey, publicKey, isConfigured } = getPaystackCredentials(pstkConfig);
  const isLive = pstkConfig?.sandbox === false;

  if (!isConfigured) {
    if (isLive) {
      throw new Error('Paystack live payment credentials not configured. Please enter your live Public & Secret keys in Admin Payment Settings.');
    }
    return {
      redirectUrl: `${options.successUrl}&demo_paid=1&gateway=paystack`,
      isDirectSuccess: true,
      gatewayOrderId: `demo_pstk_${Date.now()}`,
    };
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: options.customerEmail || 'customer@qwikconnect.ng',
        amount: Math.round(options.amount * 100), // in kobo
        reference: `order_${options.orderId}_${Date.now()}`,
        callback_url: options.successUrl,
        metadata: {
          order_id: options.orderId,
          customer_name: options.customerName,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: options.orderId,
            },
          ],
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.status) {
      if (isLive) {
        throw new Error(data.message || 'Paystack live payment initialization failed. Please check credentials or customer details.');
      }
      console.warn('Paystack API error in sandbox, falling back to simulated completion:', data);
      return {
        redirectUrl: `${options.successUrl}&demo_paid=1&gateway=paystack`,
        isDirectSuccess: true,
        gatewayOrderId: `demo_pstk_${Date.now()}`,
      };
    }

    return {
      redirectUrl: data.data?.authorization_url || options.successUrl,
      gatewayOrderId: data.data?.reference,
    };
  } catch (error: any) {
    if (isLive) {
      throw error;
    }
    console.warn('Paystack network error in sandbox:', error.message);
    return {
      redirectUrl: `${options.successUrl}&demo_paid=1&gateway=paystack`,
      isDirectSuccess: true,
      gatewayOrderId: `demo_pstk_${Date.now()}`,
    };
  }
}
