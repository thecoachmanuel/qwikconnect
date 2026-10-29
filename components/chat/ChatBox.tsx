'use client';

import React, { useState, useEffect, useRef } from 'react';
import PusherClient from 'pusher-js';

interface Message {
  id: number;
  from_user: number | string;
  to_user: number | string;
  message: string;
  image?: string;
  created_at?: string;
}

interface ChatBoxProps {
  currentUserId: number | string;
  targetUser: {
    id: number | string;
    name: string;
    username?: string;
    email?: string;
    image?: string;
  };
  onBack?: () => void;
}

export default function ChatBox({ currentUserId, targetUser, onBack }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTargetOnline, setIsTargetOnline] = useState<boolean>(true);
  const [targetLastSeen, setTargetLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPresence = async () => {
    try {
      const res = await fetch(`/api/chat/status?userId=${targetUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsTargetOnline(data.isOnline);
        setTargetLastSeen(data.lastSeen);
      }
    } catch (e) {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?userId=${targetUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchPresence();

    // Heartbeat ping
    fetch('/api/chat/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    }).catch(() => {});

    // Setup Pusher realtime subscription if key exists
    let pusher: PusherClient | null = null;
    let channel: any = null;

    if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
      pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      });

      channel = pusher.subscribe(`chat-user-${currentUserId}`);
      channel.bind('message-received', (data: Message) => {
        if (Number(data.from_user) === Number(targetUser.id)) {
          setMessages((prev) => [...prev, data]);
        }
      });
    }

    // Polling interval fallback (ensures message delivery & status updates)
    const interval = setInterval(() => {
      fetchMessages();
      fetchPresence();
    }, 4000);

    return () => {
      clearInterval(interval);
      if (channel && pusher) {
        channel.unbind_all();
        channel.unsubscribe();
      }
    };
  }, [targetUser.id, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic UI update
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      from_user: currentUserId,
      to_user: targetUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user: targetUser.id,
          message: messageText,
        }),
      });

      if (!res.ok) {
        // Rollback on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to send:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-box-card d-flex flex-column bg-white rounded-3 shadow-sm border">
      <style>{`
        .chat-box-card {
          height: 650px;
          max-height: calc(100vh - 140px);
          overflow: hidden;
        }
        @media (max-width: 991px) {
          .chat-box-card {
            height: calc(100dvh - 96px) !important;
            max-height: none !important;
            min-height: 0 !important;
          }
        }
      `}</style>
      {/* Chat Header */}
      <div className="chat-header p-2 p-sm-3 border-bottom d-flex align-items-center justify-content-between bg-white">
        <div className="d-flex align-items-center gap-2 gap-sm-3 overflow-hidden">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn btn-sm btn-light border d-lg-none d-flex align-items-center justify-content-center p-0 rounded-circle"
              style={{ width: '36px', height: '36px', flexShrink: 0, marginRight: '2px' }}
              title="Back to conversations"
              aria-label="Back to conversations"
            >
              <i className="las la-arrow-left fs-5 text-dark"></i>
            </button>
          )}
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
            style={{
              width: '42px',
              height: '42px',
              fontSize: '17px',
              backgroundColor: 'var(--main-color-one)',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {targetUser.image ? (
              <img
                src={targetUser.image}
                alt={targetUser.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              targetUser.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="overflow-hidden">
            <h6 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '15px' }}>
              {targetUser.name}
            </h6>
            <div
              className="d-flex align-items-center gap-1 small"
              style={{ fontSize: '12px', color: isTargetOnline ? '#16a34a' : '#64748b' }}
            >
              <span
                className="rounded-circle"
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: isTargetOnline ? '#16a34a' : '#94a3b8',
                  display: 'inline-block',
                  boxShadow: isTargetOnline ? '0 0 6px #16a34a' : 'none',
                  flexShrink: 0,
                }}
              ></span>
              <span>
                {isTargetOnline
                  ? 'Online'
                  : targetLastSeen
                  ? `Offline • Active ${(() => {
                      const diffSec = Math.floor((Date.now() - new Date(targetLastSeen).getTime()) / 1000);
                      if (diffSec < 60) return 'just now';
                      const diffMin = Math.floor(diffSec / 60);
                      if (diffMin < 60) return `${diffMin}m ago`;
                      const diffHr = Math.floor(diffMin / 60);
                      if (diffHr < 24) return `${diffHr}h ago`;
                      return `${Math.floor(diffHr / 24)}d ago`;
                    })()}`
                  : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        className="chat-body flex-grow-1 p-2 p-sm-3 overflow-y-auto"
        style={{ backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {loading ? (
          <div className="text-center my-auto py-5">
            <div className="spinner-border spinner-border-sm text-success" role="status"></div>
            <div className="small text-muted mt-2">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center my-auto text-muted py-5">
            <i className="las la-comments fs-1 text-secondary opacity-50"></i>
            <p className="mt-2 small">No messages yet. Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = Number(msg.from_user) === Number(currentUserId);
            return (
              <div
                key={msg.id || index}
                className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: isMe ? 'var(--main-color-one)' : '#fff',
                    color: isMe ? '#fff' : '#1e293b',
                    boxShadow: isMe
                      ? '0 2px 8px rgba(29, 191, 115, 0.25)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  <div>{msg.message}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      textAlign: isMe ? 'right' : 'left',
                      opacity: 0.75,
                      color: isMe ? '#e2e8f0' : '#94a3b8',
                    }}
                  >
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSend} className="chat-footer p-2 p-sm-3 bg-white border-top">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            style={{ borderRadius: '8px 0 0 8px', borderColor: '#e2e8f0', fontSize: '14px', padding: '10px 14px' }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn btn-success px-3 px-sm-4"
            style={{
              backgroundColor: 'var(--main-color-one)',
              borderColor: 'var(--main-color-one)',
              borderRadius: '0 8px 8px 0',
            }}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <i className="las la-paper-plane fs-5"></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
