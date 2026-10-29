'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatNaira } from '@/lib/currency';

interface AdditionalService {
  id: string | number | bigint;
  additional_service_title?: string | null;
  additional_service_price?: number | string | any;
  additional_service_quantity?: number | null;
}

interface BookingSidebarProps {
  slug: string;
  basePrice: number;
  deliveryDays?: number;
  includes?: { id: string | number | bigint; include_service_title: string; include_service_quantity: number }[] | any[];
  additionals?: AdditionalService[];
  showMobileBottomBar?: boolean;
}

export default function BookingSidebar({
  slug,
  basePrice,
  deliveryDays = 3,
  includes = [],
  additionals = [],
  showMobileBottomBar = false,
}: BookingSidebarProps) {
  const [selectedAdditionals, setSelectedAdditionals] = useState<Record<string, boolean>>({});

  const toggleAdditional = (id: string) => {
    setSelectedAdditionals((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate total price
  let additionalTotal = 0;
  for (const item of additionals) {
    const itemId = String(item.id);
    if (selectedAdditionals[itemId]) {
      additionalTotal += Number(item.additional_service_price || 0);
    }
  }

  const totalPrice = basePrice + additionalTotal;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .booking-sidebar-card {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 5px 25px rgba(0,0,0,0.05);
        }
        @media (min-width: 992px) {
          .booking-sidebar-card {
            position: sticky;
            top: 120px;
            z-index: 10;
          }
        }
        @media (max-width: 991px) {
          .booking-sidebar-card {
            position: static !important;
            top: auto !important;
            margin-bottom: 24px;
          }
        }
      `}} />
      <div className="service-details-package booking-sidebar-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          Standard Package
        </h4>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--main-color-one)' }}>
          {formatNaira(basePrice)}
        </div>
      </div>

      <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
        <i className="las la-clock" style={{ fontSize: '18px', color: 'var(--main-color-one)' }}></i>
        <span>Delivery in <strong>{deliveryDays} Days</strong></span>
      </div>

      {/* What's Included */}
      {includes.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            What's Included:
          </h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {includes.map((inc: any, idx: number) => {
              const title = typeof inc === 'string' ? inc : (inc.include_service_title || inc.title || `Item #${idx + 1}`);
              const qty = inc?.include_service_quantity ? Number(inc.include_service_quantity) : 1;
              return (
                <li
                  key={String(inc.id || idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#475569',
                    marginBottom: '8px',
                  }}
                >
                  <i className="las la-check" style={{ color: 'var(--main-color-one)', fontSize: '16px', fontWeight: 700 }}></i>
                  <span>{title} {qty > 1 ? `(${qty}x)` : ''}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Additional Services */}
      {additionals.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>
            Additional Add-ons:
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {additionals.map((add) => {
              const addId = String(add.id);
              const isChecked = !!selectedAdditionals[addId];
              const price = Number(add.additional_service_price || 0);

              return (
                <label
                  key={addId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: isChecked ? '1px solid var(--main-color-one)' : '1px solid #e2e8f0',
                    backgroundColor: isChecked ? 'rgba(29, 191, 115, 0.05)' : '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAdditional(addId)}
                    />
                    <span style={{ fontWeight: 500, color: '#334155' }}>
                      {add.additional_service_title}
                    </span>
                  </div>
                  <strong style={{ color: 'var(--main-color-one)' }}>+{formatNaira(price)}</strong>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Total and Book Button */}
      <div style={{ marginTop: '24px', borderTop: '2px solid #f1f5f9', paddingTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
            {Object.keys(selectedAdditionals).filter((k) => selectedAdditionals[k]).length > 0
              ? `Total Amount (${Object.keys(selectedAdditionals).filter((k) => selectedAdditionals[k]).length} add-on${Object.keys(selectedAdditionals).filter((k) => selectedAdditionals[k]).length > 1 ? 's' : ''}):`
              : 'Total Amount:'}
          </span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--main-color-one)' }}>
            {formatNaira(totalPrice)}
          </span>
        </div>

        {(() => {
          const selectedAddonKeys = Object.keys(selectedAdditionals).filter((k) => selectedAdditionals[k]);
          const bookUrl = `/service-list/book/${slug}${
            selectedAddonKeys.length > 0 ? `?addons=${selectedAddonKeys.join(',')}` : ''
          }`;

          return (
            <>
              <Link
                href={bookUrl}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'var(--main-color-one)',
                  color: '#fff',
                  textAlign: 'center',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '16px',
                  boxShadow: '0 4px 15px rgba(29, 191, 115, 0.3)',
                }}
              >
                Book This Service Now
              </Link>

              {/* Synchronized Mobile Sticky Bottom Bar */}
              {showMobileBottomBar && (
                <div
                  className="d-lg-none fixed-bottom bg-white border-top shadow-lg py-2 px-3"
                  style={{
                    zIndex: 995,
                    boxShadow: '0 -4px 15px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        {selectedAddonKeys.length > 0
                          ? `Total (${selectedAddonKeys.length} Add-on${selectedAddonKeys.length > 1 ? 's' : ''})`
                          : 'Standard Package'}
                      </span>
                      <span className="fw-bold" style={{ fontSize: '20px', color: 'var(--main-color-one)' }}>
                        {formatNaira(totalPrice)}
                      </span>
                    </div>
                    <Link
                      href={bookUrl}
                      className="btn text-white fw-bold px-4 py-2"
                      style={{
                        backgroundColor: 'var(--main-color-one)',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(29, 191, 115, 0.3)',
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
    </>
  );
}
