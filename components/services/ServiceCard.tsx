'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatNaira } from '@/lib/currency';

function isGenericAuthorImg(img: string | null | undefined): boolean {
  if (!img) return true;
  const clean = String(img).trim();
  return (
    clean === '' ||
    clean === '/assets/frontend/img/static/user_profile.png' ||
    clean === '/assets/frontend/img/user-no-image.png' ||
    clean === '/assets/frontend/img/no-image.png' ||
    clean === '/assets/uploads/media-uploader/banner11638279446.png' ||
    clean.includes('placeholder')
  );
}

export interface ServiceCardProps {
  id: string | number | bigint;
  title: string;
  slug: string;
  price: number | string;
  image?: string;
  city?: string | null;
  country?: string | null;
  seller?: {
    id: string | number | bigint;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  rating?: number;
  reviewCount?: number;
}

export default function ServiceCard({
  id,
  title,
  slug,
  price,
  image = '/assets/frontend/img/no-image.png',
  city,
  country,
  seller,
  rating = 5.0,
  reviewCount = 1,
}: ServiceCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [authorImg, setAuthorImg] = useState<string>(
    seller?.image && !isGenericAuthorImg(seller.image)
      ? seller.image
      : '/assets/frontend/img/static/user_profile.png'
  );

  useEffect(() => {
    if (seller?.image && !isGenericAuthorImg(seller.image)) {
      setAuthorImg(seller.image);
    }

    const syncLocalAvatar = () => {
      try {
        const storedSeller = localStorage.getItem('qixer_profile_seller');
        const storedUser = localStorage.getItem('qixer_user_profile');
        const activeProf = storedSeller ? JSON.parse(storedSeller) : (storedUser ? JSON.parse(storedUser) : null);
        if (activeProf && activeProf.image && !isGenericAuthorImg(activeProf.image)) {
          const matches =
            (seller?.username && activeProf.username && seller.username.toLowerCase() === activeProf.username.toLowerCase()) ||
            (seller?.id && activeProf.id && Number(seller.id) === Number(activeProf.id));
          if (matches) {
            setAuthorImg(activeProf.image);
          }
        }
      } catch (e) {}
    };

    syncLocalAvatar();
    window.addEventListener('qixer-profile-updated', syncLocalAvatar);
    window.addEventListener('storage', syncLocalAvatar);
    return () => {
      window.removeEventListener('qixer-profile-updated', syncLocalAvatar);
      window.removeEventListener('storage', syncLocalAvatar);
    };
  }, [seller?.id, seller?.username, seller?.name, seller?.image]);

  const formattedPrice = formatNaira(price);

  return (
    <div className="new_service__single" style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
      <div className="new_service__single__thumb" style={{ position: 'relative', overflow: 'hidden', height: '220px' }}>
        <Link href={`/service-list/${slug}`} style={{ display: 'block', height: '100%', width: '100%' }}>
          <img
            src={image}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('banner11638279446.png')) {
                target.src = '/assets/uploads/media-uploader/banner11638279446.png';
              }
            }}
          />
        </Link>
        <div className="award_icons" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 2 }}>
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            style={{
              background: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <i
              className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart`}
              style={{ color: isWishlisted ? '#ff4d4f' : '#888', fontSize: '16px' }}
            ></i>
          </button>
        </div>
      </div>

      <div className="new_service__single__contents" style={{ padding: '20px' }}>
        {(city || country) && (
          <span
            className="new_jobs__single__contents__location mb-2"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '13px' }}
          >
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--main-color-one)' }}></i>
            {city ? `${city}, ` : ''}{country || 'Worldwide'}
          </span>
        )}

        <h5
          className="new_service__single__contents__title"
          style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0 12px', minHeight: '44px', lineHeight: '1.4' }}
        >
          <Link href={`/service-list/${slug}`} style={{ color: '#222' }}>
            {title}
          </Link>
        </h5>

        <div className="new_service__single__price" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
          <span className="new_service__single__price__starting" style={{ fontSize: '13px', color: '#888' }}>
            Starting at
          </span>
          <h5 className="new_service__single__price__title mt-1" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--main-color-one)' }}>
            {formattedPrice}
          </h5>
        </div>

        <div
          className="author_tag border_top"
          style={{
            borderTop: '1px solid #f0f0f0',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {seller ? (
            <Link
              href={`/about-seller/${seller.username || 'chioma_adebayo'}`}
              className="single_authors"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444' }}
            >
              <div
                className="single_authors__thumb"
                style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden' }}
              >
                <img
                  src={authorImg}
                  alt={seller.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('user_profile.png')) {
                      target.src = '/assets/frontend/img/static/user_profile.png';
                    }
                  }}
                />
              </div>
              <span className="single_authors__title" style={{ fontSize: '13px', fontWeight: 500 }}>
                {seller.name}
              </span>
            </Link>
          ) : (
            <span style={{ fontSize: '13px', color: '#888' }}>Verified Pro</span>
          )}

          <div
            className="author_tag__review radius-5"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#fff9e6',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#d48806',
            }}
          >
            <i className="fa-solid fa-star" style={{ color: '#faad14' }}></i>
            <span>{rating.toFixed(1)}</span>
            <span style={{ color: '#888', fontWeight: 400 }}>({reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
