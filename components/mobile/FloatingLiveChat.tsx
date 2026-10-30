'use client';

import React from 'react';
import Link from 'next/link';

interface FloatingLiveChatProps {
  unreadCount?: number;
  onClick?: () => void;
}

export default function FloatingLiveChat({ unreadCount = 0, onClick }: FloatingLiveChatProps) {
  return (
    <Link
      href="/buyer/live-chat"
      onClick={onClick}
      className="position-fixed d-flex align-items-center justify-content-center shadow-lg text-white text-decoration-none"
      style={{
        bottom: '80px',
        right: '18px',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: 'var(--main-color-one, #1DBF73)',
        zIndex: 1025,
        boxShadow: '0 6px 20px rgba(29, 191, 115, 0.4)',
        transition: 'transform 0.15s ease',
      }}
      aria-label="Live Chat with Artisans"
    >
      <i className="las la-comments" style={{ fontSize: '26px' }}></i>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '10px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 0 2px #fff',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

