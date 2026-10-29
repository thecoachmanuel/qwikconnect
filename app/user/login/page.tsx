import React, { Suspense } from 'react';
import FrontendLayout from '@/components/layout/FrontendLayout';
import LoginContent from './LoginContent';

function LoginFallback() {
  return (
    <div className="text-center py-5" style={{ padding: '80px 0' }}>
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}


export default async function UserLoginPage() {
  return (
    <FrontendLayout>
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </FrontendLayout>
  );
}
