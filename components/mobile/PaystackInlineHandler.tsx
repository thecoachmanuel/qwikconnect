'use client';

/**
 * PaystackInlineHandler
 * ---------------------
 * Dynamically loads the Paystack Inline JS (https://js.paystack.co/v1/inline.js)
 * and opens the payment popup in-app — no page redirect, no PWA exit.
 *
 * Usage:
 *   openPaystackPopup({
 *     publicKey, reference, email, amount, // amount in NAIRA (we convert to kobo internally)
 *     onSuccess: (ref) => ...,
 *     onCancel: () => ...
 *   })
 */

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackPopOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackPopOptions {
  key: string;
  email: string;
  amount: number; // in kobo
  ref: string;
  currency?: string;
  callback: (response: { reference: string; status: string }) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
}

export interface OpenPaystackOptions {
  publicKey: string;
  reference: string;
  email: string;
  /** Amount in Naira — we convert to kobo */
  amountNaira: number;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

let scriptLoading: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.PaystackPop) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('paystack-inline-js');
    if (existing) {
      // Already injected — wait for it to set window.PaystackPop
      const poll = setInterval(() => {
        if (window.PaystackPop) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack inline JS'));
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export async function openPaystackPopup(opts: OpenPaystackOptions): Promise<void> {
  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error('Paystack inline library failed to load. Please check your internet connection and try again.');
  }

  const handler = window.PaystackPop.setup({
    key: opts.publicKey,
    email: opts.email,
    amount: Math.round(opts.amountNaira * 100), // naira → kobo
    ref: opts.reference,
    currency: 'NGN',
    metadata: opts.metadata,
    callback: (response) => {
      opts.onSuccess(response.reference || opts.reference);
    },
    onClose: () => {
      opts.onCancel();
    },
  });

  handler.openIframe();
}

