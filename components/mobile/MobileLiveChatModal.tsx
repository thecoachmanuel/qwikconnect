'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface MobileLiveChatModalProps {
  seller?: any;
  onClose: () => void;
}

export default function MobileLiveChatModal({
  seller: initialSeller,
  onClose,
}: MobileLiveChatModalProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : 4;

  // Active view: either Conversations List or direct Chat Messages thread
  const [selectedSeller, setSelectedSeller] = useState<any>(initialSeller || null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Messages Thread State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [previewEnlargedImage, setPreviewEnlargedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetUserId = selectedSeller?.id || 2;

  // 1. Fetch Conversations List (Flutter ChatListPage parity)
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!selectedSeller) {
      loadConversations();
    }
  }, [selectedSeller]);

  // 2. Fetch Messages for active partner (Flutter ChatMessagePage parity)
  const loadMessages = async () => {
    if (!selectedSeller) return;
    try {
      const res = await fetch(`/api/chat/messages?userId=${targetUserId}`);
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        if (data.messages.length === 0) {
          setMessages([
            {
              id: 1,
              from_user: targetUserId,
              message: `Hello! I am ${selectedSeller.name || 'your artisan'}. How can I assist you with your booking today?`,
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
          message: `Hello! I am ${selectedSeller.name || 'your artisan'}. How can I assist you with your booking today?`,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    if (selectedSeller) {
      loadMessages();
      const interval = setInterval(loadMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedSeller, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pickedImage]);

  // Handle Photo Attachment Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPickedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pickedImage) return;

    const messageText = inputText.trim();
    const imagePayload = pickedImage;

    setInputText('');
    setPickedImage(null);

    // Optimistic message bubble
    const optimisticMsg = {
      id: Date.now(),
      from_user: currentUserId,
      to_user: targetUserId,
      message: messageText,
      attachment: imagePayload,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setSending(true);
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user: targetUserId,
          message: messageText,
          attachment: imagePayload,
        }),
      });
      loadMessages();
    } catch (e) {
      console.warn('Message send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.user?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div
      className="mobile-live-chat-modal position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1080 }}
    >
      {/* ========================================================
          VIEW A: CONVERSATIONS LIST (Flutter ChatListPage parity)
          ======================================================== */}
      {!selectedSeller ? (
        <div className="d-flex flex-column h-100 bg-white">
          {/* Top Bar */}
          <div
            className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
            style={{
              paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
              paddingBottom: '14px',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn p-0 border-0 bg-transparent text-dark"
              >
                <i className="las la-arrow-left fs-4"></i>
              </button>
              <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '20px' }}>
                Conversations
              </h4>
            </div>
            <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '12px' }}></button>
          </div>

          {/* Search Bar (Flutter ChatSearch parity) */}
          <div className="px-4 pt-3 pb-2">
            <div
              className="d-flex align-items-center bg-white px-3"
              style={{
                height: '46px',
                border: '1px solid #EAECF0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <i className="las la-search me-2 text-muted fs-5"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="form-control border-0 p-0 shadow-none text-dark bg-transparent"
                style={{ fontSize: '14px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn p-0 border-0 text-muted"
                >
                  <i className="las la-times-circle fs-5"></i>
                </button>
              )}
            </div>
          </div>

          {/* Conversations Body */}
          <div
            className="flex-grow-1 overflow-y-auto px-4 py-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {loadingConversations ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="text-muted small mt-2">Loading active chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#F2F4F7',
                    color: '#94a3b8',
                    fontSize: '32px',
                  }}
                >
                  <i className="las la-comments"></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">No Conversations Yet</h6>
                <p className="text-muted small" style={{ maxWidth: '280px', margin: '0 auto' }}>
                  Tap &ldquo;Chat with Artisan&rdquo; on any service or order to start messaging.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column">
                {filteredConversations.map((conv, idx) => {
                  const partner = conv.user || {};
                  const isOnline = partner.isOnline;
                  const avatar = partner.image || '/assets/flutter/images/avatar.png';

                  return (
                    <div
                      key={partner.id || idx}
                      onClick={() => setSelectedSeller(partner)}
                      className="d-flex align-items-center gap-3 py-3 border-bottom cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Avatar with Online Badge */}
                      <div className="position-relative flex-shrink-0">
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#F2F4F7',
                            border: '1px solid #EAECF0',
                          }}
                        >
                          <img
                            src={avatar}
                            alt={partner.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                            }}
                          />
                        </div>
                        {isOnline && (
                          <span
                            className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                            style={{ width: '12px', height: '12px', backgroundColor: '#1DBF73' }}
                          />
                        )}
                      </div>

                      {/* Info & Last message */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center justify-content-between mb-0.5">
                          <strong className="text-dark text-truncate" style={{ fontSize: '15px' }}>
                            {partner.name || 'Verified Artisan'}
                          </strong>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </div>
                        <p
                          className="text-muted mb-0 text-truncate"
                          style={{ fontSize: '13px', lineHeight: 1.3 }}
                        >
                          {conv.lastMessage || 'Tap to open chat'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           VIEW B: CHAT MESSAGE THREAD (Flutter ChatMessagePage parity)
           ======================================================== */
        <div className="d-flex flex-column h-100 bg-white">
          {/* 1. Header (Flutter ChatMessagePage AppBar parity) */}
          <div
            className="d-flex align-items-center justify-content-between px-3 border-bottom bg-white shadow-sm"
            style={{
              paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
              paddingBottom: '12px',
              zIndex: 10,
            }}
          >
            <div className="d-flex align-items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (!initialSeller) {
                    setSelectedSeller(null); // return to Conversations
                  } else {
                    onClose();
                  }
                }}
                className="btn p-0 border-0 bg-transparent text-dark me-1"
              >
                <i className="las la-arrow-left fs-4"></i>
              </button>

              <div className="position-relative flex-shrink-0">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: '#F2F4F7',
                    border: '1.5px solid #EAECF0',
                  }}
                >
                  <img
                    src={selectedSeller.image || '/assets/flutter/images/avatar.png'}
                    alt={selectedSeller.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                    }}
                  />
                </div>
                <span
                  className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                  style={{ width: '11px', height: '11px', backgroundColor: '#1DBF73' }}
                />
              </div>

              <div className="min-w-0">
                <strong className="d-block text-dark text-truncate" style={{ fontSize: '15px', lineHeight: 1.2 }}>
                  {selectedSeller.name || 'Verified Artisan'}
                </strong>
                <span className="small d-block text-truncate" style={{ fontSize: '11.5px', color: '#1DBF73' }}>
                  Online • Verified Provider
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              {selectedSeller.phone && (
                <a
                  href={`tel:${selectedSeller.phone}`}
                  className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                  title="Call Artisan"
                >
                  <i className="las la-phone text-success fs-5"></i>
                </a>
              )}
              <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '11px' }}></button>
            </div>
          </div>

          {/* 2. Messages Stream */}
          <div
            className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-2.5"
            style={{
              backgroundColor: '#F8FAFC',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Escrow Trust Tag */}
            <div className="text-center my-1.5">
              <span
                className="badge bg-white text-muted border px-2.5 py-1"
                style={{ fontSize: '11px', fontWeight: 500, borderRadius: '12px' }}
              >
                <i className="las la-shield-alt text-success me-1"></i>
                Protected with QwikConnect Escrow Guarantee
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
                  {/* Photo attachment if present */}
                  {msg.attachment && (
                    <div
                      className="mb-1 cursor-pointer"
                      onClick={() => setPreviewEnlargedImage(msg.attachment)}
                      style={{
                        maxWidth: '220px',
                        borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        overflow: 'hidden',
                        border: '1.5px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      <img
                        src={msg.attachment}
                        alt="Attachment"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Text Message Bubble (Flutter 20px radius parity) */}
                  {Boolean(msg.message && msg.message.trim().length > 0) && (
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '12px 16px',
                        borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        backgroundColor: isMine ? 'var(--main-color-one, #1DBF73)' : '#E5E7EB',
                        color: isMine ? '#FFFFFF' : '#1F2937',
                        fontSize: '14.5px',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      {msg.message}
                    </div>
                  )}

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

          {/* 3. Attachment Preview Chip (Flutter pickedImage parity) */}
          {pickedImage && (
            <div className="px-3 pt-2 bg-white border-top d-flex align-items-center gap-2">
              <div className="position-relative" style={{ width: '48px', height: '48px' }}>
                <img
                  src={pickedImage}
                  alt="Picked attachment"
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <button
                  type="button"
                  onClick={() => setPickedImage(null)}
                  className="position-absolute top-0 end-0 rounded-circle text-white border-0 d-flex align-items-center justify-content-center"
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#F05454',
                    transform: 'translate(40%, -40%)',
                    fontSize: '10px',
                  }}
                >
                  ✕
                </button>
              </div>
              <span className="text-muted small" style={{ fontSize: '12px' }}>
                Ready to send photo
              </span>
            </div>
          )}

          {/* 4. Bottom Message Input Bar (Flutter chat_message_page.dart parity) */}
          <form
            onSubmit={handleSendMessage}
            className="px-3 pt-2 bg-white border-top d-flex align-items-center gap-2"
            style={{
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
            }}
          >
            {/* Hidden File Input for Attachments */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
              style={{ width: '42px', height: '42px', backgroundColor: '#F2F4F7' }}
              title="Attach photo"
            >
              <i className="las la-paperclip fs-5 text-muted"></i>
            </button>

            {/* Text Input (hintText: "Write message...") */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write message..."
              className="form-control flex-grow-1 border-0 shadow-none text-dark"
              style={{
                backgroundColor: '#F2F4F7',
                borderRadius: '24px',
                padding: '10px 18px',
                fontSize: '14.5px',
              }}
            />

            {/* Circular Send FloatingActionButton (cc.primaryColor) */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !pickedImage) || sending}
              className="btn rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0 text-white shadow-sm"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: (inputText.trim() || pickedImage) ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
                border: 'none',
                transition: 'background-color 0.2s',
              }}
            >
              <i className="las la-paper-plane fs-5"></i>
            </button>
          </form>

          {/* Fullscreen Photo Enlarged Preview Modal */}
          {previewEnlargedImage && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1090 }}
              onClick={() => setPreviewEnlargedImage(null)}
            >
              <div className="position-relative" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                <img
                  src={previewEnlargedImage}
                  alt="Enlarged"
                  style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }}
                />
                <button
                  type="button"
                  onClick={() => setPreviewEnlargedImage(null)}
                  className="btn btn-light rounded-circle position-absolute top-0 end-0 m-2"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
