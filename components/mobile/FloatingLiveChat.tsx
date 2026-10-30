'use client';

import React from 'react';

interface FloatingLiveChatProps {
  unreadCount?: number;
  onClick?: () => void;
}

export default function FloatingLiveChat({ unreadCount = 0, onClick }: FloatingLiveChatProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="position-fixed"
      style={{
        right: '20px',
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1040,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="d-block position-relative border-0 p-0 bg-transparent"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.15s ease',
          cursor: 'pointer',
        }}
        title="Live Chat"
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
      </button>
    </div>
  );
}
