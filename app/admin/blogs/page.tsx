'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  category_id?: string;
  image: string;
  author: string;
  excerpt: string;
  content: string;
  status?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_tags?: string;
  views?: number;
  created_at: string;
}

const CATEGORY_PRESETS = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Home Improvement',
  'Painting & Decoration',
  'Moving & Relocation',
  'Landscaping & Gardening',
  'Appliance Repair',
  'General',
];

const DEFAULT_IMAGES = [
  '/assets/uploads/media-uploader/banner11638279446.png',
  '/assets/uploads/media-uploader/thumb-01.jpg',
  '/assets/uploads/media-uploader/thumb-02.jpg',
  '/assets/uploads/media-uploader/thumb-03.jpg',
];

const emptyBlogForm = {
  title: '',
  slug: '',
  category: 'Cleaning',
  author: 'Super Admin',
  image: '/assets/uploads/media-uploader/banner11638279446.png',
  status: 'publish',
  excerpt: '',
  content: '',
  tags: 'home, maintenance, tips',
  meta_title: '',
  meta_description: '',
  meta_tags: 'home maintenance, service tips, qixer pro',
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyBlogForm);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger' | ''; text: string }>({ type: '', text: '' });
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/blogs');
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error('Failed to load blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreate = () => {
    setEditingBlog(null);
    setForm(emptyBlogForm);
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setForm({
      title: blog.title || '',
      slug: blog.slug || '',
      category: blog.category || 'General',
      author: blog.author || 'Super Admin',
      image: blog.image || '/assets/uploads/media-uploader/banner11638279446.png',
      status: blog.status || 'publish',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      meta_title: blog.meta_title || blog.title || '',
      meta_description: blog.meta_description || blog.excerpt || '',
      meta_tags: blog.meta_tags || (Array.isArray(blog.tags) ? blog.tags.join(', ') : ''),
    });
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const handleFeaturedImageUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadingFeaturedImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Image upload failed');
      setForm((prev) => ({ ...prev, image: data.url }));
      setFeedback({ type: 'success', text: 'Featured image uploaded successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Failed to upload featured image.' });
    } finally {
      setUploadingFeaturedImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFeedback({ type: 'danger', text: 'Blog title is required.' });
      return;
    }
    if (!form.content.trim()) {
      setFeedback({ type: 'danger', text: 'Article content cannot be empty.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', text: '' });

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        category: form.category,
        author: form.author.trim() || 'Super Admin',
        image: form.image.trim() || '/assets/uploads/media-uploader/banner11638279446.png',
        status: form.status,
        excerpt: form.excerpt.trim() || form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        meta_title: form.meta_title.trim() || form.title.trim(),
        meta_description: form.meta_description.trim() || form.excerpt.trim() || form.title.trim(),
        meta_tags: form.meta_tags.trim() || undefined,
      };

      const isEditing = !!editingBlog;
      const url = isEditing ? `/api/admin/blogs/${editingBlog.id}` : '/api/admin/blogs';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save blog post');

      setFeedback({
        type: 'success',
        text: isEditing ? 'Article updated successfully!' : 'New article created and published!',
      });
      setShowModal(false);
      await fetchBlogs();
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Error saving blog post' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === 'publish' ? 'draft' : 'publish';
    try {
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBlogs((prev) =>
          prev.map((b) => (b.id === blog.id ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/blogs/${blogToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id));
        setBlogToDelete(null);
        setFeedback({ type: 'success', text: 'Article deleted successfully.' });
      }
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered blogs list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        b.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'publish' && (b.status === 'publish' || !b.status)) ||
        (selectedStatus === 'draft' && b.status === 'draft');

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [blogs, searchQuery, selectedCategory, selectedStatus]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    CATEGORY_PRESETS.forEach((c) => set.add(c));
    return Array.from(set);
  }, [blogs]);

  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.status === 'publish' || !b.status).length;
    const drafts = blogs.filter((b) => b.status === 'draft').length;
    return { total, published, drafts };
  }, [blogs]);

  return (
    <DashboardLayout title="Manage Blog Articles" userRole="admin">
      <div className="container-fluid py-4">
        {/* Top Header Card */}
        <div
          className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-4 mb-4 rounded-4"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                style={{
                  backgroundColor: 'rgba(29, 191, 115, 0.2)',
                  color: '#1DBF73',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Editorial Desk
              </span>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                Real-time Sync Active
              </span>
            </div>
            <h2 className="m-0 fw-bold fs-3 text-white">Articles & Blog Posts</h2>
            <p className="m-0 mt-1 text-light opacity-75" style={{ fontSize: '14px' }}>
              Create, review, edit, and organize marketplace guide articles, safety guidelines, and tips.
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="btn btn-outline-light d-flex align-items-center gap-2 px-3 py-2"
              style={{ borderRadius: '10px', fontSize: '13.5px', fontWeight: 600 }}
            >
              <i className="las la-external-link-alt"></i> Public Blog
            </Link>
            <button
              onClick={openCreate}
              className="btn btn-success d-flex align-items-center gap-2 px-4 py-2"
              style={{
                backgroundColor: '#1DBF73',
                borderColor: '#1DBF73',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(29, 191, 115, 0.35)',
              }}
            >
              <i className="las la-plus-circle fs-5"></i> Write New Post
            </button>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback.text && (
          <div
            className={`alert alert-${feedback.type === 'danger' ? 'danger' : 'success'} alert-dismissible fade show d-flex align-items-center justify-content-between mb-4`}
            style={{ borderRadius: '10px' }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`las ${feedback.type === 'danger' ? 'la-exclamation-triangle' : 'la-check-circle'} fs-4`}></i>
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setFeedback({ type: '', text: '' })}
            ></button>
          </div>
        )}

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-4">
            <div
              className="p-3 bg-white border rounded-4 d-flex align-items-center justify-content-between"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            >
              <div>
                <span className="text-muted d-block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Total Articles
                </span>
                <span className="fw-bold fs-4 text-dark">{stats.total}</span>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                <i className="las la-newspaper"></i>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-xl-4">
            <div
              className="p-3 bg-white border rounded-4 d-flex align-items-center justify-content-between"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            >
              <div>
                <span className="text-muted d-block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Published Live
                </span>
                <span className="fw-bold fs-4 text-success">{stats.published}</span>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#ecfdf5',
                  color: '#1DBF73',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-xl-4">
            <div
              className="p-3 bg-white border rounded-4 d-flex align-items-center justify-content-between"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            >
              <div>
                <span className="text-muted d-block" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Drafts & Review
                </span>
                <span className="fw-bold fs-4 text-warning">{stats.drafts}</span>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                <i className="las la-edit"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div
          className="bg-white p-3 mb-4 rounded-4 border d-flex flex-wrap align-items-center justify-content-between gap-3"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <div className="d-flex flex-grow-1 align-items-center gap-2" style={{ minWidth: '240px', maxWidth: '420px' }}>
            <div className="position-relative w-100">
              <i
                className="las la-search position-absolute top-50 translate-middle-y text-muted"
                style={{ left: '14px', fontSize: '18px' }}
              ></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search articles by title, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: '10px', fontSize: '14px', height: '42px' }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ borderRadius: '10px', fontSize: '13.5px', height: '42px', minWidth: '150px' }}
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ borderRadius: '10px', fontSize: '13.5px', height: '42px', minWidth: '130px' }}
            >
              <option value="all">All Statuses</option>
              <option value="publish">Published</option>
              <option value="draft">Drafts</option>
            </select>

            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                className="btn btn-light border text-muted"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                style={{ borderRadius: '10px', fontSize: '13px', height: '42px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Articles Table */}
        <div
          className="bg-white border rounded-4 overflow-hidden"
          style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
        >
          {loading ? (
            <div className="py-5 text-center text-muted">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-3 mb-0" style={{ fontSize: '14px' }}>Loading articles...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-5 text-center text-muted">
              <i className="las la-newspaper fs-1 d-block mb-2 text-secondary"></i>
              <h5 className="text-dark">No Articles Found</h5>
              <p className="mb-3" style={{ fontSize: '14px' }}>
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'No articles match your active search filters.'
                  : 'Get started by creating your first blog article!'}
              </p>
              <button
                onClick={openCreate}
                className="btn btn-sm btn-success px-3 py-2"
                style={{ borderRadius: '8px', backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
              >
                <i className="las la-plus-circle"></i> Create Post
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px 20px' }}>ARTICLE</th>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px' }}>CATEGORY</th>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px' }}>AUTHOR</th>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px' }}>STATUS</th>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px' }}>DATE</th>
                    <th style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.map((blog) => {
                    const isPublished = blog.status === 'publish' || !blog.status;
                    return (
                      <tr key={blog.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Article Info */}
                        <td style={{ padding: '14px 20px', maxWidth: '380px' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: '64px',
                                height: '48px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              <img
                                src={blog.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                                alt={blog.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.src = '/assets/uploads/media-uploader/banner11638279446.png';
                                }}
                              />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h6
                                className="mb-1 text-truncate"
                                style={{ fontSize: '14.5px', fontWeight: 600, color: '#1e293b' }}
                                title={blog.title}
                              >
                                {blog.title}
                              </h6>
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '12px' }}>
                                  slug: <code style={{ color: '#0f172a' }}>{blog.slug}</code>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px' }}>
                          <span
                            className="badge bg-light text-dark border"
                            style={{ fontSize: '12px', fontWeight: 500, padding: '5px 10px', borderRadius: '6px' }}
                          >
                            {blog.category || 'General'}
                          </span>
                        </td>

                        {/* Author */}
                        <td style={{ padding: '14px', fontSize: '13.5px', color: '#475569' }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="las la-user-circle text-muted fs-5"></i>
                            <span>{blog.author || 'Super Admin'}</span>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '14px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(blog)}
                            className={`badge border-0 ${isPublished ? 'bg-success text-white' : 'bg-warning text-dark'}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                            title="Click to toggle publish/draft"
                          >
                            <i className={`las ${isPublished ? 'la-check-circle' : 'la-clock'} me-1`}></i>
                            {isPublished ? 'Published' : 'Draft'}
                          </button>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px', fontSize: '13px', color: '#64748b' }}>
                          {blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : 'Recent'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            <Link
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              className="btn btn-sm btn-light border text-primary"
                              style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}
                              title="View Article on Frontend"
                            >
                              <i className="las la-eye fs-5"></i>
                            </Link>

                            <button
                              onClick={() => openEdit(blog)}
                              className="btn btn-sm btn-light border text-secondary"
                              style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}
                              title="Edit Article"
                            >
                              <i className="las la-pen fs-5"></i>
                            </button>

                            <button
                              onClick={() => setBlogToDelete(blog)}
                              className="btn btn-sm btn-light border text-danger"
                              style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}
                              title="Delete Article"
                            >
                              <i className="las la-trash fs-5"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(29, 191, 115, 0.1)',
                      color: '#1DBF73',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    <i className={editingBlog ? 'las la-pen' : 'las la-newspaper'}></i>
                  </div>
                  <div>
                    <h5 className="modal-title m-0 fw-bold fs-6">
                      {editingBlog ? 'Edit Blog Article' : 'Create New Blog Article'}
                    </h5>
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                      Publish content directly to the QwikConnect community blog.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 py-3" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  {feedback.type === 'danger' && feedback.text && (
                    <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: '8px', fontSize: '13.5px' }}>
                      <i className="las la-exclamation-circle me-1"></i> {feedback.text}
                    </div>
                  )}

                  {/* Title & Slug */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                      Article Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 10 Essential House Cleaning Hacks Every Homeowner Needs"
                      value={form.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          title: newTitle,
                          slug: editingBlog
                            ? prev.slug
                            : newTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
                        }));
                      }}
                      required
                      style={{ borderRadius: '8px' }}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                        URL Slug
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="article-url-slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        style={{ borderRadius: '8px', fontSize: '13px' }}
                      />
                      <small className="text-muted" style={{ fontSize: '11.5px' }}>
                        Preview: /blog/{form.slug || 'your-slug'}
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        list="categoryList"
                        placeholder="Select or enter category..."
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                      <datalist id="categoryList">
                        {CATEGORY_PRESETS.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Author & Status */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                        Author Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Super Admin"
                        value={form.author}
                        onChange={(e) => setForm({ ...form, author: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                        Publication Status
                      </label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="publish">Published (Live immediately)</option>
                        <option value="draft">Draft (Saved privately)</option>
                      </select>
                    </div>
                  </div>

                  {/* Featured Image with Local Upload & Drag-Drop */}
                  <div className="mb-4 p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fw-bold m-0" style={{ fontSize: '13.5px' }}>
                        <i className="las la-image text-success me-1"></i> Featured Article Image
                      </label>
                      <span className="badge bg-white text-muted border" style={{ fontSize: '11px', fontWeight: 500 }}>
                        JPG, PNG, WebP up to 10MB
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={featuredImageInputRef}
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFeaturedImageUpload(file);
                      }}
                    />

                    <div className="row g-3 align-items-center">
                      <div className="col-sm-auto">
                        <div
                          style={{
                            width: '120px',
                            height: '80px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            backgroundColor: '#fff',
                            border: '2px dashed #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          }}
                        >
                          {uploadingFeaturedImage ? (
                            <div className="text-center">
                              <span className="spinner-border spinner-border-sm text-success"></span>
                              <span className="d-block text-muted mt-1" style={{ fontSize: '10px' }}>Uploading</span>
                            </div>
                          ) : form.image ? (
                            <img
                              src={form.image}
                              alt="Featured preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.src = '/assets/uploads/media-uploader/banner11638279446.png';
                              }}
                            />
                          ) : (
                            <i className="las la-image text-muted" style={{ fontSize: '32px' }}></i>
                          )}
                        </div>
                      </div>

                      <div className="col">
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => featuredImageInputRef.current?.click()}
                            disabled={uploadingFeaturedImage}
                            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                            style={{ borderRadius: '6px', fontSize: '12.5px', fontWeight: 600 }}
                          >
                            <i className="las la-upload"></i>
                            {uploadingFeaturedImage ? 'Uploading Image...' : 'Upload Image from Computer'}
                          </button>
                          {form.image && (
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, image: '' })}
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                              style={{ borderRadius: '6px', fontSize: '12.5px' }}
                            >
                              <i className="las la-trash-alt"></i> Remove
                            </button>
                          )}
                        </div>

                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white text-muted" style={{ fontSize: '12px' }}>
                            Or URL:
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="https://... or /assets/uploads/media-uploader/..."
                            value={form.image}
                            onChange={(e) => setForm({ ...form, image: e.target.value })}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="d-flex align-items-center gap-1 mt-2 flex-wrap">
                          <span className="text-muted me-1" style={{ fontSize: '11px' }}>Quick Library:</span>
                          {DEFAULT_IMAGES.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setForm({ ...form, image: img })}
                              className="btn btn-xs btn-white border py-0 px-2"
                              style={{ fontSize: '10.5px', borderRadius: '4px', backgroundColor: '#fff' }}
                            >
                              Template {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold m-0" style={{ fontSize: '13.5px' }}>
                        Article Excerpt / Teaser
                      </label>
                      <span className="text-muted" style={{ fontSize: '11.5px' }}>
                        {form.excerpt.length} chars (Recommended: 80 - 160)
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Brief summary displayed on marketplace blog cards and feed listings..."
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      style={{ borderRadius: '8px', fontSize: '13.5px' }}
                    ></textarea>
                  </div>

                  {/* WYSIWYG Rich Text Editor for Content */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold m-0" style={{ fontSize: '13.5px' }}>
                        Article Body &amp; Content <span className="text-danger">*</span>
                      </label>
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '11.5px' }}>
                        Rich Word-like Formatting Enabled
                      </span>
                    </div>
                    <RichTextEditor
                      value={form.content}
                      onChange={(newHtml) => setForm((prev) => ({ ...prev, content: newHtml }))}
                      placeholder="Write your comprehensive article here. Format with headings, bold, bullet points, quotes, and insert images..."
                      minHeight="360px"
                    />
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: '13.5px' }}>
                      Article Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. cleaning tips, home repair, electrical, qixer guide"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>

                  {/* META / SEO SECTION (Parity with PHP @core/resources/views/backend/pages/blog/new.blade.php) */}
                  <div className="card border rounded-3 mb-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
                    <div
                      className="card-header py-3 px-3 border-bottom d-flex align-items-center justify-content-between"
                      style={{ backgroundColor: '#f8fafc' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(29, 191, 115, 0.12)',
                            color: '#1DBF73',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                          }}
                        >
                          <i className="las la-search"></i>
                        </span>
                        <div>
                          <h6 className="m-0 fw-bold" style={{ fontSize: '13.5px', color: '#1e293b' }}>
                            Search Engine Optimization (SEO) &amp; Meta Section
                          </h6>
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            Manage how this article appears on Google, Bing, Facebook, and Twitter
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '11px' }}>
                        SEO Ready
                      </span>
                    </div>

                    <div className="card-body p-3">
                      {/* Live Google Search Result Preview */}
                      <div
                        className="p-3 mb-3 rounded-2 border"
                        style={{ backgroundColor: '#ffffff', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}
                      >
                        <span className="text-muted d-block mb-1 text-uppercase fw-semibold" style={{ fontSize: '10.5px', letterSpacing: '0.5px' }}>
                          <i className="las la-globe me-1 text-primary"></i> Live Google SERP Snippet Preview:
                        </span>
                        <div style={{ fontFamily: 'Arial, sans-serif' }}>
                          <div style={{ fontSize: '12px', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#1DBF73', color: '#fff', fontSize: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Q</span>
                            <span style={{ color: '#202124', fontWeight: 500 }}>QwikConnect Marketplace</span>
                            <span style={{ color: '#5f6368' }}>› blog › {form.slug || 'article-slug'}</span>
                          </div>
                          <h4 style={{ fontSize: '17px', color: '#1a0dab', margin: '4px 0 2px 0', fontWeight: 500, lineHeight: '1.3' }}>
                            {form.meta_title || form.title || 'Your Article Title Appears Here'}
                          </h4>
                          <p style={{ fontSize: '13px', color: '#4d5156', margin: 0, lineHeight: '1.5' }}>
                            {form.meta_description || form.excerpt || 'Write a compelling meta description to attract clicks from search engine result pages to your marketplace guide.'}
                          </p>
                        </div>
                      </div>

                      {/* Meta Title */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-semibold m-0" style={{ fontSize: '13px' }}>
                            Meta Title
                          </label>
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: form.meta_title.length > 60 ? '#ef4444' : '#64748b',
                            }}
                          >
                            {form.meta_title.length} / 60 characters
                          </span>
                        </div>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Recommended: Under 60 characters for best Google indexing"
                          value={form.meta_title}
                          onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                          style={{ borderRadius: '6px' }}
                        />
                      </div>

                      {/* Meta Tags */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: '13px' }}>
                          Meta Keywords / Tags
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. cleaning, house maintenance, hire professional, lagos"
                          value={form.meta_tags}
                          onChange={(e) => setForm({ ...form, meta_tags: e.target.value })}
                          style={{ borderRadius: '6px' }}
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="mb-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-semibold m-0" style={{ fontSize: '13px' }}>
                            Meta Description
                          </label>
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: form.meta_description.length > 160 ? '#ef4444' : '#64748b',
                            }}
                          >
                            {form.meta_description.length} / 160 characters
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          className="form-control form-control-sm"
                          placeholder="Compelling 150-160 character summary that searchers see under the title in Google search results..."
                          value={form.meta_description}
                          onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                          style={{ borderRadius: '6px', fontSize: '12.5px' }}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-light border px-4"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    style={{ borderRadius: '8px', fontSize: '13.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4 d-flex align-items-center gap-2"
                    disabled={submitting}
                    style={{
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      backgroundColor: '#1DBF73',
                      borderColor: '#1DBF73',
                    }}
                  >
                    {submitting && <span className="spinner-border spinner-border-sm"></span>}
                    <span>{editingBlog ? 'Save Changes' : 'Publish Article'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {blogToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBlogToDelete(null)}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body text-center px-4 pb-4">
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '26px',
                  }}
                >
                  <i className="las la-trash-alt"></i>
                </div>
                <h5 className="fw-bold mb-2">Delete Blog Article?</h5>
                <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
                  Are you sure you want to permanently remove{' '}
                  <strong className="text-dark">"{blogToDelete.title}"</strong>? This action cannot be undone.
                </p>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light border px-4"
                    onClick={() => setBlogToDelete(null)}
                    disabled={deleting}
                    style={{ borderRadius: '8px', fontSize: '13.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 d-flex align-items-center gap-2"
                    onClick={confirmDelete}
                    disabled={deleting}
                    style={{ borderRadius: '8px', fontSize: '13.5px' }}
                  >
                    {deleting && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Delete Article</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
