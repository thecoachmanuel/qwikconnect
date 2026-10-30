'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Link from 'next/link';

interface LocationItem {
  id: number;
  service_city: string;
  country: string;
  status: number;
  service_count?: number;
  created_at?: string;
  updated_at?: string;
}

const emptyForm = { service_city: '', country: 'Nigeria', status: 1 };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreate = () => {
    setEditingLoc(null);
    setForm(emptyForm);
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const openEdit = (loc: LocationItem) => {
    setEditingLoc(loc);
    setForm({
      service_city: loc.service_city || '',
      country: 'Nigeria',
      status: loc.status !== undefined ? loc.status : 1,
    });
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_city.trim()) {
      setFeedback({ type: 'danger', text: 'Location/City name is required' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', text: '' });

      const isEditing = !!editingLoc;
      const res = await fetch('/api/admin/locations', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { id: editingLoc.id, service_city: form.service_city.trim(), status: form.status }
            : { service_city: form.service_city.trim(), status: form.status }
        ),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save location');

      setFeedback({
        type: 'success',
        text: isEditing
          ? `Location "${form.service_city.trim()}" updated successfully!`
          : `New location "${form.service_city.trim()}" added to Nigeria registry!`,
      });
      setShowModal(false);
      fetchLocations();
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Error saving location' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (loc: LocationItem) => {
    const newStatus = loc.status === 1 ? 0 : 1;
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loc.id, status: newStatus }),
      });
      if (res.ok) {
        setLocations((prev) =>
          prev.map((item) => (item.id === loc.id ? { ...item, status: newStatus } : item))
        );
        setFeedback({
          type: 'success',
          text: `Location "${loc.service_city}" is now ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'danger', text: 'Failed to update location status' });
    }
  };

  const handleDelete = async (loc: LocationItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${loc.service_city}"? Any services currently tagged with this city will retain their address.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/locations?id=${loc.id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations((prev) => prev.filter((item) => Number(item.id) !== Number(loc.id)));
        setFeedback({ type: 'success', text: `Location "${loc.service_city}" removed successfully.` });
      } else {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete');
      }
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Failed to delete location' });
    }
  };

  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;
    const q = searchTerm.toLowerCase().trim();
    return locations.filter((loc) =>
      loc.service_city.toLowerCase().includes(q)
    );
  }, [locations, searchTerm]);

  const activeCount = locations.filter((l) => Number(l.status) === 1).length;
  const withServicesCount = locations.filter((l) => (l.service_count || 0) > 0).length;

  return (
    <DashboardLayout userRole="admin" title="Service Locations">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="las la-map-marker-alt text-success"></i>
            Service Locations Management (Nigeria)
          </h4>
          <p className="text-muted small mb-0">
            Define Nigerian cities and regions available for service listings, searches, and provider filtering.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-success d-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
        >
          <i className="las la-plus"></i> Add New Location
        </button>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white text-center">
            <div className="fs-2 fw-bold" style={{ color: 'var(--main-color-one)' }}>{locations.length}</div>
            <div className="text-muted small">Total Registered Cities</div>
          </div>
        </div>
        <div className="col-6 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white text-center">
            <div className="fs-2 fw-bold text-success">{activeCount}</div>
            <div className="text-muted small">Active Locations</div>
          </div>
        </div>
        <div className="col-6 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white text-center">
            <div className="fs-2 fw-bold text-primary">{withServicesCount}</div>
            <div className="text-muted small">Locations with Live Services</div>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0 fw-bold fs-6">Service Cities Registry (Nigeria)</h5>
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="las la-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search city name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="las la-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4"># ID</th>
                  <th>City / Region</th>
                  <th>Country</th>
                  <th>Live Services</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                      <div className="text-muted small mt-2">Loading service locations...</div>
                    </td>
                  </tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      {searchTerm ? 'No locations match your search query.' : 'No locations found. Click "Add New Location" to add one.'}
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => {
                    const count = loc.service_count || 0;
                    const isActive = Number(loc.status) === 1;
                    return (
                      <tr key={loc.id}>
                        <td className="ps-4 text-muted small fw-semibold">#{loc.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-success"
                              style={{ width: '32px', height: '32px', backgroundColor: 'rgba(29, 191, 115, 0.1)' }}
                            >
                              <i className="las la-city"></i>
                            </div>
                            <span className="fw-bold text-dark">{loc.service_city}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            <span className="me-1">🇳🇬</span> Nigeria
                          </span>
                        </td>
                        <td>
                          {count > 0 ? (
                            <Link
                              href={`/service-list?location=${encodeURIComponent(loc.service_city)}`}
                              className="badge text-decoration-none"
                              style={{
                                backgroundColor: 'rgba(29, 191, 115, 0.15)',
                                color: 'var(--main-color-one)',
                                fontWeight: 600,
                              }}
                              title="View services in this location"
                            >
                              <i className="las la-check-circle me-1"></i>
                              {count} {count === 1 ? 'Service' : 'Services'}
                            </Link>
                          ) : (
                            <span className="badge bg-light text-muted border">
                              0 Services
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(loc)}
                            className={`btn btn-sm py-0 px-2 rounded-pill fw-semibold border ${
                              isActive
                                ? 'bg-success-subtle text-success border-success-subtle'
                                : 'bg-secondary-subtle text-secondary border-secondary-subtle'
                            }`}
                            title="Click to toggle active status"
                            style={{ fontSize: '11px', lineHeight: '22px' }}
                          >
                            <i className={`las ${isActive ? 'la-toggle-on' : 'la-toggle-off'} me-1`}></i>
                            {isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(loc)}
                              className="btn btn-outline-primary btn-sm"
                              title="Edit location name or status"
                            >
                              <i className="las la-edit"></i> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(loc)}
                              className="btn btn-outline-danger btn-sm"
                              title="Delete location"
                            >
                              <i className="las la-trash"></i>
                            </button>
                          </div>
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingLoc ? 'Edit Service Location' : 'Add New Service Location'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      City / Region Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lagos, Abuja, Port Harcourt, Ibadan..."
                      value={form.service_city}
                      onChange={(e) => setForm({ ...form, service_city: e.target.value })}
                      required
                      autoFocus
                    />
                    <div className="form-text small">
                      Name of the municipality or metropolitan area in Nigeria.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      Country (Restricted Region)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">🇳🇬</span>
                      <input
                        type="text"
                        className="form-control bg-light border-start-0"
                        value="Nigeria"
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="form-text small text-muted">
                      Platform location services are restricted to Nigeria.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      Availability Status
                    </label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
                    >
                      <option value={1}>Active (Visible in Search & Filters)</option>
                      <option value={0}>Inactive (Hidden from search selectors)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success d-flex align-items-center gap-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="las la-save"></i>
                        {editingLoc ? 'Update Location' : 'Save Location'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

