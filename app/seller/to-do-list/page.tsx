'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface TodoItem {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: number; // 0 = pending/incomplete, 1 = completed
  created_at: string;
  updated_at?: string;
}

export default function SellerTodoListPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const loadTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/todos');
      if (res.ok) {
        const data = await res.json();
        if (data.todos) {
          setTodos(data.todos);
        }
      }
    } catch (err) {
      console.error('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingTodo(null);
    setForm({ title: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setForm({ title: todo.title, description: todo.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showNotification('Please enter a task title.', 'danger');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTodo) {
        // Edit
        const res = await fetch('/api/seller/todos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTodo.id,
            title: form.title,
            description: form.description,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setTodos((prev) =>
            prev.map((t) => (t.id === editingTodo.id ? { ...t, title: form.title, description: form.description } : t))
          );
          setShowModal(false);
          showNotification('Task updated successfully!');
        } else {
          showNotification(data.message || 'Failed to update task', 'danger');
        }
      } else {
        // Add
        const res = await fetch('/api/seller/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success && data.todo) {
          setTodos((prev) => [data.todo, ...prev]);
          setShowModal(false);
          showNotification('New task created successfully!');
        } else {
          showNotification(data.message || 'Failed to create task', 'danger');
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (todo: TodoItem) => {
    const nextStatus = todo.status === 1 ? 0 : 1;
    // Optimistic update
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t)));

    try {
      const res = await fetch('/api/seller/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todo.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t)));
        showNotification('Failed to toggle status', 'danger');
      }
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t)));
      showNotification('Network error', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/seller/todos?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        showNotification('Task deleted successfully');
      } else {
        showNotification(data.message || 'Failed to delete task', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    }
  };

  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.status === 1).length;
  const pendingTasks = todos.filter((t) => t.status === 0).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTodos = todos.filter((t) => {
    if (filter === 'pending' && t.status !== 0) return false;
    if (filter === 'completed' && t.status !== 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <DashboardLayout userRole="seller" title="To-Do Checklist">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>To-Do List & Daily Tasks</h4>
          <p className="text-muted small mb-0">Organize your daily service operations, equipment preparation, and client follow-ups</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          onClick={handleOpenAdd}
        >
          <i className="las la-plus-circle fs-5"></i> Add New Task
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Total Tasks</p>
                <h4 className="fw-bold mb-0 text-dark">{totalTasks}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#f0fdf4' }}>
                <i className="las la-tasks fs-4 text-success"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Pending Tasks</p>
                <h4 className="fw-bold mb-0 text-warning">{pendingTasks}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#fffbeb' }}>
                <i className="las la-hourglass-half fs-4 text-warning"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Completed</p>
                <h4 className="fw-bold mb-0 text-success">{completedTasks}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#f0fdf4' }}>
                <i className="las la-check-double fs-4 text-success"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Progress Rate</p>
                <h4 className="fw-bold mb-0 text-info">{completionRate}%</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#f0f9ff' }}>
                <i className="las la-chart-pie fs-4 text-info"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Tabs */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({totalTasks})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'pending' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingTasks})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'completed' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedTasks})
            </button>
          </div>

          {/* Search */}
          <div className="position-relative" style={{ maxWidth: 300, width: '100%' }}>
            <input
              type="text"
              className="form-control form-control-sm ps-5 rounded-pill"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="las la-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 text-dark">Checklist Items</h6>
          <span className="badge bg-light text-dark border">{filteredTodos.length} items shown</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted small mt-2">Loading your to-do checklist...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-5">
              <div className="rounded-circle bg-light d-inline-flex p-3 mb-3">
                <i className="las la-clipboard-check fs-1 text-muted"></i>
              </div>
              <h6 className="fw-bold text-dark">No tasks found</h6>
              <p className="text-muted small mb-3">
                {searchQuery ? 'No tasks match your search criteria.' : 'You have not added any tasks to your checklist yet.'}
              </p>
              <button
                className="btn btn-sm text-white fw-medium"
                style={{ backgroundColor: '#1DBF73' }}
                onClick={handleOpenAdd}
              >
                <i className="las la-plus me-1"></i> Add Your First Task
              </button>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredTodos.map((todo) => {
                const isDone = todo.status === 1;
                return (
                  <div
                    key={todo.id}
                    className="list-group-item p-3 d-flex align-items-start gap-3 transition"
                    style={{
                      backgroundColor: isDone ? '#fafafa' : '#ffffff',
                    }}
                  >
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{
                          width: 20,
                          height: 20,
                          cursor: 'pointer',
                          borderColor: isDone ? '#1DBF73' : '#cbd5e1',
                          backgroundColor: isDone ? '#1DBF73' : '#ffffff',
                        }}
                        checked={isDone}
                        onChange={() => handleToggleStatus(todo)}
                        title={isDone ? 'Mark as pending' : 'Mark as complete'}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <h6
                          className={`mb-0 fw-bold ${isDone ? 'text-decoration-line-through text-muted' : 'text-dark'}`}
                          style={{ fontSize: '15px' }}
                        >
                          {todo.title}
                        </h6>
                        {isDone ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0" style={{ fontSize: '11px' }}>
                            <i className="las la-check me-1"></i> Done
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0" style={{ fontSize: '11px' }}>
                            <i className="las la-clock me-1"></i> Pending
                          </span>
                        )}
                      </div>

                      {todo.description && (
                        <p
                          className={`small mb-2 ${isDone ? 'text-decoration-line-through text-muted' : 'text-secondary'}`}
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {todo.description}
                        </p>
                      )}

                      <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '12px' }}>
                        <span>
                          <i className="las la-calendar me-1"></i>
                          {new Date(todo.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      <button
                        className="btn btn-sm btn-outline-secondary border-0"
                        title="Edit Task"
                        onClick={() => handleOpenEdit(todo)}
                      >
                        <i className="las la-edit fs-5"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger border-0"
                        title="Delete Task"
                        onClick={() => handleDelete(todo.id)}
                      >
                        <i className="las la-trash fs-5"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal (Add / Edit) */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  <i className={`las ${editingTodo ? 'la-edit' : 'la-plus-circle'} me-2 text-success`}></i>
                  {editingTodo ? 'Edit Task' : 'Add New Task'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Task Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Inspect plumbing drain seal at client location"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Description & Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Add details, materials needed, customer phone or instructions..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-light border px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold px-4"
                    style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Saving...
                      </>
                    ) : editingTodo ? (
                      'Update Task'
                    ) : (
                      'Save Task'
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
