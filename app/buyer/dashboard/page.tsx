import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import { getOrders } from '@/lib/mongodb';

export default async function BuyerDashboardPage() {
  const session = await auth();
  const buyerId = session?.user?.id ? parseInt(session.user.id, 10) : 4;

  let activeOrders = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let totalSpent = 0;
  let recentOrders: any[] = [];

  try {
    const orders = await getOrders({ buyer_id: buyerId });
    recentOrders = orders.slice(0, 6);
    activeOrders = orders.filter((o: any) => o.status === 1).length;
    pendingOrders = orders.filter((o: any) => o.status === 0).length;
    completedOrders = orders.filter((o: any) => o.status === 2).length;
    totalSpent = orders
      .filter((o: any) => o.payment_status === 'complete' || o.status === 2)
      .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  } catch (error) {
    console.warn('Failed to load buyer stats from MongoDB:', error);
  }


  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 600 }}>Pending</span>;
      case 1:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 600 }}>In Progress</span>;
      case 2:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 600 }}>Completed</span>;
      case 3:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '12px', fontWeight: 600 }}>Delivered</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>Cancelled</span>;
    }
  };

  return (
    <DashboardLayout
      userType="buyer"
      userName={session?.user?.name || 'Buyer'}
      userImage={session?.user?.image}
    >
      {/* 4 Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Bookings</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#0284c7' }}>{activeOrders}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '24px' }}>
                <i className="las la-hourglass-half"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Requests</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#eab308' }}>{pendingOrders}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', fontSize: '24px' }}>
                <i className="las la-clock"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completed Services</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: 'var(--main-color-one)' }}>{completedOrders}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(29, 191, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--main-color-one)', fontSize: '24px' }}>
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Spent</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#1e293b' }}>₦{totalSpent.toLocaleString()}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '24px' }}>
                <i className="las la-shopping-cart"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          My Service Bookings
        </h3>
        <Link
          href="/service-list"
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--main-color-one)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className="las la-search"></i> Book a New Service
        </Link>
      </div>

      {/* Orders Table */}
      {/* Orders Section (Desktop Table + Mobile Cards) */}
      {recentOrders.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '48px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <i className="las la-calendar-times" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
          <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>No service orders placed yet</p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Browse verified service providers on QwikConnect to place your first booking.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div
            className="d-none d-md-block"
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Order ID</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Service Details</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Scheduled Window</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord: any) => {
                    const serviceTitle = ord.service?.title || 'Service Booking';
                    const serviceSlug = ord.service?.slug || '';
                    const serviceImg = ord.service?.image || '/assets/uploads/media-uploader/banner11638279446.png';
                    const sellerName = ord.seller?.name || 'Verified Provider';
                    const sellerId = ord.seller_id || ord.seller?.id || 2;

                    return (
                      <tr key={String(ord.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                          <Link href={`/buyer/orders/${ord.id}`} style={{ color: '#1e293b', textDecoration: 'none' }}>
                            #{ord.id}
                          </Link>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                            {ord.invoice || `INV-${ord.id}`}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid #e2e8f0' }}>
                              <Image src={serviceImg} alt={serviceTitle} fill sizes="42px" style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <Link
                                href={`/service-list/${serviceSlug}`}
                                style={{
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  fontSize: '13px',
                                  textDecoration: 'none',
                                  display: 'block',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '200px',
                                }}
                                title={serviceTitle}
                              >
                                {serviceTitle}
                              </Link>
                              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                By: <strong style={{ color: '#334155' }}>{sellerName}</strong>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', color: '#475569', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.date}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{ord.schedule}</div>
                        </td>

                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14.5px' }}>
                            ₦{Number(ord.total || 0).toLocaleString()}
                          </div>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              backgroundColor: ord.payment_status === 'complete' ? '#dcfce7' : '#fef3c7',
                              color: ord.payment_status === 'complete' ? '#15803d' : '#b45309',
                              textTransform: 'capitalize',
                            }}
                          >
                            {ord.payment_status || 'Pending'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          {getStatusBadge(Number(ord.status ?? 0))}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              href={`/buyer/live-chat?user=${sellerId}`}
                              title={`Chat with ${sellerName}`}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '5px',
                                backgroundColor: 'rgba(29, 191, 115, 0.1)',
                                color: 'var(--main-color-one, #1DBF73)',
                                fontSize: '12px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="las la-comments" style={{ fontSize: '15px' }}></i>
                              <span>Chat</span>
                            </Link>

                            <Link
                              href={`/orders/invoice/${ord.id}`}
                              target="_blank"
                              title="Official Invoice"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '5px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <i className="las la-file-invoice"></i>
                              <span>Invoice</span>
                            </Link>

                            <Link
                              href={`/buyer/orders/${ord.id}`}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '5px',
                                backgroundColor: '#0f172a',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                              }}
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards (Phones <768px) */}
          <div className="d-block d-md-none" style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {recentOrders.map((ord: any) => {
                const serviceTitle = ord.service?.title || 'Service Booking';
                const serviceSlug = ord.service?.slug || '';
                const serviceImg = ord.service?.image || '/assets/uploads/media-uploader/banner11638279446.png';
                const sellerName = ord.seller?.name || 'Verified Provider';
                const sellerId = ord.seller_id || ord.seller?.id || 2;

                return (
                  <div
                    key={String(ord.id)}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                        Order #{ord.id}
                      </span>
                      {getStatusBadge(Number(ord.status ?? 0))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                        <Image src={serviceImg} alt={serviceTitle} fill sizes="42px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link
                          href={`/service-list/${serviceSlug}`}
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#1e293b',
                            textDecoration: 'none',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {serviceTitle}
                        </Link>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>By: {sellerName}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      <div>
                        <div>{ord.date}</div>
                        <div>{ord.schedule}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                          ₦{Number(ord.total || 0).toLocaleString()}
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: ord.payment_status === 'complete' ? '#15803d' : '#b45309' }}>
                          {ord.payment_status === 'complete' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <Link
                        href={`/buyer/live-chat?user=${sellerId}`}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '5px',
                          backgroundColor: 'rgba(29, 191, 115, 0.1)',
                          color: 'var(--main-color-one, #1DBF73)',
                          fontSize: '12px',
                          fontWeight: 700,
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                        }}
                      >
                        <i className="las la-comments"></i> Chat
                      </Link>
                      <Link
                        href={`/orders/invoice/${ord.id}`}
                        target="_blank"
                        style={{
                          padding: '7px 4px',
                          borderRadius: '5px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                        }}
                      >
                        <i className="las la-file-invoice"></i> Invoice
                      </Link>
                      <Link
                        href={`/buyer/orders/${ord.id}`}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '5px',
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
