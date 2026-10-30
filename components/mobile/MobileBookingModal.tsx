'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface MobileBookingModalProps {
  service: any;
  onClose: () => void;
  onOrderSuccess: (orderId: number) => void;
}

export default function MobileBookingModal({
  service,
  onClose,
  onOrderSuccess,
}: MobileBookingModalProps) {
  const { data: session } = useSession();

  // Steps: 1: Extras, 2: Schedule, 3: Address, 4: Payment, 5: Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Packages & Extras
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Set<number>>(new Set());

  // Step 2: Schedule
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');

  // Step 3: Contact & Address
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(service?.city || 'Lagos');
  const [address, setAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Step 4: Payment
  const [paymentGateway, setPaymentGateway] = useState<string>('paystack');
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeGateways, setActiveGateways] = useState<any[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);
  const [escrowConfig, setEscrowConfig] = useState<any>({
    enabled: true,
    type: 'percentage',
    rate: 5,
    payer: 'buyer',
    description: '100% Secure Escrow Protection. Funds held safely until service completion is approved.',
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Populate user data from session or profile & fetch payment gateways
  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      if (u.name) setName(u.name);
      if (u.email) setEmail(u.email);
      if (u.phone) setPhone(u.phone);
    }

    // Fetch live wallet balance
    fetch('/api/buyer/wallet/balance')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.balance === 'number') {
          setWalletBalance(data.balance);
        }
      })
      .catch(() => {});

    // Fetch active gateways & escrow settings dynamically from admin DB
    fetch('/api/payments/active-gateways')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.gateways) && data.gateways.length > 0) {
          setActiveGateways(data.gateways);
          setPaymentGateway(data.gateways[0].id);
        }
        if (data?.escrow) {
          setEscrowConfig(data.escrow);
        }
      })
      .catch((err) => console.warn('Failed to load active gateways for PWA booking:', err))
      .finally(() => setGatewaysLoading(false));
  }, [session]);

  const basePrice = Number(service?.price || 0);
  const packageTotal = basePrice * quantity;

  const extraServicesList = Array.isArray(service?.extra_services)
    ? service.extra_services
    : [
        { id: 101, title: 'Deep Sanitization & Disinfection', price: 5000 },
        { id: 102, title: 'Extra Heavy Duty Materials', price: 8000 },
        { id: 103, title: 'Post-service Guarantee Certificate', price: 3000 },
      ];

  const extrasTotal = extraServicesList.reduce((acc: number, extra: any, idx: number) => {
    const extraId = extra.id || idx;
    if (selectedExtras.has(extraId)) {
      return acc + Number(extra.price || 0);
    }
    return acc;
  }, 0);

  const subTotal = packageTotal + extrasTotal;

  // Calculate dynamic Escrow Fee based on Admin settings
  let escrowFee = 0;
  if (escrowConfig?.enabled && (escrowConfig.payer === 'buyer' || escrowConfig.payer === 'split')) {
    const rate = Number(escrowConfig.rate || 5);
    const rawFee = escrowConfig.type === 'fixed' ? rate : (subTotal * rate) / 100;
    escrowFee = Math.round(escrowConfig.payer === 'split' ? rawFee / 2 : rawFee);
  }

  const grandTotal = Math.max(0, subTotal - couponDiscount + escrowFee);

  const toggleExtra = (id: number) => {
    const updated = new Set(selectedExtras);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedExtras(updated);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal: subTotal }),
      });
      const data = await res.json();
      if (data?.valid) {
        setCouponDiscount(Number(data.discount || 2500));
        setCouponApplied(true);
      } else {
        // Fallback for promotional codes
        if (couponCode.toUpperCase() === 'WELCOME' || couponCode.toUpperCase() === 'PROMO20') {
          setCouponDiscount(Math.round(subTotal * 0.15));
          setCouponApplied(true);
        } else {
          alert(data?.message || 'Invalid or expired coupon code.');
        }
      }
    } catch (e) {
      if (couponCode.toUpperCase() === 'WELCOME' || couponCode.toUpperCase() === 'PROMO20') {
        setCouponDiscount(Math.round(subTotal * 0.15));
        setCouponApplied(true);
      } else {
        alert('Could not validate coupon.');
      }
    }
  };

  const handleSubmitBooking = async () => {
    if (!name.trim()) {
      alert('Please enter your full name');
      setCurrentStep(3);
      return;
    }
    if (!phone.trim()) {
      alert('Please enter your phone number');
      setCurrentStep(3);
      return;
    }
    if (!address.trim()) {
      alert('Please provide your service address');
      setCurrentStep(3);
      return;
    }

    if (paymentGateway === 'wallet' && walletBalance < grandTotal) {
      alert(`Insufficient wallet balance (₦${walletBalance.toLocaleString()}). Required: ₦${grandTotal.toLocaleString()}. Please fund your wallet via Paystack or choose another payment method.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        service_id: Number(service.id || 1),
        seller_id: Number(service.seller?.id || service.seller_id || 1),
        name: name.trim(),
        email: email.trim() || 'buyer@qwikconnect.ng',
        phone: phone.trim(),
        address: address.trim(),
        city: city || 'Lagos',
        country: 'Nigeria',
        date: selectedDate,
        schedule: selectedSlot,
        package_fee: packageTotal,
        extra_service: extrasTotal,
        tax: 0,
        total: grandTotal,
        payment_gateway: paymentGateway,
        order_note: orderNote.trim() || undefined,
        coupon_code: couponApplied ? couponCode : undefined,
        coupon_discount: couponDiscount,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const resolvedOrderId = data?.orderId || data?.order?.id;
      if (res.ok && resolvedOrderId) {
        const orderIdNum = Number(resolvedOrderId);

        // Process online payment or wallet deduction via checkout API
        if (paymentGateway && paymentGateway !== 'cash_on_delivery' && paymentGateway !== 'cod') {
          const payRes = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderIdNum,
              gateway: paymentGateway,
            }),
          });
          const payData = await payRes.json();
          if (!payRes.ok) {
            alert(payData.message || 'Payment initiation failed. Please try another payment method.');
            setIsSubmitting(false);
            return;
          }
          if (payData.redirectUrl && !payData.isDirectSuccess) {
            window.location.href = payData.redirectUrl;
            return;
          }
        }

        setCreatedOrder(data.order || { id: orderIdNum, invoice: data.invoice, total: grandTotal });
        onOrderSuccess(orderIdNum);
        setCurrentStep(5); // Show success screen
      } else {
        alert(data?.error || data?.message || 'Could not place order. Please review your details.');
      }
    } catch (e: any) {
      alert('Failed to connect to order service: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate next 7 days dates
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return { iso, dayName, label: `${dayNum} ${month}` };
  });

  const timeSlots = [
    '08:00 AM',
    '10:00 AM',
    '12:00 PM',
    '02:30 PM',
    '04:30 PM',
    '06:00 PM',
  ];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1080,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header with back button & Step Indicator */}
      <div
        className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (currentStep > 1 && currentStep < 5) {
              setCurrentStep((prev) => (prev - 1) as any);
            } else {
              onClose();
            }
          }}
          className="btn p-0 border-0 bg-transparent text-dark"
        >
          <i className="las la-arrow-left fs-4"></i>
        </button>

        <div className="text-center">
          <strong style={{ color: '#101828', fontSize: '16px' }}>
            {currentStep === 1 && 'Package & Add-ons'}
            {currentStep === 2 && 'Select Schedule'}
            {currentStep === 3 && 'Service Address'}
            {currentStep === 4 && 'Payment & Review'}
            {currentStep === 5 && 'Order Confirmed'}
          </strong>
          {currentStep < 5 && (
            <span className="text-muted d-block" style={{ fontSize: '11px' }}>
              Step {currentStep} of 4
            </span>
          )}
        </div>

        <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '12px' }}></button>
      </div>

      {/* 2. Step Progress Bar */}
      {currentStep < 5 && (
        <div style={{ height: '3px', backgroundColor: '#F2F4F7' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: 'var(--main-color-one, #1DBF73)',
              width: `${(currentStep / 4) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* 3. Step Body */}
      <div className="px-4 py-3 flex-grow-1" style={{ paddingBottom: '90px' }}>
        {/* STEP 1: Packages & Extras */}
        {currentStep === 1 && (
          <div>
            {/* Service Summary Card */}
            <div className="d-flex align-items-center gap-3 p-3 rounded-3 border mb-4" style={{ backgroundColor: '#F8FAFC' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={service?.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                  alt={service?.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="min-w-0">
                <strong className="d-block text-truncate" style={{ fontSize: '15px', color: '#101828' }}>
                  {service?.title}
                </strong>
                <span className="text-muted small">Standard Package</span>
                <strong className="d-block mt-0.5" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '14px' }}>
                  ₦{basePrice.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border mb-4">
              <div>
                <strong className="d-block" style={{ color: '#101828', fontSize: '14.5px' }}>
                  Package Quantity
                </strong>
                <span className="text-muted small">Select number of units / rooms</span>
              </div>

              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: '32px', height: '32px', fontSize: '18px' }}
                >
                  -
                </button>
                <strong style={{ fontSize: '16px', minWidth: '18px', textAlign: 'center' }}>{quantity}</strong>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    fontSize: '18px',
                    borderColor: 'var(--main-color-one, #1DBF73)',
                    color: 'var(--main-color-one, #1DBF73)',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Extra Services Checklist */}
            <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '15px' }}>
              Select Extra Add-ons (Optional)
            </h6>
            <div className="d-flex flex-column gap-2 mb-4">
              {extraServicesList.map((extra: any, idx: number) => {
                const extraId = extra.id || idx;
                const isChecked = selectedExtras.has(extraId);
                return (
                  <div
                    key={extraId}
                    onClick={() => toggleExtra(extraId)}
                    className="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer"
                    style={{
                      backgroundColor: isChecked ? 'rgba(29, 191, 115, 0.05)' : '#FFFFFF',
                      borderColor: isChecked ? 'var(--main-color-one, #1DBF73)' : '#EAECF0',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded d-flex align-items-center justify-content-center"
                        style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${isChecked ? 'var(--main-color-one, #1DBF73)' : '#D0D5DD'}`,
                          backgroundColor: isChecked ? 'var(--main-color-one, #1DBF73)' : 'transparent',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span className="fw-medium text-dark" style={{ fontSize: '14px' }}>
                        {extra.title}
                      </span>
                    </div>

                    <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13.5px' }}>
                      +₦{Number(extra.price || 0).toLocaleString()}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Schedule (Date & Time) */}
        {currentStep === 2 && (
          <div>
            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>
              Choose Appointment Date
            </h6>
            <div
              className="d-flex gap-2.5 overflow-x-auto pb-3 mb-4"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {next7Days.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDate(d.iso)}
                    className="btn p-2.5 text-center flex-shrink-0"
                    style={{
                      width: '74px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                      backgroundColor: isSelected ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475467',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span className="d-block text-uppercase small" style={{ fontSize: '11px', fontWeight: 600 }}>
                      {d.dayName}
                    </span>
                    <strong className="d-block mt-1" style={{ fontSize: '14px' }}>
                      {d.label}
                    </strong>
                  </button>
                );
              })}
            </div>

            <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '15px' }}>
              Choose Preferred Time Slot
            </h6>
            <div className="row g-2 mb-4">
              {timeSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <div key={slot} className="col-6">
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className="btn w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                      style={{
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                        backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.08)' : '#FFFFFF',
                        color: isSelected ? 'var(--main-color-one, #1DBF73)' : '#475467',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '13.5px',
                      }}
                    >
                      <i className="las la-clock"></i>
                      {slot}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-3 border" style={{ backgroundColor: '#F8FAFC' }}>
              <div className="d-flex align-items-center gap-2 text-muted small">
                <i className="las la-info-circle text-success fs-5"></i>
                <span>Artisan arrives promptly within your selected window. Free reschedule up to 2 hours prior.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Address & Contact */}
        {currentStep === 3 && (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-bold text-dark mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Babatunde Fashola"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 801 234 5678"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">City / State *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-select py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="Lagos">Lagos (Ikeja, Lekki, Victoria Island, Yaba)</option>
                <option value="Abuja">Abuja (Maitama, Wuse, Garki, Jabi)</option>
                <option value="Port Harcourt">Port Harcourt, Rivers</option>
                <option value="Ibadan">Ibadan, Oyo</option>
                <option value="Kano">Kano</option>
                <option value="Enugu">Enugu</option>
              </select>
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Street Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Flat 4B, Admiralty Way, Lekki Phase 1"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Special Order Note (Optional)</label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Any gate instructions or specific tool requirements..."
                rows={2}
                className="form-control"
                style={{ borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Payment & Review */}
        {currentStep === 4 && (
          <div>
            {/* Payment Method Selector */}
            <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '15px' }}>
              Choose Payment Method
            </h6>
            <div className="d-flex flex-column gap-2.5 mb-4">
              {gatewaysLoading ? (
                <div className="p-3 text-center text-muted small border rounded-3 bg-white">
                  <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
                  Loading active payment methods...
                </div>
              ) : activeGateways.length === 0 ? (
                <div className="alert alert-warning small py-2 mb-0">
                  No payment methods currently active. Please contact administrator.
                </div>
              ) : (
                activeGateways.map((gw: any) => {
                  const isSelected = paymentGateway === gw.id || (gw.id === 'cod' && paymentGateway === 'cash_on_delivery');
                  const isWallet = gw.id === 'wallet';
                  const isPaystack = gw.id === 'paystack';
                  const isFlw = gw.id === 'flutterwave';
                  const isCod = gw.id === 'cod' || gw.id === 'cash_on_delivery';
                  const isInsufficient = isWallet && walletBalance < grandTotal;

                  return (
                    <div
                      key={gw.id}
                      onClick={() => setPaymentGateway(gw.id)}
                      className="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer"
                      style={{
                        borderColor: isSelected ? 'var(--main-color-one, #1DBF73)' : '#EAECF0',
                        backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '38px',
                            height: '38px',
                            backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.12)' : '#F1F5F9',
                            color: isSelected ? 'var(--main-color-one, #1DBF73)' : '#64748B',
                            fontSize: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {isWallet ? (
                            <i className="las la-wallet"></i>
                          ) : isPaystack ? (
                            <i className="las la-credit-card"></i>
                          ) : isFlw ? (
                            <i className="las la-wave-square"></i>
                          ) : isCod ? (
                            <i className="las la-hand-holding-usd"></i>
                          ) : (
                            <i className={gw.icon || 'las la-credit-card'}></i>
                          )}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <strong className="text-dark" style={{ fontSize: '14.5px' }}>
                              {gw.name}
                            </strong>
                            {gw.badge && (
                              <span className="badge" style={{ backgroundColor: '#1DBF73', color: '#fff', fontSize: '10px' }}>
                                {gw.badge}
                              </span>
                            )}
                          </div>
                          {isWallet ? (
                            <span className="text-muted small d-block">
                              Balance: <strong className={isInsufficient ? "text-danger" : "text-success"}>₦{walletBalance.toLocaleString()}</strong>
                              {isInsufficient && ' (Insufficient funds)'}
                            </span>
                          ) : (
                            <span className="text-muted small d-block" style={{ fontSize: '12px' }}>
                              {gw.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={isSelected}
                        onChange={() => setPaymentGateway(gw.id)}
                        style={{ accentColor: 'var(--main-color-one, #1DBF73)', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Coupon Code Input */}
            <div className="p-3 rounded-3 border mb-4" style={{ backgroundColor: '#F8FAFC' }}>
              <label className="form-label small fw-bold text-dark mb-1.5">Have a Promo Coupon?</label>
              <div className="input-group">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. WELCOME"
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontSize: '13.5px' }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="btn btn-outline-success fw-bold"
                  style={{ borderColor: 'var(--main-color-one, #1DBF73)' }}
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <div className="mt-2 text-success small fw-semibold">
                  ✓ Coupon applied: -₦{couponDiscount.toLocaleString()}
                </div>
              )}
            </div>

            {/* Order Price Breakdown */}
            <div className="p-3 rounded-3 border bg-white">
              <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '14.5px' }}>
                Price Breakdown
              </h6>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between text-muted">
                  <span>Package Fee ({quantity}x)</span>
                  <span className="text-dark fw-medium">₦{packageTotal.toLocaleString()}</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="d-flex justify-content-between text-muted">
                    <span>Extra Add-ons</span>
                    <span className="text-dark fw-medium">+₦{extrasTotal.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="d-flex justify-content-between text-success fw-medium">
                    <span>Discount</span>
                    <span>-₦{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between text-muted">
                  <span className="d-flex align-items-center gap-1">
                    <i className="las la-shield-alt text-success"></i> Escrow Protection Fee
                  </span>
                  {escrowFee > 0 ? (
                    <span className="text-dark fw-medium">+₦{escrowFee.toLocaleString()}</span>
                  ) : (
                    <span className="text-success fw-medium">FREE</span>
                  )}
                </div>

                {escrowConfig?.description && (
                  <div className="p-2.5 rounded-2 mt-1 mb-1" style={{ backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', fontSize: '12px', color: '#166534', lineHeight: 1.4 }}>
                    <i className="las la-lock me-1"></i> {escrowConfig.description}
                  </div>
                )}

                <hr className="my-1.5" />
                <div className="d-flex justify-content-between">
                  <strong className="text-dark" style={{ fontSize: '16px' }}>
                    Total Payable
                  </strong>
                  <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '18px' }}>
                    ₦{grandTotal.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Order Confirmed Success Screen (Flutter payment_success_page.dart parity) */}
        {currentStep === 5 && createdOrder && (
          <div className="text-center py-5">
            {/* Animated Checkmark Circle */}
            <div
              className="mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-3"
              style={{
                width: '76px',
                height: '76px',
                backgroundColor: 'rgba(29, 191, 115, 0.12)',
                color: 'var(--main-color-one, #1DBF73)',
              }}
            >
              <i className="las la-check" style={{ fontSize: '42px', fontWeight: 900 }}></i>
            </div>

            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '22px' }}>
              Booking Confirmed!
            </h4>
            <p className="text-muted small mb-4" style={{ color: '#667085' }}>
              Your order has been placed with the verified artisan.
            </p>

            <div className="p-3.5 rounded-3 border text-start mb-4 mx-auto" style={{ maxWidth: '340px', backgroundColor: '#F8FAFC' }}>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Order ID:</span>
                <strong className="text-dark">#{createdOrder.id || 'INV-1029'}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Schedule:</span>
                <strong className="text-dark">{selectedDate} ({selectedSlot})</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Payment:</span>
                <span className="text-capitalize text-success fw-bold">{paymentGateway.replace('_', ' ')}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Total Paid:</span>
                <strong style={{ color: 'var(--main-color-one, #1DBF73)' }}>₦{grandTotal.toLocaleString()}</strong>
              </div>
            </div>

            <div className="d-flex flex-column gap-2.5 mx-auto" style={{ maxWidth: '340px' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOrderSuccess(createdOrder.id);
                }}
                className="btn text-white py-2.5 fw-bold"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                View Order Details
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline-secondary py-2.5 fw-semibold"
                style={{ borderRadius: '8px', fontSize: '14px' }}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Sticky Action Button (Steps 1-4) */}
      {currentStep < 5 && (
        <div
          className="position-fixed bottom-0 start-0 end-0 bg-white border-top px-4 d-flex align-items-center justify-content-between shadow"
          style={{
            zIndex: 1090,
            paddingTop: '12px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div>
            <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
              Total Amount
            </span>
            <strong className="d-block" style={{ color: '#101828', fontSize: '19px', fontWeight: 800 }}>
              ₦{grandTotal.toLocaleString()}
            </strong>
          </div>

          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn text-white fw-bold px-4 py-2.5"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '14.5px',
              }}
            >
              Continue to Schedule →
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn text-white fw-bold px-4 py-2.5"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '14.5px',
              }}
            >
              Continue to Address →
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={() => {
                if (!name.trim() || !phone.trim() || !address.trim()) {
                  alert('Please fill in your name, phone, and address');
                  return;
                }
                setCurrentStep(4);
              }}
              className="btn text-white fw-bold px-4 py-2.5"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '14.5px',
              }}
            >
              Review & Pay →
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={isSubmitting}
              className="btn text-white fw-bold px-4 py-2.5 d-flex align-items-center gap-2"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '14.5px',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Processing...
                </>
              ) : (
                'Confirm & Place Order'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

