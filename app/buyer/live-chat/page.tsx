'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ChatBox from '@/components/chat/ChatBox';

function BuyerLiveChatContent() {
  const sessionRes = useSession();
  const session = sessionRes?.data;
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        const res = await fetch('/api/chat/conversations');
        if (res.ok) {
          const json = await res.json();
          const convList = json.conversations || [];
          setConversations(convList);

          if (queryUserId) {
            const found = convList.find((c: any) => String(c.user.id) === queryUserId);
            if (found) {
              setSelectedUser(found.user);
              setMobileView('chat');
            } else {
              const userRes = await fetch(`/api/chat/messages?userId=${queryUserId}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.targetUser) {
                  setSelectedUser(userData.targetUser);
                  setMobileView('chat');
                }
              }
            }
          } else if (convList.length > 0) {
            setSelectedUser(convList[0].user);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      loadConversations();
    }
  }, [session?.user?.id, queryUserId]);

  const currentUserId = session?.user?.id || '1';

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setMobileView('chat');
  };

  return (
    <DashboardLayout userRole="buyer" title="Live Chat & Messages">
      <style>{`
        .chat-page-card {
          height: 650px;
          max-height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 991px) {
          .chat-page-card {
            height: calc(100dvh - 96px) !important;
            max-height: none !important;
            min-height: 0 !important;
          }
        }
      `}</style>
      <div className="row g-4">
        {/* Left Column: Conversations List */}
        <div className={`col-lg-4 ${mobileView === 'chat' ? 'd-none d-lg-block' : 'col-12'}`}>
          <div className="card border-0 shadow-sm rounded-3 bg-white chat-page-card">
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="fw-bold mb-0">Conversations</h6>
            </div>
            <div className="card-body p-0 flex-grow-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                </div>
              ) : conversations.length === 0 && !selectedUser ? (
                <div className="text-center text-muted py-5 px-3">
                  <i className="las la-inbox fs-2 text-secondary opacity-50"></i>
                  <p className="mt-2 small">No active conversations found.</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {selectedUser && !conversations.some((c) => String(c.user.id) === String(selectedUser.id)) && (
                    <li
                      onClick={() => handleSelectUser(selectedUser)}
                      className="list-group-item list-group-item-action p-3 border-bottom active-chat"
                      style={{ cursor: 'pointer', backgroundColor: '#f0fdf4' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold position-relative"
                          style={{ width: '40px', height: '40px', flexShrink: 0, overflow: 'hidden' }}
                        >
                          {selectedUser.image ? (
                            <img src={selectedUser.image} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            selectedUser.name?.[0]?.toUpperCase() || 'S'
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: selectedUser.isOnline ? '#22c55e' : '#94a3b8',
                              border: '2px solid #fff',
                            }}
                            title={selectedUser.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: '14px' }}>
                            {selectedUser.name}
                          </h6>
                          <small className="text-muted text-truncate d-block" style={{ fontSize: '12px' }}>
                            Service Provider
                          </small>
                        </div>
                      </div>
                    </li>
                  )}

                  {conversations.map((c) => {
                    const isSelected = selectedUser && String(selectedUser.id) === String(c.user.id);
                    return (
                      <li
                        key={c.user.id}
                        onClick={() => handleSelectUser(c.user)}
                        className="list-group-item list-group-item-action p-3 border-bottom"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          borderLeft: isSelected ? '4px solid var(--main-color-one)' : 'none',
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-success border position-relative"
                            style={{ width: '40px', height: '40px', flexShrink: 0, overflow: 'hidden' }}
                          >
                            {c.user.image ? (
                              <img src={c.user.image} alt={c.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              c.user.name?.[0]?.toUpperCase() || 'U'
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: c.user.isOnline ? '#22c55e' : '#94a3b8',
                                border: '2px solid #fff',
                              }}
                              title={c.user.isOnline ? 'Online' : 'Offline'}
                            />
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 fw-semibold text-dark text-truncate" style={{ fontSize: '14px' }}>
                                {c.user.name}
                              </h6>
                              {c.lastMessageTime && (
                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                  {new Date(c.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </small>
                              )}
                            </div>
                            <small className="text-muted text-truncate d-block mt-1" style={{ fontSize: '12px' }}>
                              {c.lastMessage || 'Sent a message'}
                            </small>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className={`col-lg-8 ${mobileView === 'list' ? 'd-none d-lg-block' : 'col-12'}`}>
          {selectedUser ? (
            <ChatBox
              currentUserId={currentUserId}
              targetUser={selectedUser}
              onBack={() => setMobileView('list')}
            />
          ) : (
            <div
              className="card border-0 shadow-sm rounded-3 bg-white d-flex align-items-center justify-content-center text-center p-5 text-muted chat-page-card"
            >
              <i className="las la-comments fs-1 opacity-25"></i>
              <h5 className="mt-3">No Chat Selected</h5>
              <p className="small">Select a conversation from the left to start messaging with the service provider.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BuyerLiveChatPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout userRole="buyer" title="Live Chat & Messages">
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading chat...</span>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <BuyerLiveChatContent />
    </Suspense>
  );
}
