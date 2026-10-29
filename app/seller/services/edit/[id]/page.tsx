'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ImageUpload from '@/components/ui/ImageUpload';

interface EditServicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: 1,
    price: 35000,
    delivery_days: 3,
    description: '',
    image: '',
    is_service_on: 1,
  });

  const [includes, setIncludes] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [additionals, setAdditionals] = useState<{ title: string; price: number }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load categories
        const catRes = await fetch('/api/admin/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        // Load service
        const res = await fetch(`/api/services/${id}`);
        if (!res.ok) {
          throw new Error('Service not found');
        }
        const json = await res.json();
        const s = json.service;

        setFormData({
          title: s.title || '',
          category_id: s.category_id || 1,
          price: Number(s.price || 0),
          delivery_days: Number(s.delivery_days || 3),
          description: s.description || '',
          image: s.image || '',
          is_service_on: s.is_service_on ?? 1,
        });

        if (Array.isArray(s.includes)) {
          setIncludes(
            s.includes.map((inc: any) =>
              typeof inc === 'string' ? inc : (inc.include_service_title || inc.title || '')
            ).filter(Boolean)
          );
        } else {
          setIncludes(['Full Service Execution', 'Necessary Materials & Tools']);
        }

        if (Array.isArray(s.benefits)) {
          setBenefits(
            s.benefits.map((b: any) =>
              typeof b === 'string' ? b : (b.benifits || b.benefits_title || b.title || '')
            ).filter(Boolean)
          );
        } else {
          setBenefits(['100% Satisfaction Guarantee', 'Quality Verified Work']);
        }

        if (Array.isArray(s.additionals)) {
          setAdditionals(
            s.additionals.map((a: any) => ({
              title: a.additional_service_title || a.title || '',
              price: Number(a.additional_service_price || a.price || 0),
            }))
          );
        } else {
          setAdditionals([]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load service data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category_id' || name === 'price' || name === 'delivery_days' || name === 'is_service_on'
        ? Number(value)
        : value,
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
  const addAdditional = () => setAdditionals([...additionals, { title: '', price: 5000 }]);
  const removeAdditional = (index: number) => setAdditionals(additionals.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
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
        setErrorMessage(data.message || 'Failed to update service.');
      } else {
        setSuccessMessage('Service updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/seller/services');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="seller" title="Edit Service">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading service...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="seller" userName="Seller" title="Edit Service">
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Edit Service Listing
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Update service specifications, pricing, and package details
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
            Back to Services
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
                required
                className="form-control"
                style={{ height: '48px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="form-select"
                  style={{ height: '48px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Availability Status *
                </label>
                <select
                  name="is_service_on"
                  value={formData.is_service_on}
                  onChange={handleChange}
                  className="form-select"
                  style={{ height: '48px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value={1}>Active (Available for booking)</option>
                  <option value={0}>Paused (Hidden from booking)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Execution */}
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
              2. Pricing & Delivery
            </h4>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Base Service Price (₦) *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold">₦</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="1"
                    required
                    className="form-control"
                    style={{ height: '48px', fontSize: '15px', borderRadius: '0 8px 8px 0', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Estimated Delivery / Execution Days *
                </label>
                <input
                  type="number"
                  name="delivery_days"
                  value={formData.delivery_days}
                  onChange={handleChange}
                  min="1"
                  required
                  className="form-control"
                  style={{ height: '48px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Service Featured Image
              </label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
                className="form-control"
                style={{ fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '12px' }}
              />
            </div>
          </div>

          {/* Card 3: What's Included */}
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
                3. What's Included
              </h4>
              <button
                type="button"
                onClick={addInclude}
                className="btn btn-sm btn-outline-success"
              >
                + Add Item
              </button>
            </div>

            {includes.map((inc, i) => (
              <div key={i} className="d-flex gap-2 mb-2">
                <input
                  type="text"
                  value={inc}
                  onChange={(e) => handleIncludeChange(i, e.target.value)}
                  className="form-control"
                  placeholder="e.g. Full diagnostic check"
                  style={{ borderRadius: '6px', fontSize: '14px' }}
                />
                {includes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInclude(i)}
                    className="btn btn-outline-danger btn-sm px-3"
                  >
                    <i className="las la-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Card 4: Key Benefits of This Service */}
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
                  4. Key Benefits of This Service
                </h4>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                  Highlight what makes this package special, your guarantees, and why clients should choose you.
                </p>
              </div>
              <button
                type="button"
                onClick={addBenefit}
                className="btn btn-sm btn-outline-success"
              >
                + Add Benefit
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              {benefits.map((ben, i) => (
                <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <i
                      className="las la-award"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--main-color-one)',
                        fontSize: '18px',
                      }}
                    ></i>
                    <input
                      type="text"
                      value={ben}
                      onChange={(e) => handleBenefitChange(i, e.target.value)}
                      className="form-control"
                      placeholder="e.g. 100% Satisfaction Guarantee or Re-service"
                      style={{ borderRadius: '6px', fontSize: '14px', paddingLeft: '38px' }}
                    />
                  </div>
                  {benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(i)}
                      className="btn btn-outline-danger btn-sm px-3"
                      title="Remove Benefit"
                    >
                      <i className="las la-trash"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Additional Services */}
          <div
            style={{
              backgroundColor: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '30px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                5. Additional Add-on Services
              </h4>
              <button
                type="button"
                onClick={addAdditional}
                className="btn btn-sm btn-outline-success"
              >
                + Add Add-on
              </button>
            </div>

            {additionals.map((add, i) => (
              <div key={i} className="row g-2 mb-2 align-items-center">
                <div className="col-7">
                  <input
                    type="text"
                    value={add.title}
                    onChange={(e) => handleAdditionalChange(i, 'title', e.target.value)}
                    className="form-control"
                    placeholder="Add-on title, e.g. Extra deep clean"
                    style={{ borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div className="col-4">
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">₦</span>
                    <input
                      type="number"
                      value={add.price}
                      onChange={(e) => handleAdditionalChange(i, 'price', e.target.value)}
                      className="form-control"
                      placeholder="Extra Price"
                      style={{ borderRadius: '0 6px 6px 0', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div className="col-1 text-end">
                  <button
                    type="button"
                    onClick={() => removeAdditional(i)}
                    className="btn btn-outline-danger btn-sm p-2"
                  >
                    <i className="las la-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end gap-3 pb-5">
            <Link
              href="/seller/services"
              className="btn btn-light border px-4"
              style={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-success px-4"
              style={{
                backgroundColor: 'var(--main-color-one)',
                borderColor: 'var(--main-color-one)',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save & Update Service'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
