import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import { getOrders, getServices } from '@/lib/mongodb';

export default async function SellerDashboardPage() {
  const session = await auth();
  const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

  let activeOrders = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let totalServices = 0;
  let totalEarnings = 0;
  let recentOrders: any[] = [];

  try {
    const [orders, services] = await Promise.all([
      getOrders({ seller_id: sellerId }),
      getServices({ seller_id: sellerId }),
    ]);

    totalServices = services.length;
    recentOrders = orders.slice(0, 6);
    activeOrders = orders.filter((o: any) => o.status === 1).length;
    pendingOrders = orders.filter((o: any) => o.status === 0).length;
    completedOrders = orders.filter((o: any) => o.status === 2).length;
    totalEarnings = orders
      .filter((o: any) => o.payment_status === 'complete' || o.status === 2)
      .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  } catch (error) {
    console.warn('Failed to load seller stats from MongoDB:', error);
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
      case 4:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>Cancelled</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 600 }}>Active</span>;
    }
  };

  return (
    <DashboardLayout
      userType="seller"
      userName={session?.user?.name || 'Seller'}
      userImage={session?.user?.image}
    >
      {/* 5 Stats Cards Grid */}
      <div className="row g-4 mb-5">
        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Orders In Progress</span>
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
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Orders Pending</span>
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
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Orders Completed</span>
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
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Net Earnings</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#1e293b' }}>₦{totalEarnings.toLocaleString()}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '24px' }}>
                <i className="las la-wallet"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip: Add Service Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          Recent Customer Orders
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/seller/services/create"
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
              textDecoration: 'none',
            }}
          >
            <i className="las la-plus-circle"></i> Add New Service
          </Link>
          <Link
            href="/seller/orders"
            style={{
              padding: '10px 18px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              color: '#334155',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View All Orders
          </Link>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div
        className="d-none d-md-block"
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Order ID</th>
                <th style={{ padding: '14px 20px' }}>Client Name</th>
                <th style={{ padding: '14px 20px' }}>Scheduled Date</th>
                <th style={{ padding: '14px 20px' }}>Amount</th>
                <th style={{ padding: '14px 20px' }}>Payment</th>
                <th style={{ padding: '14px 20px' }}>Order Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="las la-clipboard-list fs-1 opacity-50 d-block mb-2"></i>
                    <p className="mb-0">No customer orders received yet. Your active services are published and ready for client bookings.</p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                <tr key={String(ord.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b' }}>
                    #{ord.id}
                    <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>{ord.invoice || 'Direct'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 500 }}>
                    {ord.name}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {ord.date} {ord.schedule ? `(${ord.schedule})` : ''}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                    ₦{Number(ord.total).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: ord.payment_status === 'complete' ? '#dcfce7' : '#fef3c7',
                        color: ord.payment_status === 'complete' ? '#15803d' : '#b45309',
                        textTransform: 'capitalize',
                      }}
                    >
                      {ord.payment_status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {getStatusBadge(Number(ord.status ?? 0))}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Link
                        href={`/orders/invoice/${ord.id}`}
                        target="_blank"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '5px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#fff',
                          color: '#64748b',
                          fontSize: '13px',
                          textDecoration: 'none',
                        }}
                        title="View Official Invoice"
                      >
                        <i className="las la-receipt"></i>
                      </Link>
                      <Link
                        href={`/seller/live-chat?user=${ord.buyer_id || ''}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '5px',
                          border: '1px solid #1DBF73',
                          backgroundColor: 'rgba(29, 191, 115, 0.1)',
                          color: '#1DBF73',
                          fontSize: '13px',
                          textDecoration: 'none',
                        }}
                        title="Chat with Buyer"
                      >
                        <i className="las la-comments"></i>
                      </Link>
                      <Link
                        href={`/seller/orders/${ord.id}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '5px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '13px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (Visible only on mobile devices <768px) */}
      <div className="d-md-none">
        {recentOrders.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center bg-white rounded-3 mb-4">
            <i className="las la-clipboard-list fs-1 opacity-50 mb-2"></i>
            <p className="text-muted mb-0 small">No orders recorded yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {recentOrders.map((ord: any) => (
              <div
                key={`mobile-seller-ord-${ord.id}`}
                className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                style={{ borderLeft: '4px solid var(--main-color-one)' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="fw-bold fs-6 text-dark">Order #{ord.id}</span>
                    <span className="text-muted small d-block">{ord.invoice || 'Direct'}</span>
                  </div>
                  <div>{getStatusBadge(Number(ord.status ?? 0))}</div>
                </div>

                <div className="mb-2 pb-2 border-bottom">
                  <div className="text-muted small">Buyer / Client</div>
                  <div className="fw-semibold text-dark">{ord.name || 'Client'}</div>
                </div>

                <div className="row g-2 mb-3" style={{ fontSize: '13px' }}>
                  <div className="col-6">
                    <span className="text-muted small d-block">Scheduled</span>
                    <span className="fw-medium">{ord.date || 'Flexible'}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted small d-block">Total Amount</span>
                    <span className="fw-bold text-success fs-6">₦{Number(ord.total).toLocaleString()}</span>
                  </div>
                  <div className="col-12">
                    <span className="text-muted small">Payment: </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: ord.payment_status === 'complete' ? '#dcfce7' : '#fef3c7',
                        color: ord.payment_status === 'complete' ? '#15803d' : '#b45309',
                      }}
                    >
                      {ord.payment_status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="d-flex gap-2 pt-2 border-top">
                  <Link
                    href={`/seller/orders/${ord.id}`}
                    className="btn btn-sm btn-outline-secondary flex-fill text-center fw-medium"
                    style={{ borderRadius: '6px' }}
                  >
                    Details
                  </Link>
                  <Link
                    href={`/orders/invoice/${ord.id}`}
                    target="_blank"
                    className="btn btn-sm btn-outline-secondary flex-fill text-center fw-medium"
                    style={{ borderRadius: '6px' }}
                  >
                    <i className="las la-receipt me-1"></i> Invoice
                  </Link>
                  <Link
                    href={`/seller/live-chat?user=${ord.buyer_id || ''}`}
                    className="btn btn-sm btn-success flex-fill text-center fw-medium text-white"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', borderRadius: '6px' }}
                  >
                    <i className="las la-comments me-1"></i> Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
