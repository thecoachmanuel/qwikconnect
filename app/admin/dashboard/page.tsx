import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/lib/auth';
import { getServices, getOrders, getUsers } from '@/lib/mongodb';

export default async function AdminDashboardPage() {
  const session = await auth();

  let totalServices = 0;
  let totalOrders = 0;
  let totalUsers = 0;
  let totalRevenue = 0;
  let recentOrders: any[] = [];

  try {
    const [services, orders, users] = await Promise.all([
      getServices(),
      getOrders(),
      getUsers(),
    ]);

    totalServices = services.length;
    totalOrders = orders.length;
    totalUsers = users.length;
    totalRevenue = orders
      .filter((o: any) => o.payment_status === 'complete' || o.status === 2)
      .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    recentOrders = orders.slice(0, 6);
  } catch (error) {
    console.warn('Failed to load admin stats from MongoDB:', error);
  }


  return (
    <DashboardLayout userType="admin" userName={session?.user?.name || 'Super Admin'}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
          Platform Overview & Control Center
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          Real-time metrics, order volume, and system administration for QwikConnect Marketplace
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Gross Revenue</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: 'var(--main-color-one)' }}>₦{totalRevenue.toLocaleString()}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(29, 191, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--main-color-one)', fontSize: '24px', fontWeight: 800 }}>
                ₦
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Orders</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#0284c7' }}>{totalOrders}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '24px' }}>
                <i className="las la-shopping-cart"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Services</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#eab308' }}>{totalServices}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', fontSize: '24px' }}>
                <i className="las la-cogs"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Users</span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 0', color: '#8b5cf6' }}>{totalUsers}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '24px' }}>
                <i className="las la-users"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
        Quick Management
      </h3>
      <div className="row g-3 mb-5">
        <div className="col-md-3">
          <Link
            href="/service-list"
            target="_blank"
            style={{
              display: 'block',
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            <i className="las la-eye" style={{ color: 'var(--main-color-one)', marginRight: '8px' }}></i> Browse All Listings
          </Link>
        </div>
        <div className="col-md-3">
          <Link
            href="/admin/services/create"
            style={{
              display: 'block',
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            <i className="las la-plus-circle" style={{ color: '#0284c7', marginRight: '8px' }}></i> Add Service Offering
          </Link>
        </div>
        <div className="col-md-3">
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'block',
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            <i className="las la-external-link-alt" style={{ color: '#eab308', marginRight: '8px' }}></i> Live Storefront
          </Link>
        </div>
        <div className="col-md-3">
          <Link
            href="/admin/users"
            style={{
              display: 'block',
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            <i className="las la-user-plus" style={{ color: '#8b5cf6', marginRight: '8px' }}></i> Manage Users & Sellers
          </Link>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          Global Orders Feed
        </h3>
        <Link
          href="/admin/orders"
          style={{
            fontSize: '13px',
            color: 'var(--main-color-one)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View All Orders &rarr;
        </Link>
      </div>

      {/* Desktop Table View */}
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
                <th style={{ padding: '14px 20px' }}>Order / Invoice</th>
                <th style={{ padding: '14px 20px' }}>Customer</th>
                <th style={{ padding: '14px 20px' }}>Scheduled Date</th>
                <th style={{ padding: '14px 20px' }}>Gateway</th>
                <th style={{ padding: '14px 20px' }}>Amount</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <i className="las la-shopping-cart" style={{ fontSize: '32px', opacity: 0.5, display: 'block', marginBottom: '8px' }}></i>
                    No orders have been recorded in the platform yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                  <tr key={String(ord.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b' }}>
                      #{ord.id}
                      <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>{ord.invoice || 'Direct'}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {ord.name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {ord.date}
                    </td>
                    <td style={{ padding: '14px 20px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                      {ord.payment_gateway?.replace(/_/g, ' ') || 'Manual'}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                      ₦{Number(ord.total).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: ord.status === 2 ? '#dcfce7' : '#e0f2fe', color: ord.status === 2 ? '#15803d' : '#0369a1', fontSize: '12px', fontWeight: 600 }}>
                        {ord.status === 2 ? 'Completed' : ord.status === 4 ? 'Cancelled' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <Link
                        href={`/orders/invoice/${ord.id}`}
                        target="_blank"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '5px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#fff',
                          color: '#334155',
                          fontSize: '13px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <i className="las la-receipt"></i> Invoice
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (<768px) */}
      <div className="d-md-none">
        {recentOrders.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center bg-white rounded-3 mb-4">
            <i className="las la-shopping-cart fs-1 opacity-50 mb-2"></i>
            <p className="text-muted mb-0 small">No orders recorded in the platform yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {recentOrders.map((ord: any) => (
              <div
                key={`mobile-admin-ord-${ord.id}`}
                className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                style={{ borderLeft: '4px solid #6366f1' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="fw-bold fs-6 text-dark">Order #{ord.id}</span>
                    <span className="text-muted small d-block">{ord.invoice || 'Direct'}</span>
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: ord.status === 2 ? '#dcfce7' : '#e0f2fe',
                      color: ord.status === 2 ? '#15803d' : '#0369a1',
                    }}
                  >
                    {ord.status === 2 ? 'Completed' : ord.status === 4 ? 'Cancelled' : 'Active'}
                  </span>
                </div>

                <div className="mb-2 pb-2 border-bottom">
                  <div className="text-muted small">Customer Name</div>
                  <div className="fw-semibold text-dark">{ord.name || 'Customer'}</div>
                </div>

                <div className="row g-2 mb-3" style={{ fontSize: '13px' }}>
                  <div className="col-6">
                    <span className="text-muted small d-block">Scheduled Date</span>
                    <span className="fw-medium">{ord.date || 'Flexible'}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted small d-block">Grand Total</span>
                    <span className="fw-bold text-success fs-6">₦{Number(ord.total).toLocaleString()}</span>
                  </div>
                  <div className="col-12">
                    <span className="text-muted small">Gateway: </span>
                    <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '11px' }}>
                      {ord.payment_gateway?.replace(/_/g, ' ') || 'Manual'}
                    </span>
                  </div>
                </div>

                <div className="d-flex gap-2 pt-2 border-top">
                  <Link
                    href={`/orders/invoice/${ord.id}`}
                    target="_blank"
                    className="btn btn-sm btn-outline-secondary w-100 text-center fw-medium"
                    style={{ borderRadius: '6px' }}
                  >
                    <i className="las la-receipt me-1"></i> View Invoice
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
