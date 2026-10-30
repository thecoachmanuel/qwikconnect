/**
 * Payment Keys Resolver
 * Ensures:
 * 1. Admin-saved custom keys in DB take precedence over environment variables.
 * 2. If DB contains missing, empty, or default sample placeholder keys (e.g. from template/codecanyon),
 *    the active environment variables (e.g. from Vercel or .env) take precedence.
 * 3. Consistent detection of dummy/sample/placeholder credentials.
 */

export function isSampleOrPlaceholderKey(key: string | undefined | null): boolean {
  if (!key || typeof key !== 'string') return true;
  const trimmed = key.trim();
  if (trimmed.length === 0) return true;

  const lower = trimmed.toLowerCase();
  return (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('test_your') ||
    lower.includes('xxxx') ||
    lower.includes('2a458001d806c878aba51955b962b3c8ed78f04b') || // default paystack sample secret
    lower.includes('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b') || // default sample public
    lower.startsWith('demo_') ||
    lower === 'demo'
  );
}

/**
 * Resolves the active key: Admin DB key if real, otherwise matching environment variables.
 */
export function resolvePaymentKey(
  dbKey: string | undefined | null,
  envKeyCandidates: (string | undefined)[]
): string {
  // If Admin configured a real, non-placeholder key in DB, use it
  if (dbKey && !isSampleOrPlaceholderKey(dbKey)) {
    return dbKey.trim();
  }

  // Otherwise, inspect environment variables
  for (const envVal of envKeyCandidates) {
    if (envVal && !isSampleOrPlaceholderKey(envVal)) {
      return envVal.trim();
    }
  }

  // Fallback to whatever is available or empty
  return (dbKey || '').trim();
}

/**
 * Resolves Paystack credentials with environment variable fallback
 */
export function getPaystackCredentials(gatewayConfig?: any) {
  const secretKey = resolvePaymentKey(
    gatewayConfig?.fields?.secret_key,
    [process.env.PAYSTACK_SECRET_KEY, process.env.PAYSTACK_SECRET]
  );

  const publicKey = resolvePaymentKey(
    gatewayConfig?.fields?.public_key,
    [
      process.env.PAYSTACK_PUBLIC_KEY,
      process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    ]
  );

  const isConfigured = !isSampleOrPlaceholderKey(secretKey) && secretKey.startsWith('sk_');

  return {
    secretKey,
    publicKey,
    isConfigured,
  };
}

/**
 * Resolves Flutterwave credentials with environment variable fallback
 */
export function getFlutterwaveCredentials(gatewayConfig?: any) {
  const secretKey = resolvePaymentKey(
    gatewayConfig?.fields?.secret_key,
    [process.env.FLW_SECRET_KEY, process.env.FLUTTERWAVE_SECRET_KEY]
  );

  const publicKey = resolvePaymentKey(
    gatewayConfig?.fields?.public_key,
    [process.env.FLW_PUBLIC_KEY, process.env.NEXT_PUBLIC_FLW_KEY, process.env.FLUTTERWAVE_PUBLIC_KEY]
  );

  const isConfigured = !isSampleOrPlaceholderKey(secretKey) && (secretKey.startsWith('FLWSECK') || secretKey.startsWith('FLWSECK_TEST'));

  return {
    secretKey,
    publicKey,
    isConfigured,
  };
}

/**
 * Resolves Stripe credentials with environment variable fallback
 */
export function getStripeCredentials(gatewayConfig?: any) {
  const secretKey = resolvePaymentKey(
    gatewayConfig?.fields?.secret_key,
    [process.env.STRIPE_SECRET_KEY]
  );

  const publicKey = resolvePaymentKey(
    gatewayConfig?.fields?.public_key || gatewayConfig?.fields?.publishable_key,
    [process.env.STRIPE_PUBLIC_KEY, process.env.NEXT_PUBLIC_STRIPE_KEY, process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY]
  );

  const isConfigured = !isSampleOrPlaceholderKey(secretKey) && (secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));

  return {
    secretKey,
    publicKey,
    isConfigured,
  };
}

