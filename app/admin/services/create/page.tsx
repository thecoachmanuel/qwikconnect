'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ImageUpload from '@/components/ui/ImageUpload';

export default function AdminCreateServicePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category_id: 1,
    seller_id: 2,
    price: 35000,
    delivery_days: 3,
    description: '',
    image: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [includes, setIncludes] = useState<string[]>(['Professional Quality Guarantee', 'All Materials & Tools Provided']);
  const [benefits, setBenefits] = useState<string[]>(['100% Satisfaction Guarantee', 'Vetted & Verified Professionals']);
  const [additionals, setAdditionals] = useState<{ title: string; price: number }[]>([
    { title: 'Express Same-Day Priority', price: 10000 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Fetch real-time categories
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.categories || [];
        if (list.length > 0) {
          setCategories(list);
          setFormData((prev) => ({ ...prev, category_id: prev.category_id || list[0].id }));
        }
      })
      .catch((err) => console.error('Categories fetch error:', err));

    // Fetch real-time sellers
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const users = data.users || (Array.isArray(data) ? data : []);
        const sellerUsers = users.filter((u: any) => Number(u.user_type) === 0 || u.user_type === 'seller');
        const activeSellers = sellerUsers.length > 0 ? sellerUsers : users;
        setSellers(activeSellers);
        if (activeSellers.length > 0) {
          setFormData((prev) => ({ ...prev, seller_id: prev.seller_id || activeSellers[0].id }));
        }
      })
      .catch((err) => console.error('Sellers fetch error:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category_id' || name === 'seller_id' || name === 'price' || name === 'delivery_days' ? Number(value) : value,
    }));
  };

  const handleIncludeChange = (index: number, val: string) => {
    const newInc = [...includes];
    newInc[index] = val;
    setIncludes(newInc);
  };
  const addInclude = () => setIncludes([...includes, '']);
  const removeInclude = (index: number) => setIncludes(includes.filter((_, i) => i !== index));

  const handleBenefitChange = (index: number, val: string) => {
    const newBen = [...benefits];
    newBen[index] = val;
    setBenefits(newBen);
  };
  const addBenefit = () => setBenefits([...benefits, '']);
  const removeBenefit = (index: number) => setBenefits(benefits.filter((_, i) => i !== index));

  const handleAdditionalChange = (index: number, field: 'title' | 'price', val: any) => {
    const newAdd = [...additionals];
    newAdd[index] = { ...newAdd[index], [field]: field === 'price' ? Number(val) : val };
    setAdditionals(newAdd);
  };
  const addAdditional = () => setAdditionals([...additionals, { title: '', price: 5000 }]);
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
        setSuccessMessage('Service created and published successfully! Redirecting to services list...');
        setTimeout(() => {
          router.push('/admin/services');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong while publishing the service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Add Service Offering">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Add Service Offering</h4>
          <p className="text-muted small mb-0">Publish official platform services and manage marketplace offerings</p>
        </div>
        <Link href="/admin/services" className="btn btn-outline-secondary btn-sm">
          <i className="las la-arrow-left me-1"></i> Back to Services
        </Link>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-exclamation-circle fs-4 me-2"></i>
          <div>{errorMessage}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-check-circle fs-4 me-2"></i>
          <div>{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Service Information</h5>
              
              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Service Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  placeholder="e.g. Expert Home Deep Cleaning & Sanitization"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Category *</label>
                  <select
                    name="category_id"
                    className="form-select"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Cleaning & Housekeeping</option>
                        <option value={2}>Electrical & Wiring</option>
                        <option value={3}>Plumbing & Pipefitting</option>
                        <option value={4}>Carpentry & Woodwork</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Assign To Seller / Specialist</label>
                  <select
                    name="seller_id"
                    className="form-select"
                    value={formData.seller_id}
                    onChange={handleChange}
                  >
                    {sellers.length > 0 ? (
                      sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={2}>Chioma Adebayo (Pro Cleaner)</option>
                        <option value={3}>Babajide Olatunji (Master Electrician)</option>
                        <option value={6}>Ngozi Dike (Lead Stylist & Decorator)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Detailed Description *</label>
                <textarea
                  name="description"
                  rows={5}
                  className="form-control"
                  placeholder="Provide an exhaustive summary of the service scope, tools used, and what customers can expect..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
            </div>

            {/* Included & Benefits */}
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Scope & Features Included</h5>
              <div className="mb-4">
                <label className="form-label fw-semibold small text-muted">What is included in this package:</label>
                {includes.map((inc, i) => (
                  <div key={i} className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={inc}
                      onChange={(e) => handleIncludeChange(i, e.target.value)}
                      placeholder="e.g. Standard deep vacuuming & sanitizing"
                    />
                    {includes.length > 1 && (
                      <button type="button" className="btn btn-outline-danger" onClick={() => removeInclude(i)}>
                        <i className="las la-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={addInclude}>
                  <i className="las la-plus me-1"></i> Add Included Item
                </button>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small text-muted">Customer Benefits:</label>
                {benefits.map((ben, i) => (
                  <div key={i} className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={ben}
                      onChange={(e) => handleBenefitChange(i, e.target.value)}
                      placeholder="e.g. 100% Satisfaction Guarantee"
                    />
                    {benefits.length > 1 && (
                      <button type="button" className="btn btn-outline-danger" onClick={() => removeBenefit(i)}>
                        <i className="las la-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={addBenefit}>
                  <i className="las la-plus me-1"></i> Add Benefit
                </button>
              </div>
            </div>

            {/* Addon Services */}
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Optional Add-On Services</h5>
              {additionals.map((add, i) => (
                <div key={i} className="row g-2 mb-2 align-items-center">
                  <div className="col-7">
                    <input
                      type="text"
                      className="form-control"
                      value={add.title}
                      placeholder="Add-on item title"
                      onChange={(e) => handleAdditionalChange(i, 'title', e.target.value)}
                    />
                  </div>
                  <div className="col-4">
                    <div className="input-group">
                      <span className="input-group-text">₦</span>
                      <input
                        type="number"
                        className="form-control"
                        value={add.price}
                        placeholder="Price"
                        onChange={(e) => handleAdditionalChange(i, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-1 text-end">
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeAdditional(i)}>
                      <i className="las la-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={addAdditional}>
                <i className="las la-plus me-1"></i> Add Add-on Service
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            {/* Pricing & Logistics */}
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Pricing & Turnaround</h5>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Base Service Fee (₦) *</label>
                <div className="input-group">
                  <span className="input-group-text fw-bold">₦</span>
                  <input
                    type="number"
                    name="price"
                    className="form-control fw-bold"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min={100}
                  />
                </div>
                <small className="text-muted">Standard rate displayed to buyers across Nigeria</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Turnaround / Execution Time (Days)</label>
                <input
                  type="number"
                  name="delivery_days"
                  className="form-control"
                  value={formData.delivery_days}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>

            {/* Featured Media */}
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Featured Cover Image</h5>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                label="Upload Service Cover"
              />
            </div>

            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-success w-100 py-3 fw-bold"
                style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Publishing Offering...
                  </>
                ) : (
                  <>
                    <i className="las la-cloud-upload-alt me-1"></i> Publish Service Offering
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
