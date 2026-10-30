export interface PaymentIntentOptions {
  orderId: number;
  amount: number;
  currency: string;
  title: string;
  description?: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentInitResult {
  redirectUrl?: string;
  gatewayOrderId?: string;
  clientSecret?: string;
  isDirectSuccess?: boolean;
  /** Paystack inline popup fields */
  publicKey?: string;
  reference?: string;
  paystackInline?: boolean;
}
