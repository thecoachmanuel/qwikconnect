'use client';

import React, { useState, useEffect } from 'react';

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
  const [city, setCity] = useState('Lagos');
  const [address, setAddress] = useState('Lekki Phase 1, Lagos');
  const [about, setAbout] = useState('Lover of clean homes and verified artisans in Lagos.');
  const [image, setImage] = useState('/assets/flutter/images/avatar.png');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          if (u.name) setName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) setPhone(u.phone);
          if (u.service_city) setCity(u.service_city);
          if (u.address) setAddress(u.address);
          if (u.about) setAbout(u.about);
          if (u.image) setImage(u.image);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
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
      {/* 1. Header (Flutter profile_edit.dart parity) */}
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
            Edit Profile
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

      {/* 2. Avatar & Input Fields */}
      <form onSubmit={handleSave} className="p-4 d-flex flex-column gap-3">
        {/* Avatar with Camera Overlay */}
        <div className="text-center my-2">
          <div className="position-relative d-inline-block">
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #EAECF0',
                backgroundColor: '#F2F4F7',
              }}
            >
              <img
                src={image}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter image URL or select from media:');
                if (url) setImage(url);
              }}
              className="btn position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center p-0 text-white shadow-sm"
              style={{
                width: '26px',
                height: '26px',
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                transform: 'translate(25%, 25%)',
                border: '2px solid #fff',
              }}
            >
              <i className="las la-camera" style={{ fontSize: '13px' }}></i>
            </button>
          </div>
          <span className="d-block text-muted small mt-2">Tap camera icon to change photo</span>
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Service City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="form-select py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Ibadan">Ibadan</option>
            <option value="Kano">Kano</option>
            <option value="Enugu">Enugu</option>
          </select>
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Residential / Office Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Bio / About</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
            className="form-control"
            style={{ borderRadius: '8px', fontSize: '13.5px' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn text-white w-100 py-2.5 fw-bold mt-2"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {isSaving ? 'Updating...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}

