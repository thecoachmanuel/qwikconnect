'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface DayItem {
  id: number;
  day: string;
  seller_id: number;
  status: number;
  total_day: number;
  schedules_count?: number;
}

interface ScheduleItem {
  id: number;
  day_id: number;
  seller_id: number;
  schedule: string;
  day?: string;
  status: number;
  allow_multiple_schedule: 'yes' | 'no';
}

const COMMON_SLOTS = [
  '08:00 AM - 10:00 AM',
  '09:00 AM - 11:00 AM',
  '10:00 AM - 12:00 PM',
  '11:00 AM - 01:00 PM',
  '01:00 PM - 03:00 PM',
  '02:00 PM - 04:00 PM',
  '03:00 PM - 05:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

export default function SellerSchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [totalDay, setTotalDay] = useState<number>(7);
  const [allowMultiple, setAllowMultiple] = useState<'yes' | 'no'>('no');
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Schedule Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDayId, setModalDayId] = useState<string>('all');
  const [modalSlot, setModalSlot] = useState('');
  const [submittingModal, setSubmittingModal] = useState(false);

  // Add Day state
  const [isAddDayOpen, setIsAddDayOpen] = useState(false);
  const [newDayName, setNewDayName] = useState('Mon');

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/schedules');
      const data = await res.json();
      if (data.success) {
        setDays(data.days || []);
        setSchedules(data.schedules || []);
        setTotalDay(data.total_day || 7);
        setAllowMultiple(data.allow_multiple_schedule || 'no');
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const handleSaveAllowMultiple = async (newVal: 'yes' | 'no') => {
    try {
      setSavingSettings(true);
      setFeedback(null);
      const res = await fetch('/api/seller/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_multiple', allow_multiple_schedule: newVal }),
      });
      const data = await res.json();
      if (data.success) {
        setAllowMultiple(newVal);
        setFeedback({ type: 'success', message: `Multiple booking per slot set to ${newVal.toUpperCase()}` });
        // Refresh schedules to reflect updated field
        setSchedules((prev) => prev.map((s) => ({ ...s, allow_multiple_schedule: newVal })));
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update setting' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating setting' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTotalDay = async (daysVal: number) => {
    try {
      setSavingSettings(true);
      const res = await fetch('/api/seller/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_total_day', total_day: daysVal }),
      });
      const data = await res.json();
      if (data.success) {
        setTotalDay(daysVal);
        setFeedback({ type: 'success', message: 'Advance service booking days updated successfully' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating advance days' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSlot.trim()) return;

    try {
      setSubmittingModal(true);
      setFeedback(null);
      const res = await fetch('/api/seller/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: modalDayId,
          schedule: modalSlot.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'New schedule slot(s) added successfully!' });
        setIsModalOpen(false);
        setModalSlot('');
        await fetchScheduleData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to create schedule' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating schedule' });
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule time slot?')) return;
    try {
      const res = await fetch(`/api/seller/schedules?id=${id}&type=schedule`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        setFeedback({ type: 'success', message: 'Schedule slot removed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete' });
    }
  };

  const handleAddDay = async () => {
    try {
      const res = await fetch('/api/seller/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_day', day: newDayName }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddDayOpen(false);
        setFeedback({ type: 'success', message: `Day ${newDayName} added` });
        await fetchScheduleData();
      } else {
        alert(data.message || 'Failed to add day');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding day');
    }
  };

  const handleDeleteDay = async (id: number, dayName: string) => {
    if (!confirm(`Delete ${dayName} and all its associated time slots?`)) return;
    try {
      const res = await fetch(`/api/seller/schedules?id=${id}&type=day`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDays((prev) => prev.filter((d) => d.id !== id));
        setSchedules((prev) => prev.filter((s) => s.day_id !== id));
        setFeedback({ type: 'success', message: `${dayName} and its slots were removed` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete day' });
    }
  };

  return (
    <DashboardLayout userRole="seller" title="Schedules & Time Slots">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1DBF73 0%, #159c5d 100%)',
            borderRadius: '12px',
            padding: '24px 28px',
            color: '#fff',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 15px rgba(29, 191, 115, 0.2)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              <i className="las la-calendar-check me-2"></i>
              Manage Service Schedules & Time Slots
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#ffffff', opacity: 0.95 }}>
              Control your available working days, daily hours, and prevent double-booking conflicts on client bookings.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#fff',
              color: '#1DBF73',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <i className="las la-plus-circle" style={{ fontSize: '18px' }}></i>
            Add Time Slot
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#047857' : '#b91c1c',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <i className={feedback.type === 'success' ? 'las la-check-circle' : 'las la-exclamation-circle'} style={{ fontSize: '20px' }}></i>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Grid: Left Settings & Right Day Badges */}
        <div className="row g-4 mb-4">
          {/* Policy Setting 1: Allow Multiple Booking */}
          <div className="col-md-6">
            <div
              style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="las la-user-clock" style={{ color: '#1DBF73', fontSize: '22px' }}></i>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Allow Multiple Bookings per Slot
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  When set to <strong>No</strong>, once a client books an order for a specific date and time slot, that slot is instantly blocked for that day to prevent schedule overlaps.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={allowMultiple}
                  disabled={savingSettings}
                  onChange={(e) => handleSaveAllowMultiple(e.target.value as 'yes' | 'no')}
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: allowMultiple === 'no' ? '#f0fdf4' : '#fff',
                    color: allowMultiple === 'no' ? '#166534' : '#1e293b',
                    flex: 1,
                  }}
                >
                  <option value="no">No (Strict Conflict Prevention - Recommended)</option>
                  <option value="yes">Yes (Allow Multiple Simultaneous Clients)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Policy Setting 2: Total Advance Service Days */}
          <div className="col-md-6">
            <div
              style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="las la-calendar-day" style={{ color: '#1DBF73', fontSize: '22px' }}></i>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Advance Booking Horizon
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Specify how many days in advance customers are permitted to book your scheduled services.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={totalDay}
                  disabled={savingSettings}
                  onChange={(e) => handleSaveTotalDay(Number(e.target.value))}
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                    flex: 1,
                  }}
                >
                  <option value={7}>7 Days Ahead (1 Week)</option>
                  <option value={14}>14 Days Ahead (2 Weeks)</option>
                  <option value={21}>21 Days Ahead (3 Weeks)</option>
                  <option value={30}>30 Days Ahead (1 Month)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Working Days Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            marginBottom: '28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="las la-business-time" style={{ color: '#1DBF73', fontSize: '20px' }}></i>
              Configured Working Days ({days.length})
            </h4>
            <button
              onClick={() => setIsAddDayOpen(true)}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="las la-plus"></i> Add Day
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {days.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1DBF73' }}></span>
                <span>{d.day}</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  ({d.schedules_count || 0} slots)
                </span>
                <button
                  onClick={() => handleDeleteDay(d.id, d.day)}
                  title={`Delete ${d.day}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <i className="las la-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Schedules Table */}
        <div
          style={{
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Active Service Time Slots ({schedules.length})
            </h4>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing all configured booking windows
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <i className="las la-spinner la-spin" style={{ fontSize: '32px', color: '#1DBF73', display: 'block', marginBottom: '12px' }}></i>
              Loading schedules and working hours...
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <i className="las la-calendar-times" style={{ fontSize: '42px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
              <p style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>No time slots created yet</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Click "Add Time Slot" above to define your service hours.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0, fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>#</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Working Day</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Time Slot Window</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Double Booking</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '12.5px' }}>
                          {s.day}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#334155' }}>
                        <i className="lar la-clock me-2" style={{ color: '#1DBF73' }}></i>
                        {s.schedule}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            backgroundColor: s.allow_multiple_schedule === 'yes' ? '#eff6ff' : '#fef2f2',
                            color: s.allow_multiple_schedule === 'yes' ? '#1d4ed8' : '#b91c1c',
                          }}
                        >
                          {s.allow_multiple_schedule === 'yes' ? 'Allowed' : 'Blocked on Booking'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="las la-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Schedule */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                padding: '24px 28px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  <i className="las la-plus-circle me-2" style={{ color: '#1DBF73' }}></i>
                  Add Service Time Slot
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <i className="las la-times"></i>
                </button>
              </div>

              <form onSubmit={handleCreateSchedule}>
                {/* Day Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Apply to Working Day *
                  </label>
                  <select
                    value={modalDayId}
                    onChange={(e) => setModalDayId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="all">⚡ Apply to ALL Working Days</option>
                    {days.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slot Window Input */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Time Slot Window *
                  </label>
                  <input
                    type="text"
                    value={modalSlot}
                    onChange={(e) => setModalSlot(e.target.value)}
                    placeholder="e.g. 09:00 AM - 11:00 AM"
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Preset Chips */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Quick Presets:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {COMMON_SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setModalSlot(s)}
                        style={{
                          backgroundColor: modalSlot === s ? '#1DBF73' : '#f1f5f9',
                          color: modalSlot === s ? '#fff' : '#334155',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '10px 18px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModal}
                    style={{
                      backgroundColor: '#1DBF73',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 22px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {submittingModal ? 'Saving...' : 'Add Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Day */}
        {isAddDayOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                padding: '24px 28px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#1e293b' }}>
                Add Working Day
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select Day
                </label>
                <select
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDayOpen(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDay}
                  style={{
                    backgroundColor: '#1DBF73',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
