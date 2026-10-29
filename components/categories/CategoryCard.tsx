import React from 'react';
import Link from 'next/link';

export interface CategoryCardProps {
  id: string | number | bigint;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  servicesCount?: number;
}

export default function CategoryCard({
  name,
  slug,
  icon,
  image,
  servicesCount = 0,
}: CategoryCardProps) {
  return (
    <div className="single-category-item" style={{ height: '100%' }}>
      <Link
        href={`/service-list?category=${slug}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '30px 20px',
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s ease',
          height: '100%',
        }}
        className="category-card-hover"
      >
        <div
          className="category-icon-wrapper"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: 'rgba(29, 191, 115, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            color: 'var(--main-color-one)',
            fontSize: '32px',
          }}
        >
          {icon ? (
            <i className={icon}></i>
          ) : (
            <i className="las la-tools"></i>
          )}
        </div>
        <h5 style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '5px' }}>
          {name}
        </h5>
        <span style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
          {servicesCount ?? 0} {servicesCount === 1 ? 'Service' : 'Services'}
        </span>
      </Link>
    </div>
  );
}
