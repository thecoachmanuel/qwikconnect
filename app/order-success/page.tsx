'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FrontendLayout from '@/components/layout/FrontendLayout';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '1';
  const invoice = searchParams.get('invoice') || `INV-${orderId}`;
  const isPaid = searchParams.get('demo_paid') === '1' || !!searchParams.get('reference');
  const gateway = searchParams.get('gateway') || '';

  return (
    <FrontendLayout>
      <div className="order-success-area padding-top-80 padding-bottom-100" style={{ backgroundColor: '#f8fafc', minHeight: '65vh' }}>
        <div className="container">
          <div
            className="order-success-box text-center"
            style={{
              maxWidth: '620px',
              margin: '0 auto',
              backgroundColor: '#fff',
              padding: '50px 30px',
              borderRadius: '12px',
              boxShadow: '0 5px 25px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(29, 191, 115, 0.1)',
                color: 'var(--main-color-one)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                margin: '0 auto 25px',
              }}
            >
              <i className="las la-check"></i>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
              {isPaid ? 'Payment Confirmed & Order Placed!' : 'Order Placed Successfully!'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
              {isPaid
                ? 'Your payment was successfully received. The service provider has been notified and will contact you promptly.'
                : 'Thank you for booking with QwikConnect. Your service request has been transmitted to the provider.'}
            </p>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '14px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Order ID</span>
                <strong style={{ color: '#1e293b' }}>#{orderId}</strong>
              </div>
              <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '20px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Invoice Number</span>
                <strong style={{ color: '#1e293b' }}>{invoice}</strong>
              </div>
              <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '20px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Payment Status</span>
                {isPaid ? (
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    <i className="las la-check-circle"></i> Paid & Verified
                  </span>
                ) : (
                  <span style={{ color: '#eab308', fontWeight: 600 }}>Cash on Delivery / Pending</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link
                href="/buyer/orders"
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--main-color-one)',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                View My Orders
              </Link>
              <Link
                href="/"
                style={{
                  padding: '12px 24px',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                }}
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FrontendLayout>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center">Loading receipt...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
