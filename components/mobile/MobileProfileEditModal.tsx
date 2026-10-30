'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MobileProfileEditModalProps {
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export default function MobileProfileEditModal({
  onClose,
  onProfileUpdated,
}: MobileProfileEditModalProps) {
  const [name, setName] = useState('Emma Watson');
  const [email, setEmail] = useState('emma@example.com');
  const [phone, setPhone] = useState('+234 801 234 5678');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('Lagos');
  const [address, setAddress] = useState('Lekki Phase 1, Lagos');
  const [about, setAbout] = useState('Lover of clean homes and verified artisans in Lagos.');
  const [image, setImage] = useState('/assets/flutter/images/avatar.png');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          if (u.name) setName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) setPhone(u.phone);
          if (u.post_code) setPostCode(u.post_code);
          if (u.country) setCountry(u.country);
          if (u.service_city) setCity(u.service_city);
          if (u.address) setAddress(u.address);
          if (u.about) setAbout(u.about);
          if (u.image) setImage(u.image);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data?.url) {
        setImage(data.url);
      }
    } catch (e) {
      alert('Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        post_code: postCode.trim(),
        country,
        service_city: city,
        address: address.trim(),
        about: about.trim(),
        image,
      };

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        localStorage.setItem('qixer_user_profile', JSON.stringify(payload));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-profile-changed'));
        }
        alert('Profile updated successfully!');
        if (onProfileUpdated) onProfileUpdated();
        onClose();
      } else {
        alert('Could not update profile. Please try again.');
      }
    } catch (e) {
      alert('Error saving profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1070,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header (Flutter CommonHelper().appbarCommon('Edit profile')) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            Edit profile
          </strong>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-sm text-white fw-bold px-3 py-1.5"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '6px',
            fontSize: '13.5px',
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* 2. Flutter ProfileEdit Page Body */}
      <form onSubmit={handleSave} className="p-4 d-flex flex-column gap-3.5">
        {/* Flutter Avatar Container (105x105 with 85x85 image and camera icon on bottom-right) */}
        <div className="text-center my-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="position-relative d-inline-block cursor-pointer"
            style={{ width: '105px', height: '105px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #EAECF0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
              }}
            >
              {isUploading ? (
                <div className="spinner-border spinner-border-sm text-success" role="status"></div>
              ) : (
                <img
                  src={image}
                  alt={name}
                  style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                  }}
                />
              )}
            </div>

            {/* Flutter Camera Badge Positioned bottom-right */}
            <div
              className="position-absolute shadow-sm d-flex align-items-center justify-content-center"
              style={{
                bottom: '4px',
                right: '4px',
                width: '32px',
                height: '32px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                border: '1.5px solid #EAECF0',
                color: '#64748B',
                fontSize: '17px',
              }}
            >
              <i className="las la-camera"></i>
            </div>
          </div>
          <span className="d-block text-muted small mt-1.5" style={{ fontSize: '12px' }}>
            Tap photo to upload new picture
          </span>
        </div>

        {/* Full Name Field (Flutter CustomInput with user icon) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">Full name</label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#EAECF0', color: '#94a3b8' }}>
              <i className="las la-user fs-5"></i>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="form-control border-start-0 py-2.5"
              style={{ borderRadius: '0 8px 8px 0', borderColor: '#EAECF0', fontSize: '14px' }}
              required
            />
          </div>
        </div>

        {/* Email Field (Flutter CustomInput with email icon) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">Email</label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#EAECF0', color: '#94a3b8' }}>
              <i className="las la-envelope fs-5"></i>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-control border-start-0 py-2.5"
              style={{ borderRadius: '0 8px 8px 0', borderColor: '#EAECF0', fontSize: '14px' }}
              required
            />
          </div>
        </div>

        {/* Phone Field (Flutter IntlPhoneField with phone icon) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">Phone</label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#EAECF0', color: '#94a3b8' }}>
              <i className="las la-phone fs-5"></i>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 801 234 5678"
              className="form-control border-start-0 py-2.5"
              style={{ borderRadius: '0 8px 8px 0', borderColor: '#EAECF0', fontSize: '14px' }}
              required
            />
          </div>
        </div>

        {/* Post Code Field (Flutter postCodeController) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">Post code</label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#EAECF0', color: '#94a3b8' }}>
              <i className="las la-map-pin fs-5"></i>
            </span>
            <input
              type="text"
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
              placeholder="Enter your post code"
              className="form-control border-start-0 py-2.5"
              style={{ borderRadius: '0 8px 8px 0', borderColor: '#EAECF0', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Country & State / City Dropdowns (Flutter CountryStatesDropdowns) */}
        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-bold text-dark mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="form-select py-2.5"
              style={{ borderRadius: '8px', borderColor: '#EAECF0', fontSize: '14px' }}
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
            </select>
          </div>

          <div className="col-6">
            <label className="form-label small fw-bold text-dark mb-1">City / State</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-select py-2.5"
              style={{ borderRadius: '8px', borderColor: '#EAECF0', fontSize: '14px' }}
            >
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Ibadan">Ibadan</option>
              <option value="Kano">Kano</option>
              <option value="Enugu">Enugu</option>
            </select>
          </div>
        </div>

        {/* Your Address Textarea (Flutter TextareaField) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">Your Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            rows={3}
            className="form-control p-2.5"
            style={{ borderRadius: '8px', borderColor: '#EAECF0', fontSize: '14px' }}
          />
        </div>

        {/* About Textarea (Flutter TextareaField) */}
        <div>
          <label className="form-label small fw-bold text-dark mb-1">About</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="About"
            rows={3}
            className="form-control p-2.5"
            style={{ borderRadius: '8px', borderColor: '#EAECF0', fontSize: '14px' }}
          />
        </div>

        {/* Flutter buttonPrimary('Save changes') */}
        <button
          type="submit"
          disabled={isSaving}
          className="btn text-white w-100 py-3 fw-bold mt-2 d-flex align-items-center justify-content-center gap-2"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status"></span>
              Saving changes...
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </form>
    </div>
  );
}

