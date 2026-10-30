'use client';

import React, { useState, useEffect } from 'react';

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
}

export default function MobileOnboardingModal({ onClose }: { onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      title: 'Discover Background-Checked Local Artisans',
      description: 'Connect with verified plumbers, electricians, cleaners, and home technicians right in your Nigerian neighborhood.',
      image: '/assets/uploads/media-uploader/banner11638279446.png',
    },
    {
      id: 2,
      title: 'Secure Escrow Payments in Naira',
      description: 'Your money is held safely in escrow with Paystack or Wallet until you verify the job is completed to your satisfaction.',
      image: '/assets/uploads/media-uploader/banner21638279450.png',
    },
    {
      id: 3,
      title: 'Track Your Service in Real Time',
      description: 'Enjoy in-app live chat, service milestone updates, and instant invoice receipts at your fingertips.',
      image: '/assets/uploads/media-uploader/banner31638279455.png',
    },
  ]);

  useEffect(() => {
    fetch('/api/mobile/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {});
  }, []);

  const handleFinish = () => {
    try {
      localStorage.setItem('qixer_intro_completed', '1');
    } catch (e) {}
    onClose();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const activeSlide = slides[currentSlide] || slides[0];

  return (
    <div
      className="position-fixed inset-0 d-flex flex-column justify-content-between bg-white p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        backgroundColor: '#ffffff',
      }}
    >
      {/* Top Header with Skip Button */}
      <div className="d-flex justify-content-end" style={{ height: '40px' }}>
        {currentSlide < slides.length - 1 ? (
          <button
            type="button"
            onClick={handleFinish}
            className="btn btn-sm btn-link text-decoration-none fw-semibold"
            style={{ color: '#64748b', fontSize: '14px' }}
          >
            Skip
          </button>
        ) : null}
      </div>

      {/* Slide Illustration & Content */}
      <div className="text-center px-2 py-4 my-auto">
        <div
          style={{
            width: '240px',
            height: '240px',
            borderRadius: '24px',
            overflow: 'hidden',
            margin: '0 auto 32px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
            backgroundColor: '#f8fafc',
          }}
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h3
          className="fw-bold mb-3"
          style={{ fontSize: '22px', color: '#1e293b', lineHeight: 1.3 }}
        >
          {activeSlide.title}
        </h3>

        <p
          className="text-muted"
          style={{ fontSize: '14.5px', lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }}
        >
          {activeSlide.description}
        </p>
      </div>

      {/* Bottom Navigation with Dots & Next/Get Started Button */}
      <div className="pb-3">
        {/* Dot Indicators */}
        <div className="d-flex justify-content-center gap-2 mb-4">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: currentSlide === idx ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
            ></div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="btn btn-success w-100 py-3 fw-bold shadow"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '12px',
            fontSize: '16px',
            letterSpacing: '0.2px',
          }}
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}

