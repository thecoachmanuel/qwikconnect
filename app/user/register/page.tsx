import React, { Suspense } from 'react';
import FrontendLayout from '@/components/layout/FrontendLayout';
import RegisterContent from './RegisterContent';

function RegisterFallback() {
  return (
    <div className="text-center py-5" style={{ padding: '80px 0' }}>
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default async function UserRegisterPage() {
  return (
    <FrontendLayout>
      <Suspense fallback={<RegisterFallback />}>
        <RegisterContent />
      </Suspense>
    </FrontendLayout>
  );
}
