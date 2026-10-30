'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { formatNaira } from '@/lib/currency';

interface FavoriteItem {
  id: number;
  user_id: number;
  service_id: number;
  created_at: string;
  service: {
    id: number;
    title: string;
    slug: string;
    price: number;
    image?: string;
    category_slug?: string;
    city?: string;
    country?: string;
    seller_id?: number;
    seller?: {
      id?: number;
      name?: string;
      username?: string;
      image?: string;
    };
  };
}

export default function BuyerFavoritesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Direct Booking Modal State
  const [bookingService, setBookingService] = useState<FavoriteItem['service'] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Default tomorrow date for minimum date picker
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date: tomorrowStr,
    schedule: '09:00 AM - 12:00 PM',
    payment_gateway: 'paystack',
    order_note: '',
  });

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/favorites');
      if (res.ok) {
        const data = await res.json();
        if (data.favorites) {
          setFavorites(data.favorites);
        }
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  // Pre-fill user data when session loads
  useEffect(() => {
    if (session?.user) {
      setBookingForm((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || '',
        email: prev.email || session.user?.email || '',
      }));
    }
  }, [session]);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleRemoveFavorite = async (serviceId: number) => {
    const removedItem = favorites.find((f) => f.service_id === serviceId);
    setFavorites((prev) => prev.filter((f) => f.service_id !== serviceId));

    try {
      const res = await fetch('/api/buyer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Service removed from favorites');
      } else {
        if (removedItem) setFavorites((prev) => [...prev, removedItem]);
        showNotification('Failed to remove service', 'danger');
      }
    } catch (err: any) {
      if (removedItem) setFavorites((prev) => [...prev, removedItem]);
      showNotification(err.message || 'Network error', 'danger');
    }
  };

  const openQuickBookModal = (svc: FavoriteItem['service']) => {
    setBookingService(svc);
    setBookingError('');
    setBookingForm((prev) => ({
      ...prev,
      name: prev.name || session?.user?.name || '',
      email: prev.email || session?.user?.email || '',
      phone: prev.phone || '+234 ',
      address: prev.address || '',
      date: prev.date || tomorrowStr,
      schedule: prev.schedule || '09:00 AM - 12:00 PM',
      payment_gateway: 'paystack',
      order_note: '',
    }));
  };

  const closeQuickBookModal = () => {
    setBookingService(null);
    setBookingError('');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService) return;

    if (!bookingForm.name.trim() || !bookingForm.email.trim() || !bookingForm.phone.trim() || !bookingForm.address.trim()) {
      setBookingError('Please fill in your name, email, phone number, and address.');
      return;
    }

    setIsSubmitting(true);
    setBookingError('');

    try {
      const sellerId = Number(bookingService.seller_id || bookingService.seller?.id || 2);
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: Number(bookingService.id),
          seller_id: sellerId,
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          phone: bookingForm.phone.trim(),
          address: bookingForm.address.trim(),
          date: bookingForm.date,
          schedule: bookingForm.schedule,
          package_fee: Number(bookingService.price),
          extra_service: 0,
          tax: 0,
          total: Number(bookingService.price),
          payment_gateway: bookingForm.payment_gateway,
          order_note: bookingForm.order_note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to place booking.');
        setIsSubmitting(false);
        return;
      }

      // Handle Electronic Checkout (Paystack / Flutterwave)
      if (bookingForm.payment_gateway && bookingForm.payment_gateway !== 'cash_on_delivery' && bookingForm.payment_gateway !== 'cod') {
        const payRes = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderId,
            gateway: bookingForm.payment_gateway,
          }),
        });

        const payData = await payRes.json();
        if (!payRes.ok) {
          setBookingError(payData.message || 'Payment initiation failed. Please try another method.');
          setIsSubmitting(false);
          return;
        }

        if (payData.redirectUrl) {
          window.location.href = payData.redirectUrl;
          return;
        }
      }

      // Cash on delivery / direct success
      closeQuickBookModal();
      router.push(`/order-success?order_id=${data.orderId}&invoice=${data.invoice}`);
    } catch (err: any) {
      setBookingError(err?.message || 'Something went wrong while processing your booking.');
      setIsSubmitting(false);
    }
  };

  const filteredFavorites = favorites.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.service?.title?.toLowerCase().includes(q) ||
      f.service?.category_slug?.toLowerCase().includes(q) ||
      f.service?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout userRole="buyer" title="Saved Favorites">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Saved Services & Bookmarks</h4>
          <p className="text-muted small mb-0">Directly book and manage your saved home and professional services</p>
        </div>
        <Link
          href="/service-list"
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
        >
          <i className="las la-search fs-5"></i> Browse More Services
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Search Bar */}
      {favorites.length > 0 && (
        <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
          <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <span className="fw-semibold text-dark small">
              You have <strong style={{ color: 'var(--main-color-one)' }}>{favorites.length}</strong> saved {favorites.length === 1 ? 'service' : 'services'} ready to book
            </span>
            <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
              <input
                type="text"
                className="form-control form-control-sm ps-5 rounded-pill"
                placeholder="Search saved services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="las la-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--main-color-one)' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2">Loading your favorite services...</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white text-center py-5 px-3">
          <div className="rounded-circle bg-light d-inline-flex p-3 mx-auto mb-3" style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
            <i className="las la-heart fs-1 text-danger"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">
            {searchQuery ? 'No matching saved services' : 'No favorites saved yet'}
          </h5>
          <p className="text-muted small mb-4" style={{ maxWidth: 420, margin: '0 auto' }}>
            {searchQuery
              ? 'Try modifying your search keywords to locate your bookmarked services.'
              : 'Save services while browsing to compare prices, read reviews, and book directly anytime.'}
          </p>
          <div>
            <Link
              href="/service-list"
              className="btn text-white fw-bold px-4"
              style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
            >
              <i className="las la-search me-1"></i> Discover Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredFavorites.map((fav) => {
            const svc = fav.service;
            if (!svc) return null;
            const detailUrl = `/service-list/${svc.slug}`;
            const bookUrl = `/service-list/book/${svc.slug}`;

            return (
              <div key={fav.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden h-100 bg-white d-flex flex-column" style={{ transition: 'all 0.2s ease-in-out' }}>
                  {/* Thumbnail */}
                  <div className="position-relative" style={{ height: 200, backgroundColor: '#f1f5f9' }}>
                    <Link href={detailUrl} style={{ display: 'block', width: '100%', height: '100%' }}>
                      <img
                        src={svc.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                        alt={svc.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>

                    {/* Remove from favorites button */}
                    <div className="position-absolute top-0 end-0 p-3">
                      <button
                        className="btn btn-sm btn-light rounded-circle shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36, color: '#ef4444' }}
                        title="Remove from favorites"
                        onClick={() => handleRemoveFavorite(svc.id)}
                      >
                        <i className="las la-heart fs-5"></i>
                      </button>
                    </div>

                    {/* Location Badge */}
                    {svc.city && (
                      <div className="position-absolute bottom-0 start-0 m-3">
                        <span className="badge bg-dark bg-opacity-75 text-white small px-2 py-1" style={{ backdropFilter: 'blur(4px)' }}>
                          <i className="las la-map-marker-alt me-1 text-danger"></i>
                          {svc.city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-3 d-flex flex-column flex-grow-1">
                    <div className="mb-2 d-flex align-items-center justify-content-between">
                      <span
                        className="badge small px-2 py-1"
                        style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '11px', textTransform: 'uppercase' }}
                      >
                        {svc.category_slug ? svc.category_slug.replace('-', ' ') : 'Verified Service'}
                      </span>
                      <span className="small text-muted" style={{ fontSize: '12px' }}>
                        <i className="las la-shield-alt text-success me-1"></i>Verified Pro
                      </span>
                    </div>

                    <h6 className="fw-bold text-dark mb-2 line-clamp-2" style={{ lineHeight: 1.4, minHeight: '40px' }}>
                      <Link href={detailUrl} className="text-decoration-none text-dark hover-primary">
                        {svc.title}
                      </Link>
                    </h6>

                    <div className="d-flex align-items-center gap-1 text-warning small mb-3">
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <span className="text-muted ms-1 fw-semibold">(5.0)</span>
                    </div>

                    <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Starting at</small>
                        <strong className="fs-5" style={{ color: 'var(--main-color-one)', fontWeight: 800 }}>
                          {formatNaira(svc.price)}
                        </strong>
                      </div>

                      {/* Booking Action Buttons */}
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openQuickBookModal(svc)}
                          className="btn btn-sm text-white fw-bold px-3 py-2 rounded-2 shadow-sm d-flex align-items-center gap-1"
                          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                          title="Instant Direct Booking"
                        >
                          <i className="las la-bolt fs-6"></i>
                          <span>Quick Book</span>
                        </button>
                        <Link
                          href={bookUrl}
                          className="btn btn-sm btn-outline-secondary fw-semibold px-2 py-2 rounded-2"
                          title="Full Booking Page & Add-ons"
                        >
                          <i className="las la-external-link-alt fs-6"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ DIRECT QUICK BOOKING MODAL ═══ */}
      {bookingService && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            overflowY: 'auto',
          }}
          onClick={closeQuickBookModal}
        >
          <div
            className="card border-0 shadow-lg rounded-3 bg-white w-100 my-auto"
            style={{ maxWidth: 580, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-3 d-flex align-items-center justify-content-between text-white"
              style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 191, 115, 0.2)',
                    color: 'var(--main-color-one)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="las la-calendar-check fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-white">Direct Service Booking</h6>
                  <small style={{ color: '#94a3b8', fontSize: '11.5px' }}>Instant checkout directly from your saved favorites</small>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-white text-decoration-none p-1"
                onClick={closeQuickBookModal}
                disabled={isSubmitting}
                aria-label="Close"
              >
                <i className="las la-times fs-4"></i>
              </button>
            </div>

            {/* Service Summary Banner */}
            <div className="p-3 bg-light border-bottom d-flex align-items-center gap-3">
              <img
                src={bookingService.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                alt={bookingService.title}
                style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
              <div className="flex-grow-1 overflow-hidden">
                <span className="badge bg-success-subtle text-success border border-success-subtle small px-2 py-0 mb-1">
                  {bookingService.city || 'Lagos, Nigeria'}
                </span>
                <h6 className="fw-bold text-dark mb-1 text-truncate" style={{ fontSize: '14px' }}>
                  {bookingService.title}
                </h6>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="text-muted small">Package Price:</span>
                  <strong style={{ color: 'var(--main-color-one)', fontSize: '16px' }}>
                    {formatNaira(bookingService.price)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleBookingSubmit} className="p-4">
              {bookingError && (
                <div className="alert alert-danger py-2 px-3 small rounded-2 mb-3 d-flex align-items-center gap-2">
                  <i className="las la-exclamation-triangle fs-5"></i>
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="row g-3">
                {/* Preferred Date */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    <i className="las la-calendar me-1 text-success"></i> Preferred Date *
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    required
                    className="form-control form-control-sm"
                    style={{ height: '42px', fontSize: '13.5px' }}
                  />
                </div>

                {/* Preferred Schedule Slot */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    <i className="las la-clock me-1 text-success"></i> Time Slot *
                  </label>
                  <select
                    value={bookingForm.schedule}
                    onChange={(e) => setBookingForm({ ...bookingForm, schedule: e.target.value })}
                    className="form-select form-select-sm"
                    style={{ height: '42px', fontSize: '13.5px' }}
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Evening (03:00 PM - 06:00 PM)</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    placeholder="e.g. Emma Watson"
                    required
                    className="form-control form-control-sm"
                    style={{ height: '42px', fontSize: '13.5px' }}
                  />
                </div>

                {/* Phone */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    required
                    className="form-control form-control-sm"
                    style={{ height: '42px', fontSize: '13.5px' }}
                  />
                </div>

                {/* Service Address */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-dark mb-1">
                    <i className="las la-map-pin me-1 text-danger"></i> Service / Delivery Address *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                    placeholder="e.g. 14 Victoria Island, Lagos or Maitama, Abuja"
                    required
                    className="form-control form-control-sm"
                    style={{ height: '42px', fontSize: '13.5px' }}
                  />
                </div>

                {/* Payment Gateway Selection */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-dark mb-2">
                    <i className="las la-wallet me-1 text-primary"></i> Select Payment Method *
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <label
                      className={`p-2 border rounded-2 d-flex align-items-center justify-content-between cursor-pointer ${
                        bookingForm.payment_gateway === 'paystack' ? 'border-success bg-success-subtle' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="quick_payment_gateway"
                          value="paystack"
                          checked={bookingForm.payment_gateway === 'paystack'}
                          onChange={() => setBookingForm({ ...bookingForm, payment_gateway: 'paystack' })}
                          style={{ accentColor: 'var(--main-color-one)' }}
                        />
                        <span className="small fw-semibold text-dark">Paystack (Debit Card, Bank Transfer, USSD)</span>
                      </div>
                      <span className="badge bg-success text-white small" style={{ fontSize: '10px' }}>Recommended</span>
                    </label>

                    <label
                      className={`p-2 border rounded-2 d-flex align-items-center justify-content-between cursor-pointer ${
                        bookingForm.payment_gateway === 'flutterwave' ? 'border-success bg-success-subtle' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="quick_payment_gateway"
                          value="flutterwave"
                          checked={bookingForm.payment_gateway === 'flutterwave'}
                          onChange={() => setBookingForm({ ...bookingForm, payment_gateway: 'flutterwave' })}
                          style={{ accentColor: 'var(--main-color-one)' }}
                        />
                        <span className="small fw-semibold text-dark">Flutterwave (Cards, Barter, Mobile Money)</span>
                      </div>
                      <span className="badge bg-warning text-dark small" style={{ fontSize: '10px' }}>Fast</span>
                    </label>

                    <label
                      className={`p-2 border rounded-2 d-flex align-items-center justify-content-between cursor-pointer ${
                        bookingForm.payment_gateway === 'cash_on_delivery' ? 'border-success bg-success-subtle' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="quick_payment_gateway"
                          value="cash_on_delivery"
                          checked={bookingForm.payment_gateway === 'cash_on_delivery'}
                          onChange={() => setBookingForm({ ...bookingForm, payment_gateway: 'cash_on_delivery' })}
                          style={{ accentColor: 'var(--main-color-one)' }}
                        />
                        <span className="small fw-semibold text-dark">Cash on Delivery / Service Completion</span>
                      </div>
                      <i className="las la-hand-holding-usd text-success fs-5"></i>
                    </label>
                  </div>
                </div>

                {/* Special Instructions (Optional) */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-dark mb-1">Order Notes / Specific Requirements (Optional)</label>
                  <textarea
                    rows={2}
                    value={bookingForm.order_note}
                    onChange={(e) => setBookingForm({ ...bookingForm, order_note: e.target.value })}
                    placeholder="Provide any gate code, landmark, or specific instructions for the specialist..."
                    className="form-control form-control-sm"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-3 p-3 bg-light rounded-2 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small d-block">Total to Pay:</span>
                  <strong style={{ color: '#0f172a', fontSize: '18px' }}>
                    {formatNaira(bookingService.price)}
                  </strong>
                </div>
                <Link
                  href={`/service-list/book/${bookingService.slug}`}
                  className="small text-decoration-none fw-semibold d-flex align-items-center gap-1"
                  style={{ color: '#0284c7' }}
                  onClick={closeQuickBookModal}
                >
                  <span>Need extra add-on features?</span>
                  <i className="las la-angle-right"></i>
                </Link>
              </div>

              {/* Buttons */}
              <div className="d-flex align-items-center justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-sm btn-light fw-semibold px-3 py-2"
                  onClick={closeQuickBookModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-sm text-white fw-bold px-4 py-2 rounded-2 shadow-sm d-flex align-items-center gap-2"
                  style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Processing Booking...</span>
                    </>
                  ) : (
                    <>
                      <i className="las la-check-circle fs-5"></i>
                      <span>Confirm & Book Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
