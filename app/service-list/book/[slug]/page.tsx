'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FrontendLayout from '@/components/layout/FrontendLayout';
import { formatNaira } from '@/lib/currency';
import PaystackIcon from '@/components/icons/PaystackIcon';

interface BookingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BookingContent({ params }: BookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = use(params);
  const { data: session } = useSession();

  // Dynamic Service State
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    async function loadService() {
      try {
        const res = await fetch(`/api/services/by-slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.service) {
            setService(data.service);
            const providerCity = data.service.city || data.service.seller?.service_city || 'Lagos';
            setFormData((prev) => ({
              ...prev,
              city: prev.city || providerCity,
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to load service by slug:', e);
      }
    }
    loadService();
  }, [slug]);

  // Form states initialized synchronously from localStorage cache
  const [formData, setFormData] = useState(() => {
    let initialName = '';
    let initialEmail = '';
    let initialPhone = '';
    let initialAddress = '';
    let initialCity = '';
    let initialArea = '';
    let initialPostCode = '';

    if (typeof window !== 'undefined') {
      try {
        const cachedStr =
          localStorage.getItem('qixer_user_profile') ||
          localStorage.getItem('qixer_profile_buyer') ||
          localStorage.getItem('qixer_profile_seller') ||
          localStorage.getItem('qixer_profile_admin') ||
          localStorage.getItem('qixer_user');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && typeof cached === 'object') {
            initialName = cached.name || cached.username || '';
            initialEmail = cached.email || '';
            initialPhone = cached.phone || '';
            initialAddress = cached.address || '';
            initialCity = cached.city || cached.service_city || '';
            initialArea = cached.area || '';
            initialPostCode = cached.post_code || '';
          }
        }
      } catch (e) {}
    }

    return {
      name: initialName,
      email: initialEmail,
      phone: initialPhone,
      address: initialAddress,
      city: initialCity,
      area: initialArea,
      country: 'Nigeria',
      post_code: initialPostCode,
      date: new Date().toISOString().split('T')[0],
      schedule: '09:00 AM - 12:00 PM',
      payment_gateway: 'paystack',
      order_note: '',
    };
  });

  // Sync profile data from active session if empty
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || (session.user as any)?.username || '',
        email: prev.email || session.user?.email || '',
        phone: prev.phone || (session.user as any)?.phone || '',
        address: prev.address || (session.user as any)?.address || '',
      }));
    }
  }, [session]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active Gateways State (synchronizes dynamically in real-time with Admin Payment Settings)
  const [activeGateways, setActiveGateways] = useState<any[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);
  const [usdExchangeRate, setUsdExchangeRate] = useState<number>(1500);
  const [escrowConfig, setEscrowConfig] = useState<any>(null);

  useEffect(() => {
    async function loadActiveGateways() {
      try {
        setGatewaysLoading(true);
        const res = await fetch('/api/payments/active-gateways');
        if (res.ok) {
          const data = await res.json();
          if (data.usdExchangeRate) {
            setUsdExchangeRate(Number(data.usdExchangeRate) || 1500);
          }
          if (data.escrow) {
            setEscrowConfig(data.escrow);
          }
          if (Array.isArray(data.gateways)) {
            setActiveGateways(data.gateways);
            if (data.gateways.length > 0) {
              setFormData((prev) => {
                const stillValid = data.gateways.some(
                  (g: any) => g.id === prev.payment_gateway || (g.id === 'cod' && prev.payment_gateway === 'cash_on_delivery')
                );
                return stillValid ? prev : { ...prev, payment_gateway: data.gateways[0].id };
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load active payment gateways:', err);
      } finally {
        setGatewaysLoading(false);
      }
    }
    loadActiveGateways();
  }, []);

  // Selected addons from query params
  const addonsParam = searchParams.get('addons');
  const selectedAddonIds = addonsParam ? addonsParam.split(',').map((s) => s.trim()) : [];

  const basePrice = service?.price ? Number(service.price) : 35000.0;
  const serviceTitle = service?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const serviceId = service?.id ? Number(service.id) : 1;
  const sellerId = service?.seller_id ? Number(service.seller_id) : 2;

  // Dynamic seller working days & real-time slot checking
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState<boolean>(true);
  const [scheduleNotice, setScheduleNotice] = useState<string>('');

  useEffect(() => {
    async function loadSchedules() {
      if (!formData.date || !sellerId) return;
      try {
        setSchedulesLoading(true);
        setScheduleNotice('');
        const res = await fetch(`/api/schedules/available?seller_id=${sellerId}&date=${formData.date}`);
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.schedules) && data.schedules.length > 0) {
          setAvailableSchedules(data.schedules);
          const hasCurrent = data.schedules.some((s: any) => s.schedule === formData.schedule);
          if (!hasCurrent) {
            setFormData((prev) => ({ ...prev, schedule: data.schedules[0].schedule }));
          }
        } else {
          // Fallback business time slots so preferred slot is always selectable
          const defaultFallback = [
            { id: 101, schedule: '09:00 AM - 11:00 AM' },
            { id: 102, schedule: '11:00 AM - 01:00 PM' },
            { id: 103, schedule: '02:00 PM - 04:00 PM' },
            { id: 104, schedule: '04:00 PM - 06:00 PM' },
          ];
          setAvailableSchedules(defaultFallback);
          setFormData((prev) => ({
            ...prev,
            schedule: prev.schedule || defaultFallback[0].schedule,
          }));
        }
      } catch (err) {
        console.warn('Failed to load slots:', err);
        const defaultFallback = [
          { id: 101, schedule: '09:00 AM - 11:00 AM' },
          { id: 102, schedule: '11:00 AM - 01:00 PM' },
          { id: 103, schedule: '02:00 PM - 04:00 PM' },
          { id: 104, schedule: '04:00 PM - 06:00 PM' },
        ];
        setAvailableSchedules(defaultFallback);
        setFormData((prev) => ({ ...prev, schedule: prev.schedule || defaultFallback[0].schedule }));
      } finally {
        setSchedulesLoading(false);
      }
    }
    loadSchedules();
  }, [sellerId, formData.date]);

  let extraServiceTotal = 0;
  const activeAddons: any[] = [];
  if (service?.additionals && Array.isArray(service.additionals)) {
    for (const add of service.additionals) {
      if (selectedAddonIds.includes(String(add.id))) {
        const price = Number(add.additional_service_price || 0);
        extraServiceTotal += price;
        activeAddons.push({
          id: add.id,
          title: add.additional_service_title,
          price,
        });
      }
    }
  }

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; discount_type: string } | null>(null);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotalWithoutCoupon = basePrice + extraServiceTotal;

  // Dynamic Escrow Fee Calculation (default 0)
  let escrowFee = 0;
  if (escrowConfig?.enabled && (escrowConfig.payer === 'buyer' || escrowConfig.payer === 'split')) {
    const rate = Number(escrowConfig.rate ?? 0);
    const rawFee = escrowConfig.type === 'fixed' ? rate : (subtotalWithoutCoupon * rate) / 100;
    escrowFee = Math.round(escrowConfig.payer === 'split' ? rawFee / 2 : rawFee);
  }

  const finalTotal = Math.max(0, subtotalWithoutCoupon - couponDiscountAmount + escrowFee);

  // Dynamic currency conversion calculation for international gateways (Stripe & PayPal)
  const selectedGatewayObj = activeGateways.find(
    (g: any) => g.id === formData.payment_gateway || (g.id === 'cod' && formData.payment_gateway === 'cash_on_delivery')
  );
  const isUsdSelected = Boolean(selectedGatewayObj?.isUsd || formData.payment_gateway === 'stripe' || formData.payment_gateway === 'paypal');
  const usdRate = Number(usdExchangeRate) > 0 ? Number(usdExchangeRate) : 1500;
  const toUsd = (amount: number) => (Number(amount || 0) / usdRate).toFixed(2);
  const equivalentUsd = toUsd(finalTotal);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: subtotalWithoutCoupon,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid coupon code');
      }
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        discount_type: data.discount_type,
      });
      setCouponDiscountAmount(data.discount_amount);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Pre-flight client-side validations
    if (!formData.name || formData.name.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      setIsLoading(false);
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setIsLoading(false);
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!formData.phone || formData.phone.trim().length < 5) {
      setErrorMessage('Please enter a valid contact phone number (at least 5 digits).');
      setIsLoading(false);
      const phoneInput = document.getElementById('phone');
      if (phoneInput) {
        phoneInput.focus();
        phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!formData.address || formData.address.trim().length < 3) {
      setErrorMessage('Please enter your full service street address.');
      setIsLoading(false);
      const addressInput = document.getElementById('address');
      if (addressInput) {
        addressInput.focus();
        addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!formData.schedule) {
      setErrorMessage('Please select an available service time slot.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          seller_id: sellerId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city || (service?.city || service?.seller?.service_city || 'Lagos'),
          area: formData.area || '',
          country: formData.country || 'Nigeria',
          post_code: formData.post_code,
          date: formData.date,
          schedule: formData.schedule,
          package_fee: basePrice,
          extra_service: extraServiceTotal,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          coupon_discount: couponDiscountAmount,
          tax: 0,
          total: finalTotal,
          payment_gateway: formData.payment_gateway,
          order_note: formData.order_note,
          selected_addons: activeAddons,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to place booking.');
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-orders-changed'));
          window.dispatchEvent(new CustomEvent('qixer-wallet-changed'));
        }
        if (formData.payment_gateway && formData.payment_gateway !== 'cash_on_delivery' && formData.payment_gateway !== 'cod') {
          const payRes = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              gateway: formData.payment_gateway,
            }),
          });
          const payData = await payRes.json();
          if (!payRes.ok) {
            setErrorMessage(payData.message || 'Payment initiation failed. Please check your payment details or choose another payment method.');
            setIsLoading(false);
            return;
          }
          if (payData.redirectUrl) {
            window.location.href = payData.redirectUrl;
            return;
          }
        }
        router.push(`/order-success?order_id=${data.orderId}&invoice=${data.invoice}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FrontendLayout>
      <div className="site-wrapper">
      <div className="banner-inner-area section-bg-2 padding-top-40 padding-bottom-40" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container container-two">
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Complete Your Service Booking
          </h2>
          <ul style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
            <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
            <li>/</li>
            <li><Link href={`/service-list/${slug}`} style={{ color: 'var(--main-color-one)' }}>Service Details</Link></li>
            <li>/</li>
            <li>Checkout</li>
          </ul>
        </div>
      </div>

      <div className="booking-area padding-top-60 padding-bottom-100" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <style dangerouslySetInnerHTML={{ __html: `
            .booking-summary-card {
              background-color: #fff;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 5px 25px rgba(0,0,0,0.05);
              border: 1px solid #e2e8f0;
            }
            @media (min-width: 992px) {
              .booking-summary-card {
                position: sticky;
                top: 120px;
                z-index: 10;
              }
            }
            @media (max-width: 991px) {
              .booking-summary-card {
                position: static !important;
                top: auto !important;
                margin-top: 24px;
              }
            }
            @media (max-width: 768px) {
              .booking-area input, .booking-area select, .booking-area textarea {
                font-size: 16px !important;
              }
            }
          `}} />

          {/* Mobile Top Service Banner: Shows package details immediately on mobile */}
          <div className="d-lg-none mb-4 p-3 rounded-3 bg-white border shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Selected Service {activeAddons.length > 0 && `(+${activeAddons.length} add-on${activeAddons.length > 1 ? 's' : ''})`}
                </span>
                <strong className="text-dark" style={{ fontSize: '15px' }}>{serviceTitle}</strong>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Total Fee</span>
                <strong style={{ fontSize: '18px', color: 'var(--main-color-one)' }}>₦{finalTotal.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-5">
              {/* Left Column: Booking Form */}
              <div className="col-lg-8">
                {/* 1. Date & Time Selection */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '28px',
                    marginBottom: '25px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  }}
                >
                  <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="las la-calendar-check" style={{ color: 'var(--main-color-one)', fontSize: '24px' }}></i>
                    1. Select Service Date & Time
                  </h4>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Time Slot *
                      </label>
                      {schedulesLoading ? (
                        <div style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', padding: '0 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <i className="las la-spinner la-spin" style={{ color: 'var(--main-color-one)', fontSize: '18px' }}></i>
                          Loading seller available time slots...
                        </div>
                      ) : availableSchedules.length > 0 ? (
                        <select
                          name="schedule"
                          value={formData.schedule}
                          onChange={handleChange}
                          required
                          style={{
                            width: '100%',
                            height: '48px',
                            padding: '0 16px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#fff',
                            color: '#1e293b',
                            fontWeight: 500,
                          }}
                        >
                          {availableSchedules.map((s: any) => (
                            <option key={s.id} value={s.schedule}>
                              {s.schedule}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ height: '48px', display: 'flex', alignItems: 'center', color: '#dc2626', fontSize: '13px', padding: '0 14px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                          <i className="las la-exclamation-circle me-2" style={{ fontSize: '16px' }}></i>
                          No available slots on this date
                        </div>
                      )}
                    </div>

                    {scheduleNotice && (
                      <div className="col-12">
                        <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="las la-calendar-times" style={{ fontSize: '18px', flexShrink: 0 }}></i>
                          <span>{scheduleNotice} Please choose another date.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Customer Contact & Location */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '28px',
                    marginBottom: '25px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  }}
                >
                  <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one)', fontSize: '24px' }}></i>
                    2. Contact Information & Service Address
                  </h4>

                  {/* PHP Location Safeguard Notice */}
                  <div
                    className="alert alert-info d-flex align-items-center gap-3 p-3 mb-4 rounded-3"
                    style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                  >
                    <i className="las la-info-circle fs-3 flex-shrink-0" style={{ color: '#0284c7' }}></i>
                    <div style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
                      <strong>Service Location Notice:</strong> This service provider operates primarily in{' '}
                      <strong>{service?.city || service?.seller?.service_city || 'Lagos, Nigeria'}</strong>. Standard rates apply to service addresses within this coverage city.
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Your Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Adebayo Johnson"
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Email Address */}
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Your Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. adebayo@example.com"
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 08012345678"
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Country */}
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        readOnly
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Service City / State *
                      </label>
                      <select
                        name="city"
                        value={formData.city || (service?.city || service?.seller?.service_city || 'Lagos')}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff',
                        }}
                      >
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja (FCT)</option>
                        <option value="Port Harcourt">Port Harcourt (Rivers)</option>
                        <option value="Ibadan">Ibadan (Oyo)</option>
                        <option value="Benin City">Benin City (Edo)</option>
                        <option value="Enugu">Enugu</option>
                        <option value="Abeokuta">Abeokuta (Ogun)</option>
                        <option value="Kano">Kano</option>
                        <option value="Kaduna">Kaduna</option>
                        <option value="Asaba">Asaba (Delta)</option>
                        <option value="Warri">Warri (Delta)</option>
                        <option value="Calabar">Calabar (Cross River)</option>
                        <option value="Uyo">Uyo (Akwa Ibom)</option>
                        <option value="Other">Other City (Cross-State)</option>
                      </select>
                      {formData.city && formData.city !== (service?.city || service?.seller?.service_city || 'Lagos') && (
                        <small className="text-warning d-block mt-1" style={{ fontSize: '12px' }}>
                          <i className="las la-exclamation-triangle me-1"></i>
                          Provider is based in {service?.city || service?.seller?.service_city || 'Lagos'}. Booking in another city may require provider travel/logistics coordination.
                        </small>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Service Area / District / LGA *
                      </label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="e.g. Ikeja, Lekki Phase 1, Garki, Wuse 2..."
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="post_code"
                        value={formData.post_code}
                        onChange={handleChange}
                        placeholder="101241"
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div className="col-12">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Full Street Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. 15 Adeola Odeku Street, Victoria Island"
                        required
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div className="col-12">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Order Notes & Instructions (Optional)
                      </label>
                      <textarea
                        name="order_note"
                        value={formData.order_note}
                        onChange={handleChange}
                        placeholder="Any special requests, gate codes, parking instructions..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  }}
                >
                  <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="las la-credit-card" style={{ color: 'var(--main-color-one)', fontSize: '24px' }}></i>
                    3. Choose Payment Method
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gatewaysLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        <i className="las la-spinner la-spin" style={{ fontSize: '24px', color: 'var(--main-color-one)', display: 'block', marginBottom: '8px' }}></i>
                        Loading available payment methods...
                      </div>
                    ) : activeGateways.length === 0 ? (
                      <div className="alert alert-warning" style={{ borderRadius: '8px', padding: '16px', fontSize: '14px', margin: 0 }}>
                        <i className="las la-exclamation-triangle me-2"></i>
                        No payment methods are currently active. Please contact site administration.
                      </div>
                    ) : (
                      activeGateways.map((g: any) => {
                        const isSelected = formData.payment_gateway === g.id || (g.id === 'cod' && formData.payment_gateway === 'cash_on_delivery');
                        const isGatewayUsd = g.isUsd || g.id === 'stripe' || g.id === 'paypal';
                        const isPaystack = g.id === 'paystack';
                        return (
                          <label
                            key={g.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '16px 18px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid var(--main-color-one)' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.06)' : '#fff',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 2px 8px rgba(29, 191, 115, 0.12)' : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <input
                                type="radio"
                                name="payment_gateway"
                                value={g.id}
                                checked={isSelected}
                                onChange={handleChange}
                                style={{ accentColor: 'var(--main-color-one)', width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{ color: '#1e293b', fontSize: '15px' }}>{g.name}</strong>
                                  {g.badge && (
                                    <span style={{ fontSize: '11px', backgroundColor: 'var(--main-color-one)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                      {g.badge}
                                    </span>
                                  )}
                                  {g.sandbox && (
                                    <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                                      Test Mode
                                    </span>
                                  )}
                                </div>
                                <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                  {g.description}
                                </span>
                              </div>
                            </div>

                            {/* Gateway Icon */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', textAlign: 'center' }}>
                              {isPaystack ? (
                                <PaystackIcon size={30} />
                              ) : g.id === 'flutterwave' ? (
                                <i className="las la-wave-square" style={{ fontSize: '28px', color: '#f5a623' }}></i>
                              ) : g.id === 'stripe' ? (
                                <i className="lab la-stripe" style={{ fontSize: '36px', color: '#6366f1' }}></i>
                              ) : g.id === 'paypal' ? (
                                <i className="lab la-paypal" style={{ fontSize: '30px', color: '#0284c7' }}></i>
                              ) : g.id === 'razorpay' ? (
                                <i className="las la-bolt" style={{ fontSize: '28px', color: '#0c2340' }}></i>
                              ) : g.id === 'mollie' ? (
                                <i className="las la-credit-card" style={{ fontSize: '28px', color: '#ff5a00' }}></i>
                              ) : g.id === 'cod' ? (
                                <i className="las la-hand-holding-usd" style={{ fontSize: '30px', color: 'var(--main-color-one)' }}></i>
                              ) : (
                                <i className={g.icon || 'las la-credit-card'} style={{ fontSize: '28px', color: isSelected ? 'var(--main-color-one)' : '#64748b' }}></i>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Confirmation */}
              <div className="col-lg-4">
                <div className="booking-summary-card">
                  <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
                    Booking Summary
                  </h4>

                  {/* USD Exchange Rate Badge if USD gateway selected */}
                  {isUsdSelected && (
                    <div
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: '#166534',
                        fontWeight: 600,
                      }}
                    >
                      <i className="las la-globe-americas" style={{ fontSize: '18px', color: '#16a34a' }}></i>
                      <span>USD Pricing Applied</span>
                    </div>
                  )}

                  <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', lineHeight: '1.4' }}>
                      {serviceTitle}
                    </h5>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                      Scheduled: <strong>{formData.date}</strong> at <strong>{formData.schedule}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
                    <span>Service Package:</span>
                    {isUsdSelected ? (
                      <span style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#1e293b' }}>${toUsd(basePrice)}</strong>
                        <small style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>(₦{basePrice.toLocaleString()})</small>
                      </span>
                    ) : (
                      <strong>₦{basePrice.toLocaleString()}</strong>
                    )}
                  </div>


                  {activeAddons.length > 0 && (
                    <div style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Selected Add-ons ({activeAddons.length}):
                      </span>
                      {activeAddons.map((addon) => (
                        <div key={String(addon.id)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            • {addon.title}
                          </span>
                          <strong style={{ color: 'var(--main-color-one)' }}>
                            {isUsdSelected ? `+$${toUsd(Number(addon.price))}` : `+₦${Number(addon.price).toLocaleString()}`}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {extraServiceTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
                      <span>Add-ons Total:</span>
                      {isUsdSelected ? (
                        <span style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#1e293b' }}>${toUsd(extraServiceTotal)}</strong>
                          <small style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>(₦{extraServiceTotal.toLocaleString()})</small>
                        </span>
                      ) : (
                        <strong>₦{extraServiceTotal.toLocaleString()}</strong>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
                    <span>Estimated Tax:</span>
                    <strong>{isUsdSelected ? '$0.00' : '₦0.00'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="las la-shield-alt text-success" style={{ fontSize: '16px' }}></i> Escrow Protection Fee:
                    </span>
                    <strong style={{ color: escrowFee > 0 ? '#1e293b' : '#16a34a' }}>
                      {escrowFee > 0 ? (isUsdSelected ? `+$${toUsd(escrowFee)}` : `+₦${escrowFee.toLocaleString()}`) : 'FREE'}
                    </strong>
                  </div>

                  {/* Coupon Code Section */}
                  <div style={{ marginTop: '14px', marginBottom: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="las la-tag" style={{ color: 'var(--main-color-one)', fontSize: '16px' }}></i> Have a Coupon Code?
                    </div>
                    {!appliedCoupon ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="e.g. SAVE20NOW"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          className="form-control form-control-sm"
                          style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          disabled={couponLoading || !couponCode.trim()}
                          onClick={handleApplyCoupon}
                          className="btn btn-sm btn-success px-3 fw-bold"
                          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '12.5px', color: '#065f46', fontWeight: 600 }}>
                          <i className="las la-check-circle me-1"></i> {appliedCoupon.code} applied ({isUsdSelected ? `-$${toUsd(couponDiscountAmount)}` : `-₦${couponDiscountAmount.toLocaleString()}`})
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="btn btn-sm btn-link text-danger p-0 fw-bold"
                          style={{ textDecoration: 'none', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '6px', fontSize: '12px' }}>
                        {couponError}
                      </small>
                    )}
                  </div>

                  {couponDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#16a34a' }}>
                      <span>Discount ({appliedCoupon?.code}):</span>
                      <strong>{isUsdSelected ? `-$${toUsd(couponDiscountAmount)}` : `-₦${couponDiscountAmount.toLocaleString()}`}</strong>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      borderTop: '2px solid #f1f5f9',
                      paddingTop: '16px',
                      marginTop: '16px',
                      marginBottom: '20px',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Total Due:</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--main-color-one)', display: 'block' }}>
                        {isUsdSelected ? `$${toUsd(finalTotal)} USD` : `₦${finalTotal.toLocaleString()}`}
                      </span>
                      {isUsdSelected && (
                        <small style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          Converted from ₦{finalTotal.toLocaleString()}
                        </small>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-danger" style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || (!gatewaysLoading && activeGateways.length === 0)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: (!gatewaysLoading && activeGateways.length === 0) ? '#94a3b8' : 'var(--main-color-one)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: (isLoading || (!gatewaysLoading && activeGateways.length === 0)) ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(29, 191, 115, 0.3)',
                    }}
                  >
                    {isLoading
                      ? 'Processing Order...'
                      : formData.payment_gateway === 'paystack'
                      ? `Pay ₦${finalTotal.toLocaleString()} via Paystack`
                      : formData.payment_gateway === 'stripe'
                      ? `Pay $${toUsd(finalTotal)} USD via Stripe`
                      : formData.payment_gateway === 'paypal'
                      ? `Pay $${toUsd(finalTotal)} USD via PayPal`
                      : isUsdSelected
                      ? `Pay $${toUsd(finalTotal)} USD`
                      : formData.payment_gateway === 'cod' || formData.payment_gateway === 'cash_on_delivery'
                      ? `Confirm Booking (₦${finalTotal.toLocaleString()} on Delivery)`
                      : 'Confirm & Place Order'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#94a3b8' }}>
                    <i className="las la-lock"></i> 256-bit Encrypted & Secure Checkout
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </FrontendLayout>
  );
}

export default function ServiceBookingPage(props: BookingPageProps) {
  return (
    <Suspense
      fallback={
        <FrontendLayout>
          <div className="text-center py-5" style={{ padding: '80px 0' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </FrontendLayout>
      }
    >
      <BookingContent {...props} />
    </Suspense>
  );
}
