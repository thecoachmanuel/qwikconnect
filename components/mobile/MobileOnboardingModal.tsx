'use client';

import React, { useState } from 'react';

interface MobileOnboardingModalProps {
  onClose: () => void;
}

export default function MobileOnboardingModal({ onClose }: MobileOnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: '/assets/flutter/images/intro1.png',
      title: 'Find Trusted Artisans',
      subtitle: 'Easily book verified, background-checked professionals in Lagos, Abuja, and nationwide.',
    },
    {
      image: '/assets/flutter/images/intro2.png',
      title: 'Transparent Pricing in Naira (₦)',
      subtitle: 'Zero hidden fees with secure escrow buyer protection and instant wallet payments.',
    },
    {
      image: '/assets/flutter/images/intro3.png',
      title: 'Real-time Tracking & Live Chat',
      subtitle: 'Chat directly with your artisan and track every stage of your order step-by-step.',
    },
  ];

  const handleFinish = () => {
    try {
      localStorage.setItem('qixer_intro_completed', '1');
    } catch (e) { }
    onClose();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const active = slides[currentSlide];

  return (
    <div
      className="mobile-intro-fullscreen position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column justify-content-between p-4"
      style={{
        zIndex: 1080,
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center pt-4">
        {/* Intro Illustration from Flutter (assets/images/intro*.png) */}
        <div
          className="mb-4 d-flex align-items-center justify-content-center"
          style={{
            width: '100%',
            maxHeight: '260px',
            height: '240px',
          }}
        >
          <img
            src={active.image}
            alt={active.title}
            style={{ maxHeight: '100%', maxWidth: '90%', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Title: 19px bold, #101828 */}
        <h4 className="fw-bold mb-2 px-3" style={{ color: '#101828', fontSize: '19px' }}>
          {active.title}
        </h4>

        {/* Subtitle: paragraphCommon, #667085 */}
        <p className="small px-4 mb-4" style={{ color: '#667085', fontSize: '14px', lineHeight: 1.45 }}>
          {active.subtitle}
        </p>

        {/* Dots Indicator (Flutter Parity) */}
        <div className="d-flex align-items-center justify-content-center gap-1.5 mb-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: `1.5px solid ${currentSlide === idx ? 'var(--main-color-one, #1DBF73)' : 'transparent'}`,
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: currentSlide === idx ? 'var(--main-color-one, #1DBF73)' : '#D0D5DD',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Buttons (Flutter IntroductionPage parity: Skip & Continue) */}
      <div className="d-flex gap-3 pb-3">
        <button
          type="button"
          onClick={handleFinish}
          className="btn flex-fill py-3 fw-semibold"
          style={{
            border: '1.5px solid var(--main-color-one, #1DBF73)',
            borderRadius: '7px',
            color: 'var(--main-color-one, #1DBF73)',
            backgroundColor: '#FFFFFF',
            fontSize: '15px',
          }}
        >
          Skip
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn flex-fill py-3 fw-semibold text-white"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
