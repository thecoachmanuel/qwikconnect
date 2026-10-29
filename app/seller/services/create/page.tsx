'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ImageUpload from '@/components/ui/ImageUpload';

export default function CreateServicePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category_id: 1,
    price: 35000,
    delivery_days: 3,
    description: '',
    image: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [includes, setIncludes] = useState<string[]>(['Full Service Execution', 'Necessary Materials & Tools']);
  const [benefits, setBenefits] = useState<string[]>(['100% Satisfaction Guarantee', 'Quality Verified Work']);
  const [additionals, setAdditionals] = useState<{ title: string; price: number }[]>([
    { title: 'Priority Fast-Track Delivery', price: 5000 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.categories || [];
        if (list.length > 0) {
          setCategories(list);
          setFormData((prev) => ({ ...prev, category_id: prev.category_id || list[0].id }));
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category_id' || name === 'price' || name === 'delivery_days' ? Number(value) : value,
    }));
  };

  // Include handlers
  const handleIncludeChange = (index: number, val: string) => {
    const newInc = [...includes];
    newInc[index] = val;
    setIncludes(newInc);
  };
  const addInclude = () => setIncludes([...includes, '']);
  const removeInclude = (index: number) => setIncludes(includes.filter((_, i) => i !== index));

  // Benefit handlers
  const handleBenefitChange = (index: number, val: string) => {
    const newBen = [...benefits];
    newBen[index] = val;
    setBenefits(newBen);
  };
  const addBenefit = () => setBenefits([...benefits, '']);
  const removeBenefit = (index: number) => setBenefits(benefits.filter((_, i) => i !== index));

  // Additional handlers
  const handleAdditionalChange = (index: number, field: 'title' | 'price', val: any) => {
    const newAdd = [...additionals];
    newAdd[index] = { ...newAdd[index], [field]: field === 'price' ? Number(val) : val };
    setAdditionals(newAdd);
  };
  const addAdditional = () => setAdditionals([...additionals, { title: '', price: 15 }]);
  const removeAdditional = (index: number) => setAdditionals(additionals.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          includes: includes.filter((i) => i.trim() !== ''),
          benefits: benefits.filter((b) => b.trim() !== ''),
          additionals: additionals.filter((a) => a.title.trim() !== ''),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create service.');
      } else {
        setSuccessMessage('Service published successfully! Redirecting...');
        setTimeout(() => {
          router.push('/seller/services');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userType="seller" userName="Seller">
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Create New Service
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Publish a new listing to start receiving orders from buyers
            </p>
          </div>
          <Link
            href="/seller/services"
            style={{
              padding: '10px 18px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Cancel
          </Link>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', backgroundColor: '#dcfce7', color: '#15803d' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Card 1: Basic Information */}
          <div
            style={{
              backgroundColor: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
              1. Basic Information
            </h4>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Service Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Professional Painting & Wall Surface Renovation"
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

            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
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
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Electrical Repair</option>
                      <option value={2}>Cleaning Services</option>
                      <option value={3}>Plumbing Solutions</option>
                      <option value={4}>Painting & Renovation</option>
                      <option value={5}>AC & Refrigeration Repair</option>
                      <option value={6}>Salon & Spa</option>
                      <option value={7}>Carpentry & Furniture</option>
                      <option value={8}>Home Relocation & Moving</option>
                    </>
                  )}
                </select>
              </div>

              <div className="col-md-4">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Starting Price (₦) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min={1}
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

              <div className="col-md-4">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Delivery Time (Days) *
                </label>
                <input
                  type="number"
                  name="delivery_days"
                  value={formData.delivery_days}
                  onChange={handleChange}
                  min={1}
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
            </div>

            <div style={{ marginTop: '18px' }}>
              <ImageUpload
                label="Service Cover Image"
                value={formData.image}
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                helpText="Upload a professional banner for your service (JPG, PNG, WEBP up to 10MB)"
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Service Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your service in detail, what the customer should expect, preparation instructions..."
                rows={5}
                required
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

          {/* Card 2: What's Included */}
          <div
            style={{
              backgroundColor: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                2. What's Included in Package
              </h4>
              <button
                type="button"
                onClick={addInclude}
                style={{
                  background: 'none',
                  border: '1px solid var(--main-color-one)',
                  color: 'var(--main-color-one)',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Item
              </button>
            </div>

            {includes.map((inc, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={inc}
                  onChange={(e) => handleIncludeChange(idx, e.target.value)}
                  placeholder="e.g. Surface cleaning and preparation"
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {includes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInclude(idx)}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '0 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="las la-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Card 3: Key Benefits of This Service */}
          <div
            style={{
              backgroundColor: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                  3. Key Benefits of This Service
                </h4>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                  Highlight what makes this package special, your guarantees, and why clients should choose you.
                </p>
              </div>
              <button
                type="button"
                onClick={addBenefit}
                style={{
                  background: 'none',
                  border: '1px solid var(--main-color-one)',
                  color: 'var(--main-color-one)',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add Benefit
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              {benefits.map((ben, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <i
                      className="las la-award"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--main-color-one)',
                        fontSize: '18px',
                      }}
                    ></i>
                    <input
                      type="text"
                      value={ben}
                      onChange={(e) => handleBenefitChange(idx, e.target.value)}
                      placeholder="e.g. 100% Satisfaction Guarantee or Re-service"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px 0 40px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(idx)}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '0 12px',
                        cursor: 'pointer',
                      }}
                      title="Remove Benefit"
                    >
                      <i className="las la-trash"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Additional Add-ons */}
          <div
            style={{
              backgroundColor: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                4. Additional Add-on Services
              </h4>
              <button
                type="button"
                onClick={addAdditional}
                style={{
                  background: 'none',
                  border: '1px solid var(--main-color-one)',
                  color: 'var(--main-color-one)',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Add-on
              </button>
            </div>

            {additionals.map((add, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={add.title}
                  onChange={(e) => handleAdditionalChange(idx, 'title', e.target.value)}
                  placeholder="Add-on title (e.g. Premium Primer Coating)"
                  style={{
                    flex: 2,
                    height: '42px',
                    padding: '0 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <input
                  type="number"
                  value={add.price}
                  onChange={(e) => handleAdditionalChange(idx, 'price', e.target.value)}
                  placeholder="Price (₦)"
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeAdditional(idx)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    color: '#ef4444',
                    borderRadius: '6px',
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="las la-trash"></i>
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '50px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '14px 32px',
                backgroundColor: 'var(--main-color-one)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(29, 191, 115, 0.3)',
              }}
            >
              {isLoading ? 'Publishing Service...' : 'Publish Service Listing'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
