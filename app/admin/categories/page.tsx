'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const ICON_OPTIONS = [
  'las la-tools', 'las la-broom', 'las la-paint-roller', 'las la-spa',
  'las la-leaf', 'las la-car', 'las la-wrench', 'las la-home',
  'las la-cut', 'las la-magic', 'las la-truck', 'las la-laptop',
  'las la-bolt', 'las la-couch', 'las la-swimming-pool', 'las la-dog',
  'las la-tshirt', 'las la-hard-hat', 'las la-plug', 'las la-water',
];

const emptyForm = { name: '', icon: 'las la-tools', description: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null); // null = create mode
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories?all=1');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingCat(null);
    setForm(emptyForm);
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditingCat(cat);
    setForm({ name: cat.name || '', icon: cat.icon || 'las la-tools', description: cat.description || '' });
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      setFeedback({ type: '', text: '' });

      const isEditing = !!editingCat;
      const res = await fetch('/api/admin/categories', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingCat.id, ...form } : form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save category');

      setFeedback({ type: 'success', text: isEditing ? 'Category updated successfully!' : 'Category created successfully!' });
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Error saving category' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => Number(c.id) !== id));
        setFeedback({ type: 'success', text: 'Category deleted successfully.' });
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Manage Categories">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Categories Management</h4>
          <p className="text-muted small mb-0">Organize service categories, icons, and marketplace navigation</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-success d-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
        >
          <i className="las la-plus"></i> Add New Category
        </button>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Stats bar */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white text-center">
            <div className="fs-2 fw-bold" style={{ color: 'var(--main-color-one)' }}>{categories.length}</div>
            <div className="text-muted small">Total Categories</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white text-center">
            <div className="fs-2 fw-bold text-success">{categories.filter(c => c.status === 1).length}</div>
            <div className="text-muted small">Active</div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Icon</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No categories found. Click &quot;Add New Category&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="ps-4">
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center text-success border fs-5"
                          style={{ width: '42px', height: '42px' }}
                        >
                          <i className={cat.icon || 'las la-tag'}></i>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{cat.name}</div>
                      </td>
                      <td className="text-muted small">/{cat.slug}</td>
                      <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                        {cat.description || <em>No description</em>}
                      </td>
                      <td>
                        <span className={`badge border px-2 py-1 ${cat.status === 1 ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'}`}>
                          {cat.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            className="btn btn-outline-primary btn-sm"
                            title="Edit category"
                          >
                            <i className="las la-edit"></i> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(Number(cat.id))}
                            className="btn btn-outline-danger btn-sm"
                            title="Delete category"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          onClick={(e) => { if ((e.target as any).classList.contains('modal')) setShowModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingCat ? 'Edit Category' : 'Add New Category'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {feedback.text && showModal && (
                    <div className={`alert alert-${feedback.type} py-2 mb-3 small`}>{feedback.text}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Category Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Home Cleaning & Maid"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Icon Class (LineAwesome)</label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. las la-broom"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      />
                      <div
                        className="rounded border d-flex align-items-center justify-content-center text-success bg-light"
                        style={{ minWidth: '42px', height: '38px', fontSize: '20px' }}
                      >
                        <i className={form.icon || 'las la-tag'}></i>
                      </div>
                    </div>
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {ICON_OPTIONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          className={`btn btn-sm p-1 ${form.icon === ic ? 'btn-success' : 'btn-outline-secondary'}`}
                          style={{ width: '34px', height: '34px', fontSize: '16px' }}
                          title={ic}
                          onClick={() => setForm({ ...form, icon: ic })}
                        >
                          <i className={ic}></i>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Description (Optional)</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Short description of this category..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-success"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                  >
                    {submitting ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
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
