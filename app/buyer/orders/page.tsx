import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import { getOrders, getReviews } from '@/lib/mongodb';
import BuyerReviewModal from '@/components/reviews/BuyerReviewModal';

export default async function BuyerOrdersPage() {
  const session = await auth();
  const buyerId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;
  const buyerEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : undefined;

  let orders: any[] = [];
  let userReviews: any[] = [];
  if (buyerId || buyerEmail) {
    try {
      const [fetchedOrders, fetchedReviews] = await Promise.all([
        getOrders({ buyer_id: buyerId }),
        buyerId ? getReviews({ buyer_id: buyerId }) : Promise.resolve([]),
      ]);
      orders = (fetchedOrders || []).filter((o: any) => {
        if (buyerId && Number(o.buyer_id) === buyerId) return true;
        if (buyerEmail && ((o.email && o.email.toLowerCase().trim() === buyerEmail) || (o.buyer_email && o.buyer_email.toLowerCase().trim() === buyerEmail))) return true;
        return false;
      });
      userReviews = fetchedReviews || [];
    } catch (error) {
      console.warn('Failed to load buyer orders or reviews from MongoDB:', error);
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b45309' }}></span>
            Pending
          </span>
        );
      case 1:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0369a1' }}></span>
            In Progress
          </span>
        );
      case 2:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
            Completed
          </span>
        );
      case 3:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7e22ce' }}></span>
            Delivered
          </span>
        );
      default:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b91c1c' }}></span>
            Cancelled
          </span>
        );
    }
  };

  return (
    <DashboardLayout userRole="buyer" userName={session?.user?.name || 'Buyer'} title="My Booked Orders">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header Bar */}
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
              My Orders & Service Bookings
            </h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0' }}>
              Track order fulfillment, chat directly with service providers, and view invoices.
            </p>
          </div>

          <Link
            href="/service-list"
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--main-color-one, #1DBF73)',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(29, 191, 115, 0.2)',
            }}
          >
            <i className="las la-search"></i>
            Browse More Services
          </Link>
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
            <i className="las la-calendar-times" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '14px' }}></i>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              No service orders placed yet
            </h4>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
              Explore certified technicians, cleaners, plumbers, and beauty experts on QwikConnect and book your first service!
            </p>
            <Link
              href="/service-list"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Explore Services
            </Link>
          </div>
        ) : (
          <>
            {/* 1. Desktop Table View (Hidden on Mobile) */}
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
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Service Details</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Scheduled Window</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord: any) => {
                      const serviceTitle = ord.service?.title || 'Service Booking';
                      const serviceSlug = ord.service?.slug || '';
                      const serviceImg = ord.service?.image || '/assets/uploads/media-uploader/banner11638279446.png';
                      const sellerName = ord.seller?.name || 'Verified Provider';
                      const sellerId = ord.seller_id || ord.seller?.id || 2;

                      return (
                        <tr key={String(ord.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1e293b' }}>
                            <Link href={`/buyer/orders/${ord.id}`} style={{ color: '#1e293b', textDecoration: 'none' }}>
                              #{ord.id}
                            </Link>
                            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                              {ord.invoice || `INV-${ord.id}`}
                            </span>
                          </td>

                          <td style={{ padding: '16px 20px', minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid #e2e8f0' }}>
                                <Image
                                  src={serviceImg}
                                  alt={serviceTitle}
                                  fill
                                  sizes="48px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <Link
                                  href={`/service-list/${serviceSlug}`}
                                  style={{
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    fontSize: '13.5px',
                                    textDecoration: 'none',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '240px',
                                  }}
                                  title={serviceTitle}
                                >
                                  {serviceTitle}
                                </Link>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  Provider: <strong style={{ color: '#334155' }}>{sellerName}</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', color: '#475569', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              <i className="las la-calendar me-1" style={{ color: 'var(--main-color-one, #1DBF73)' }}></i>
                              {ord.date}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              <i className="lar la-clock me-1"></i>
                              {ord.schedule}
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>
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

                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {getStatusBadge(Number(ord.status ?? 0))}
                          </td>

                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {/* Chat with Seller */}
                              <Link
                                href={`/buyer/live-chat?user=${sellerId}`}
                                title={`Chat with ${sellerName}`}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(29, 191, 115, 0.1)',
                                  color: 'var(--main-color-one, #1DBF73)',
                                  fontSize: '12.5px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="las la-comments" style={{ fontSize: '16px' }}></i>
                                <span>Chat</span>
                              </Link>

                              {/* Official Invoice */}
                              <Link
                                href={`/orders/invoice/${ord.id}`}
                                target="_blank"
                                title="View & Download Official Invoice"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="las la-file-invoice" style={{ fontSize: '16px' }}></i>
                                <span>Invoice</span>
                              </Link>

                              {/* Order Details */}
                              <Link
                                href={`/buyer/orders/${ord.id}`}
                                title="View Full Order Details"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0f172a',
                                  color: '#fff',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                Details
                              </Link>

                              {/* Review Seller (Qixer PHP Parity for Completed Bookings) */}
                              {Number(ord.status) === 2 && (
                                <BuyerReviewModal
                                  orderId={ord.id}
                                  serviceId={ord.service_id}
                                  sellerId={sellerId}
                                  serviceTitle={serviceTitle}
                                  sellerName={sellerName}
                                  existingRating={userReviews.find((r: any) => String(r.order_id) === String(ord.id) && Number(r.type ?? 1) === 1)?.rating}
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

            {/* 2. Mobile Responsive Card View (Phones and Tablets <768px) */}
            <div className="d-block d-md-none" style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                {orders.map((ord: any) => {
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
                      {/* Top Bar: Order ID & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                            Order #{ord.id}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
                            {ord.invoice || `INV-${ord.id}`}
                          </span>
                        </div>
                        {getStatusBadge(Number(ord.status ?? 0))}
                      </div>

                      {/* Service Info Block */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                          <Image src={serviceImg} alt={serviceTitle} fill sizes="46px" style={{ objectFit: 'cover' }} />
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
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            Provider: <strong style={{ color: '#334155' }}>{sellerName}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Schedule & Price Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#475569', marginBottom: '14px' }}>
                        <div>
                          <div><i className="las la-calendar me-1" style={{ color: 'var(--main-color-one)' }}></i>{ord.date}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}><i className="lar la-clock me-1"></i>{ord.schedule}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                            ₦{Number(ord.total || 0).toLocaleString()}
                          </div>
                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: ord.payment_status === 'complete' ? '#15803d' : '#b45309' }}>
                            {ord.payment_status === 'complete' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions Button Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <Link
                          href={`/buyer/live-chat?user=${sellerId}`}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(29, 191, 115, 0.1)',
                            color: 'var(--main-color-one, #1DBF73)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                            padding: '8px 4px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="las la-file-invoice" style={{ fontSize: '15px' }}></i>
                          <span>Invoice</span>
                        </Link>

                        <Link
                          href={`/buyer/orders/${ord.id}`}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          Details
                        </Link>
                      </div>

                      {/* Review Seller (Mobile Card Parity) */}
                      {Number(ord.status) === 2 && (
                        <div style={{ marginTop: '10px' }}>
                          <BuyerReviewModal
                            orderId={ord.id}
                            serviceId={ord.service_id}
                            sellerId={sellerId}
                            serviceTitle={serviceTitle}
                            sellerName={sellerName}
                            existingRating={userReviews.find((r: any) => String(r.order_id) === String(ord.id) && Number(r.type ?? 1) === 1)?.rating}
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
