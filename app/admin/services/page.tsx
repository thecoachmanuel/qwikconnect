'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      setUpdatingId(id);
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (Number(s.id) === id ? { ...s, status: newStatus } : s))
        );
        showNotification(
          `Service #${id} has been ${newStatus === 1 ? 'approved and published' : 'unpublished'}.`
        );
      } else {
        showNotification('Failed to update service status.', 'danger');
      }
    } catch (err) {
      showNotification('Error updating service status.', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteService = async (service: any) => {
    if (!window.confirm(`Permanently delete service "${service.title}"?`)) {
      return;
    }
    const id = Number(service.id);
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => Number(s.id) !== id));
        showNotification(`Service "${service.title}" deleted.`);
      } else {
        showNotification('Failed to delete service.', 'danger');
      }
    } catch (err) {
      showNotification('Error deleting service.', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && s.status === 1) ||
      (filter === 'pending' && s.status === 0);

    const matchesSearch =
      s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const publishedCount = services.filter((s) => s.status === 1).length;
  const pendingCount = services.filter((s) => s.status === 0).length;

  return (
    <DashboardLayout userRole="admin" title="Manage Services">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Services Management</h4>
          <p className="text-muted small mb-0">Approve, reject, inspect, and remove seller listings across the marketplace</p>
        </div>
        <Link
          href="/admin/services/create"
          className="btn btn-success fw-bold d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
        >
          <i className="las la-plus-circle fs-5"></i> Add New Service
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Listings</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#0f172a' }}>{services.length}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#eef2ff', color: '#6366f1', fontSize: 24 }}>
                <i className="las la-cogs"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #1DBF73' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Approved & Live</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#1DBF73' }}>{publishedCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e8f9f1', color: '#1DBF73', fontSize: 24 }}>
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Pending Review</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#f59e0b' }}>{pendingCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#fef3c7', color: '#f59e0b', fontSize: 24 }}>
                <i className="las la-hourglass-half"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="las la-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search services by title, seller, or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 text-md-end">
            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
              <button
                type="button"
                className={`btn btn-sm ${filter === 'all' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('all')}
                style={filter === 'all' ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
              >
                All ({services.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filter === 'published' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('published')}
                style={filter === 'published' ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
              >
                Approved ({publishedCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filter === 'pending' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('pending')}
                style={filter === 'pending' ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Services Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white d-none d-md-block">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Service</th>
                  <th>Seller</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Controls</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No services found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td className="ps-4">
                        <div className="fw-semibold text-dark">
                          <Link href={`/service-list/${service.slug}`} target="_blank" className="text-decoration-none text-dark hover-opacity">
                            {service.title} <i className="las la-external-link-alt small text-muted"></i>
                          </Link>
                        </div>
                        <small className="text-muted">Slug: /{service.slug}</small>
                      </td>
                      <td>
                        <div className="fw-semibold small text-dark">{service.seller?.name || 'N/A'}</div>
                        <small className="text-muted">{service.seller?.email || ''}</small>
                      </td>
                      <td className="fw-bold text-success" style={{ color: '#1DBF73' }}>
                        ₦{Number(service.price || 0).toLocaleString()}
                      </td>
                      <td>
                        {service.status === 1 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            Approved / Live
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(Number(service.id), service.status)}
                            disabled={updatingId === Number(service.id)}
                            className={`btn btn-sm ${
                              service.status === 1 ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                          >
                            {updatingId === Number(service.id) ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : service.status === 1 ? (
                              'Unpublish'
                            ) : (
                              'Approve & Publish'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteService(service)}
                            disabled={updatingId === Number(service.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete service"
                          >
                            <i className="las la-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Services Card List (<768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center bg-white rounded-3 mb-4">
            <p className="text-muted mb-0 small">No services found matching your filters.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {filteredServices.map((service) => (
              <div
                key={`mobile-admin-srv-${service.id}`}
                className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                style={{ borderLeft: service.status === 1 ? '4px solid #1DBF73' : '4px solid #f59e0b' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                    <Link href={`/service-list/${service.slug}`} target="_blank" className="text-dark text-decoration-none">
                      {service.title}
                    </Link>
                  </h6>
                  {service.status === 1 ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 ms-2">
                      Live
                    </span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 ms-2">
                      Pending
                    </span>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-2">
                  <div>
                    <span className="text-muted small d-block">Seller</span>
                    <span className="fw-medium text-dark small">{service.seller?.name || 'N/A'}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block">Base Price</span>
                    <span className="fw-bold text-success fs-6">₦{Number(service.price || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="d-flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(Number(service.id), service.status)}
                    disabled={updatingId === Number(service.id)}
                    className={`btn btn-sm flex-fill ${
                      service.status === 1 ? 'btn-outline-warning' : 'btn-success text-white'
                    }`}
                    style={service.status !== 1 ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
                  >
                    {updatingId === Number(service.id) ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : service.status === 1 ? (
                      'Unpublish'
                    ) : (
                      'Approve'
                    )}
                  </button>

                  <Link
                    href={`/service-list/${service.slug}`}
                    target="_blank"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: '6px', padding: '6px 12px' }}
                    title="Preview Service"
                  >
                    <i className="las la-external-link-alt"></i>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteService(service)}
                    disabled={updatingId === Number(service.id)}
                    className="btn btn-sm btn-outline-danger"
                    style={{ borderRadius: '6px', padding: '6px 12px' }}
                    title="Delete service"
                  >
                    <i className="las la-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
