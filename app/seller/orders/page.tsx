import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import { getOrders, getReviews } from '@/lib/mongodb';
import SellerRateBuyerModal from '@/components/reviews/SellerRateBuyerModal';

interface SellerOrdersProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function SellerOrdersPage({ searchParams }: SellerOrdersProps) {
  const session = await auth();
  const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status;

  let orders: any[] = [];
  let sellerReviews: any[] = [];
  try {
    const [allSellerOrders, fetchedReviews] = await Promise.all([
      getOrders({ seller_id: sellerId }),
      getReviews({ seller_id: sellerId, type: 0 }),
    ]);
    sellerReviews = fetchedReviews || [];
    if (statusFilter !== undefined && statusFilter !== '') {
      const sNum = parseInt(statusFilter, 10);
      orders = allSellerOrders.filter((o: any) => o.status === sNum);
    } else {
      orders = allSellerOrders;
    }
  } catch (error) {
    console.warn('Failed to load seller orders from MongoDB:', error);
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 700 }}>Pending</span>;
      case 1:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 700 }}>In Progress</span>;
      case 2:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700 }}>Completed</span>;
      case 3:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '12px', fontWeight: 700 }}>Delivered</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>Cancelled</span>;
    }
  };

  return (
    <DashboardLayout userRole="seller" userName={session?.user?.name || 'Seller'} title="Customer Orders">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header & Filter Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
              Customer Service Orders
            </h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0' }}>
              Track service bookings, update job fulfillment progress, and message buyers.
            </p>
          </div>

          {/* Status Filter Badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Link
              href="/seller/orders"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: statusFilter === undefined ? 700 : 500,
                backgroundColor: statusFilter === undefined ? 'var(--main-color-one, #1DBF73)' : '#fff',
                color: statusFilter === undefined ? '#fff' : '#334155',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
              }}
            >
              All
            </Link>
            <Link
              href="/seller/orders?status=0"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: statusFilter === '0' ? 700 : 500,
                backgroundColor: statusFilter === '0' ? 'var(--main-color-one, #1DBF73)' : '#fff',
                color: statusFilter === '0' ? '#fff' : '#334155',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
              }}
            >
              Pending
            </Link>
            <Link
              href="/seller/orders?status=1"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: statusFilter === '1' ? 700 : 500,
                backgroundColor: statusFilter === '1' ? 'var(--main-color-one, #1DBF73)' : '#fff',
                color: statusFilter === '1' ? '#fff' : '#334155',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
              }}
            >
              In Progress
            </Link>
            <Link
              href="/seller/orders?status=2"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: statusFilter === '2' ? 700 : 500,
                backgroundColor: statusFilter === '2' ? 'var(--main-color-one, #1DBF73)' : '#fff',
                color: statusFilter === '2' ? '#fff' : '#334155',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
              }}
            >
              Completed
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <i className="las la-clipboard-list" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>No orders found</h4>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No orders currently match the selected filter.</p>
          </div>
        ) : (
          <>
            {/* 1. Desktop Table View */}
            <div
              className="d-none d-md-block"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                marginBottom: '24px',
              }}
            >
              <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Order #</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Client</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Service</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Schedule</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord: any) => {
                      const clientName = ord.name || ord.buyer?.name || 'Customer';
                      const buyerId = ord.buyer_id || ord.buyer?.id || 4;
                      const serviceTitle = ord.service?.title || 'Service Booking';
                      const serviceImg = ord.service?.image || '/assets/uploads/media-uploader/banner11638279446.png';

                      return (
                        <tr key={String(ord.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1e293b' }}>
                            <Link href={`/seller/orders/${ord.id}`} style={{ color: '#1e293b', textDecoration: 'none' }}>
                              #{ord.id}
                            </Link>
                            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>{ord.invoice || `INV-${ord.id}`}</span>
                          </td>

                          <td style={{ padding: '16px 20px' }}>
                            <strong style={{ color: '#1e293b' }}>{clientName}</strong>
                            <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{ord.phone || 'No phone'}</span>
                          </td>

                          <td style={{ padding: '16px 20px', minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                <Image src={serviceImg} alt={serviceTitle} fill sizes="36px" style={{ objectFit: 'cover' }} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {serviceTitle}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', color: '#475569', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.date}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{ord.schedule}</div>
                          </td>

                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>
                              ₦{Number(ord.total || 0).toLocaleString()}
                            </div>
                            <span style={{ fontSize: '11px', color: ord.payment_status === 'complete' ? '#15803d' : '#b45309', fontWeight: 600, textTransform: 'capitalize' }}>
                              {ord.payment_gateway?.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {getStatusBadge(Number(ord.status ?? 0))}
                          </td>

                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Link
                                href={`/seller/live-chat?user=${buyerId}`}
                                title={`Chat with ${clientName}`}
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
                                href={`/seller/orders/${ord.id}`}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '5px',
                                  backgroundColor: '#0f172a',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                Manage
                              </Link>

                              {/* Rate Buyer Feedback (Qixer PHP Parity for Completed Bookings) */}
                              {Number(ord.status) === 2 && (
                                <SellerRateBuyerModal
                                  orderId={ord.id}
                                  serviceId={ord.service_id}
                                  sellerId={sellerId}
                                  buyerId={buyerId}
                                  buyerName={clientName}
                                  existingRating={sellerReviews.find((r: any) => String(r.order_id) === String(ord.id) && Number(r.type) === 0)?.rating}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Mobile Responsive Card View (<768px) */}
            <div className="d-block d-md-none" style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {orders.map((ord: any) => {
                  const clientName = ord.name || ord.buyer?.name || 'Customer';
                  const buyerId = ord.buyer_id || ord.buyer?.id || 4;
                  const serviceTitle = ord.service?.title || 'Service Booking';

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
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                            Order #{ord.id}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
                            Client: <strong style={{ color: '#334155' }}>{clientName}</strong>
                          </span>
                        </div>
                        {getStatusBadge(Number(ord.status ?? 0))}
                      </div>

                      <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '12.5px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>{serviceTitle}</div>
                        <div style={{ color: '#64748b' }}><i className="las la-calendar me-1"></i>{ord.date} &bull; {ord.schedule}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b' }}>Total Payout:</span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                          ₦{Number(ord.total || 0).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <Link
                          href={`/seller/live-chat?user=${buyerId}`}
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
                          href={`/seller/orders/${ord.id}`}
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
                          Manage
                        </Link>
                      </div>

                      {/* Rate Buyer Feedback (Mobile Card Parity) */}
                      {Number(ord.status) === 2 && (
                        <div style={{ marginTop: '10px' }}>
                          <SellerRateBuyerModal
                            orderId={ord.id}
                            serviceId={ord.service_id}
                            sellerId={sellerId}
                            buyerId={buyerId}
                            buyerName={clientName}
                            existingRating={sellerReviews.find((r: any) => String(r.order_id) === String(ord.id) && Number(r.type) === 0)?.rating}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
