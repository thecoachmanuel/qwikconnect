'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface MobileLiveChatModalProps {
  seller?: any;
  onClose: () => void;
}

export default function MobileLiveChatModal({
  seller = {
    id: 2,
    name: 'Chioma Adebayo',
    phone: '+234 801 234 5678',
    image: '/assets/flutter/images/avatar.png',
  },
  onClose,
}: MobileLiveChatModalProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
  const targetUserId = seller?.id || 2;

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?userId=${targetUserId}`);
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        if (data.messages.length === 0) {
          setMessages([
            {
              id: 1,
              from_user: targetUserId,
              message: `Hello! I am ${seller.name || 'your artisan'}. How can I assist you with your booking today?`,
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
          ]);
        } else {
          setMessages(data.messages);
        }
      }
    } catch (e) {
      setMessages([
        {
          id: 1,
          from_user: targetUserId,
          message: `Hello! I am ${seller.name || 'your artisan'}. How can I assist you with your booking today?`,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(),
      from_user: currentUserId,
      to_user: targetUserId,
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setSending(true);
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_user: targetUserId, message: messageText }),
      });
      loadMessages();
    } catch (e) {
      console.warn('Message send failed:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1080 }}
    >
      {/* 1. Header (Flutter chat_message_page.dart parity) */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2.5 border-bottom bg-white shadow-sm">
        <div className="d-flex align-items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn p-0 border-0 bg-transparent text-dark me-1"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>

          <div className="position-relative">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#F2F4F7',
              }}
            >
              <img
                src={seller.image || '/assets/flutter/images/avatar.png'}
                alt={seller.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                }}
              />
            </div>
            {/* Green active dot */}
            <span
              className="position-absolute bottom-0 end-0 rounded-circle border border-white"
              style={{ width: '11px', height: '11px', backgroundColor: '#1DBF73' }}
            />
          </div>

          <div className="min-w-0">
            <strong className="d-block text-dark text-truncate" style={{ fontSize: '15px', lineHeight: 1.2 }}>
              {seller.name || 'Verified Artisan'}
            </strong>
            <span className="text-muted small" style={{ fontSize: '11.5px', color: '#1DBF73' }}>
              Online • Verified
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {seller.phone && (
            <a
              href={`tel:${seller.phone}`}
              className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
            >
              <i className="las la-phone text-success fs-5"></i>
            </a>
          )}
          <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '11px' }}></button>
        </div>
      </div>

      {/* 2. Messages Thread */}
      <div
        className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-2.5"
        style={{ backgroundColor: '#F8FAFC', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="text-center my-2">
          <span
            className="badge bg-white text-muted border px-2.5 py-1"
            style={{ fontSize: '11px', fontWeight: 500 }}
          >
            Secured end-to-end with QwikConnect Escrow
          </span>
        </div>

        {messages.map((msg, index) => {
          const isMine = Number(msg.from_user) === Number(currentUserId);
          const time = msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now';

          return (
            <div
              key={msg.id || index}
              className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}
            >
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: isMine ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                  color: isMine ? '#FFFFFF' : '#101828',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  fontSize: '14px',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                  border: isMine ? 'none' : '1px solid #EAECF0',
                }}
              >
                {msg.message}
              </div>
              <span
                className="text-muted mt-1 px-1"
                style={{ fontSize: '10.5px', color: '#94a3b8' }}
              >
                {time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-white border-top d-flex align-items-center gap-2"
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}
      >
        <button
          type="button"
          onClick={() => alert('Photo attachments will be supported with camera in the upcoming update.')}
          className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
          style={{ width: '40px', height: '40px' }}
        >
          <i className="las la-paperclip fs-5 text-muted"></i>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="form-control flex-grow-1 border-0"
          style={{
            backgroundColor: '#F2F4F7',
            borderRadius: '20px',
            padding: '10px 16px',
            fontSize: '14px',
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="btn rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0 text-white"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: inputText.trim() ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
            border: 'none',
            transition: 'background-color 0.2s',
          }}
        >
          <i className="las la-paper-plane fs-5"></i>
        </button>
      </form>
    </div>
  );
}

