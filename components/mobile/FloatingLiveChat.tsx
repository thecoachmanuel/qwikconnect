'use client';

import React from 'react';
import Link from 'next/link';

interface FloatingLiveChatProps {
  unreadCount?: number;
}

export default function FloatingLiveChat({ unreadCount = 0 }: FloatingLiveChatProps) {
  return (
    <div
      className="position-fixed"
      style={{
        right: '20px',
        bottom: '88px', // Floating just above bottom navigation bar
        zIndex: 1040,
      }}
    >
      <Link
        href="/buyer/live-chat"
        className="d-block position-relative text-decoration-none"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.15s ease',
        }}
      >
        <img
          src="/assets/flutter/svg/message-green.svg"
          alt="Live Chat"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {unreadCount > 0 && (
          <span
            className="position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: '-3px',
              right: '-3px',
              width: '18px',
              height: '18px',
              backgroundColor: '#F05454',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
            }}
          >
            {unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
