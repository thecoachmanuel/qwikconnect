'use client';

import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
}

export default function ImageUpload({
  label = 'Upload Image',
  value,
  onChange,
  required = false,
  helpText = 'Recommended size: 800x600px. JPG, PNG, WEBP up to 10MB.',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal preview when value prop changes (e.g. from async settings fetch)
  React.useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setPreview(data.url);
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label small fw-semibold text-muted d-block">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {preview ? (
        <div className="position-relative d-inline-block border rounded-3 p-2 bg-light">
          <img
            src={preview}
            alt="Uploaded Preview"
            style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1"
            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Remove image"
          >
            <i className="las la-times" style={{ fontSize: '12px' }}></i>
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#f8fafc',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--main-color-one)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
        >
          {uploading ? (
            <div>
              <div className="spinner-border spinner-border-sm text-success mb-2" role="status"></div>
              <p className="small text-muted mb-0">Uploading image to server...</p>
            </div>
          ) : (
            <div>
              <i className="las la-cloud-upload-alt" style={{ fontSize: '32px', color: 'var(--main-color-one)' }}></i>
              <p className="fw-semibold text-dark mb-1 small">Click to upload image</p>
              <p className="text-muted small mb-0">{helpText}</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {error && <div className="text-danger small mt-1">{error}</div>}

      {/* Manual URL input fallback */}
      <div className="mt-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Or paste direct image URL (e.g. /assets/uploads/...)"
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value);
            onChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
