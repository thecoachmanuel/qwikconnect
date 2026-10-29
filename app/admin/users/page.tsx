'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface UserItem {
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string | null;
  user_type: number; // 0 = seller or admin, 1 = buyer
  role?: string | null;
  user_status: number; // 1 = active, 0 = banned/inactive
  email_verified?: string | null;
  image?: string | null;
  created_at?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'seller' | 'buyer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.user_status === 1 ? 0 : 1;
    setUpdatingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, user_status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, user_status: newStatus } : u))
        );
        showNotification(
          `User "${user.name}" has been ${newStatus === 1 ? 'activated' : 'suspended'}.`
        );
      } else {
        showNotification('Failed to update user status.', 'danger');
      }
    } catch (err) {
      showNotification('Error updating user status.', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRole = async (user: UserItem) => {
    const newType = user.user_type === 0 ? 1 : 0;
    setUpdatingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, user_type: newType }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, user_type: newType } : u))
        );
        showNotification(
          `User role changed to ${newType === 0 ? 'Seller' : 'Buyer'}.`
        );
      } else {
        showNotification('Failed to update user role.', 'danger');
      }
    } catch (err) {
      showNotification('Error changing user role.', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${user.name}"?`)) {
      return;
    }
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showNotification(`User "${user.name}" deleted successfully.`);
      } else {
        showNotification('Failed to delete user.', 'danger');
      }
    } catch (err) {
      showNotification('Error deleting user.', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));

    const isAdmin = u.role === 'admin' || u.user_type === 2 || u.id === 1 || u.username === 'super_admin' || u.email === 'admin@qixer.com';
    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && isAdmin) ||
      (roleFilter === 'seller' && u.user_type === 0 && !isAdmin) ||
      (roleFilter === 'buyer' && u.user_type === 1 && !isAdmin);

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.user_status === 1) ||
      (statusFilter === 'banned' && u.user_status === 0);

    return matchSearch && matchRole && matchStatus;
  });

  const totalAdmins = users.filter((u) => u.role === 'admin' || u.user_type === 2 || u.id === 1 || u.username === 'super_admin' || u.email === 'admin@qixer.com').length;
  const totalSellers = users.filter((u) => u.user_type === 0 && u.id !== 1 && u.username !== 'super_admin' && u.email !== 'admin@qixer.com' && u.role !== 'admin').length;
  const totalBuyers = users.filter((u) => u.user_type === 1).length;
  const activeCount = users.filter((u) => u.user_status === 1).length;

  return (
    <DashboardLayout userRole="admin" title="Users & Sellers Management">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Users & Sellers Management</h4>
          <p className="text-muted small mb-0">Control marketplace accounts, roles, access permissions and credentials</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/seller-verify" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5" style={{ borderRadius: '6px', fontWeight: 600 }}>
            <i className="las la-id-card fs-5"></i>
            <span>Seller KYC Verifications</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-5 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #6366f1' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Registered</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#0f172a' }}>{users.length}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#eef2ff', color: '#6366f1', fontSize: 24 }}>
                <i className="las la-users"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #1DBF73' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Active Sellers</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#1DBF73' }}>{totalSellers}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e8f9f1', color: '#1DBF73', fontSize: 24 }}>
                <i className="las la-briefcase"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #0284c7' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Active Buyers</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#0284c7' }}>{totalBuyers}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e0f2fe', color: '#0284c7', fontSize: 24 }}>
                <i className="las la-shopping-bag"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #10b981' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Active Accounts</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#10b981' }}>{activeCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#ecfdf5', color: '#10b981', fontSize: 24 }}>
                <i className="las la-check-shield"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="las la-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search user by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="admin">Admins ({totalAdmins})</option>
              <option value="seller">Sellers ({totalSellers})</option>
              <option value="buyer">Buyers ({totalBuyers})</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="banned">Suspended / Inactive</option>
            </select>
          </div>

          <div className="col-12 col-md-1 text-md-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
              title="Reset Filters"
            >
              <i className="las la-undo"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">User</th>
                  <th>Role</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th className="text-end pe-4">Controls</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isUserAdmin = user.role === 'admin' || user.user_type === 2 || user.id === 1 || user.username === 'super_admin' || user.email === 'admin@qixer.com';
                    return (
                      <tr key={user.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: isUserAdmin ? '#6366f1' : user.user_type === 0 ? '#1DBF73' : '#0284c7',
                                fontSize: 16,
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{user.name}</div>
                              <small className="text-muted">@{user.username || 'user'}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {isUserAdmin ? (
                            <span className="badge px-2.5 py-1 text-white" style={{ background: '#6366f1', fontWeight: 600 }}>
                              <i className="las la-user-shield me-1"></i> Admin
                            </span>
                          ) : user.user_type === 0 ? (
                            <span className="badge px-2.5 py-1 text-white" style={{ background: '#1DBF73', fontWeight: 600 }}>
                              <i className="las la-briefcase me-1"></i> Seller
                            </span>
                          ) : (
                            <span className="badge px-2.5 py-1 text-white" style={{ background: '#0284c7', fontWeight: 600 }}>
                              <i className="las la-shopping-cart me-1"></i> Buyer
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="small fw-medium text-dark">{user.email}</div>
                          <small className="text-muted">{user.phone || 'No phone set'}</small>
                        </td>

                        <td>
                          {user.user_status === 1 ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              <i className="las la-check-circle me-1"></i> Active
                            </span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                              <i className="las la-ban me-1"></i> Suspended
                            </span>
                          )}
                        </td>

                        <td className="text-muted small">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}
                        </td>

                        <td className="text-end pe-4">
                          {isUserAdmin ? (
                            <span className="badge bg-light text-muted border px-3 py-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                              <i className="las la-lock me-1"></i> System Admin
                            </span>
                          ) : (
                            <div className="d-inline-flex gap-2">
                              {/* Toggle Status Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                disabled={updatingId === user.id}
                                className={`btn btn-sm ${
                                  user.user_status === 1 ? 'btn-outline-warning' : 'btn-outline-success'
                                }`}
                                title={user.user_status === 1 ? 'Suspend User' : 'Activate User'}
                              >
                                {updatingId === user.id ? (
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : user.user_status === 1 ? (
                                  <><i className="las la-user-slash me-1"></i> Suspend</>
                                ) : (
                                  <><i className="las la-user-check me-1"></i> Activate</>
                                )}
                              </button>

                              {/* Switch Role Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleRole(user)}
                                disabled={updatingId === user.id}
                                className="btn btn-sm btn-outline-secondary"
                                title={`Switch to ${user.user_type === 0 ? 'Buyer' : 'Seller'}`}
                              >
                                <i className="las la-exchange-alt me-1"></i>
                                {user.user_type === 0 ? 'Make Buyer' : 'Make Seller'}
                              </button>

                              {/* Delete User Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={updatingId === user.id}
                                className="btn btn-sm btn-outline-danger"
                                title="Delete User"
                              >
                                <i className="las la-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
