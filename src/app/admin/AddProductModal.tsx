import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';

const CATEGORIES = ['Earrings', 'Necklace', 'Ring', 'Bracelets', 'Bangles', 'Sets', 'Hair Accessories'];

// Must match the `id` values in OCCASION_TILES (HomePage.tsx) so category filtering works
const OCCASIONS = [
  { id: 'everyday',     label: 'Everyday' },
  { id: 'office',       label: 'Office' },
  { id: 'celebrations', label: 'Celebrations' },
  { id: 'gift-for-her', label: 'Gift for Her' },
];

const METALS = [
  { id: 'Gold Plated', label: 'Gold Plated' },
  { id: 'Rose Gold', label: 'Rose Gold' },
  { id: 'Silver', label: 'Silver' },
  { id: 'Oxidised', label: 'Oxidised' },
];

const TYPES = [
  { id: 'Studs', label: 'Studs' },
  { id: 'Hoops', label: 'Hoops' },
  { id: 'Danglers', label: 'Danglers' },
  { id: 'Jhumkas', label: 'Jhumkas' },
  { id: 'Chokers', label: 'Chokers' },
  { id: 'Long', label: 'Long' },
];

const API = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');

async function getAdminToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

interface Props { onClose: () => void; onSaved: () => void; editProduct?: any; }

export default function AddProductModal({ onClose, onSaved, editProduct }: Props) {
  const { showToast } = useToast();
  const isEdit = !!editProduct;

  const [form, setForm] = useState({
    name: editProduct?.name || '',
    category: editProduct?.category || 'Earrings',
    price: editProduct?.price || '',
    discounted_price: editProduct?.discounted_price || '',
    description: editProduct?.description || '',
    metal: editProduct?.metal || '',
    color: editProduct?.color || '',
    occasion: editProduct?.occasion || '',
    type: editProduct?.type || '',
    dropdown_options: editProduct?.dropdown_options || '',
    stock: editProduct?.stock ?? 50,
    rating: editProduct?.rating ?? 5.0,
    is_bestseller: editProduct?.is_bestseller || false,
    is_new: editProduct?.is_new ?? true,
  });

  // Parse existing occasion string into a set of selected IDs for the multi-select
  const [selectedOccasions, setSelectedOccasions] = useState<Set<string>>(() => {
    if (!editProduct?.occasion) return new Set();
    const raw = editProduct.occasion as string;
    const matched = OCCASIONS
      .map(o => o.id)
      .filter(id => raw.toLowerCase().includes(id.toLowerCase()));
    return new Set(matched.length > 0 ? matched : []);
  });

  const toggleOccasion = (id: string) => {
    setSelectedOccasions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Keep form.occasion in sync as a comma-separated string of IDs
      const newOccasionStr = [...next].join(', ');
      setForm(f => ({ ...f, occasion: newOccasionStr }));
      return next;
    });
  };

  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(() => {
    if (!editProduct?.metal) return new Set();
    const raw = editProduct.metal as string;
    const matched = METALS.map(o => o.id).filter(id => raw.toLowerCase().includes(id.toLowerCase()));
    return new Set(matched.length > 0 ? matched : []);
  });

  const toggleMetal = (id: string) => {
    setSelectedMetals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const newMetalStr = [...next].join(', ');
      setForm(f => ({ ...f, metal: newMetalStr }));
      return next;
    });
  };

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => {
    if (!editProduct?.type) return new Set();
    const raw = editProduct.type as string;
    const matched = TYPES.map(o => o.id).filter(id => raw.toLowerCase().includes(id.toLowerCase()));
    return new Set(matched.length > 0 ? matched : []);
  });

  const toggleType = (id: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const newTypeStr = [...next].join(', ');
      setForm(f => ({ ...f, type: newTypeStr }));
      return next;
    });
  };

  const [existingImages, setExistingImages] = useState<string[]>(editProduct?.images || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Multi-color advanced state
  const colorsArray = form.color ? form.color.split(',').map(c => c.trim()).filter(Boolean) : [];
  const isMultiColor = !isEdit && colorsArray.length > 1;
  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({});
  const [variantPreviews, setVariantPreviews] = useState<Record<string, string[]>>({});

  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState<string | boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Keep track of which variant triggered the file input
  const [activeVariantForUpload, setActiveVariantForUpload] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addFiles = useCallback((files: File[], variantColor?: string) => {
    const valid = files.filter(f => f.type.startsWith('image/'));
    
    if (variantColor) {
      setVariantFiles(prev => ({ ...prev, [variantColor]: [...(prev[variantColor] || []), ...valid] }));
      valid.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => setVariantPreviews(prev => ({ 
          ...prev, 
          [variantColor]: [...(prev[variantColor] || []), e.target?.result as string] 
        }));
        reader.readAsDataURL(f);
      });
    } else {
      setNewImageFiles(prev => [...prev, ...valid]);
      valid.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => setNewImagePreviews(prev => [...prev, e.target?.result as string]);
        reader.readAsDataURL(f);
      });
    }
  }, []);

  const onDrop = (e: React.DragEvent, variantColor?: string) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files), variantColor);
  };

  const removeNewImage = (i: number, variantColor?: string) => {
    if (variantColor) {
      setVariantFiles(prev => ({ ...prev, [variantColor]: prev[variantColor].filter((_, idx) => idx !== i) }));
      setVariantPreviews(prev => ({ ...prev, [variantColor]: prev[variantColor].filter((_, idx) => idx !== i) }));
    } else {
      setNewImageFiles(prev => prev.filter((_, idx) => idx !== i));
      setNewImagePreviews(prev => prev.filter((_, idx) => idx !== i));
    }
  };

  const removeExistingImage = (i: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== i));
  };

  async function uploadFilesBatch(files: File[]): Promise<string[]> {
    const token = await getAdminToken();
    const urls: string[] = [];
    for (const file of files) {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target!.result as string).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch(`${API}/api/admin/products/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type }),
      });
      const data = await resp.json();
      if (data.url) urls.push(data.url);
      else throw new Error(data.error || 'Upload failed');
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { showToast('Name and price are required', 'error'); return; }
    setSaving(true);
    try {
      const token = await getAdminToken();
      
      const payload: any = {
        ...form,
        price: Number(form.price),
        discounted_price: Number(form.discounted_price) || Number(form.price),
        stock: Number(form.stock),
        rating: Number(form.rating) || 5.0,
      };

      if (isMultiColor) {
        const variants = [];
        for (const color of colorsArray) {
          const files = variantFiles[color] || [];
          const uploadedUrls = await uploadFilesBatch(files);
          variants.push({ color, images: uploadedUrls });
        }
        payload.variants = variants;
      } else {
        const uploadedUrls = await uploadFilesBatch(newImageFiles);
        payload.images = [...existingImages, ...uploadedUrls];
      }

      const url = isEdit
        ? `${API}/api/admin/products/${editProduct.id}`
        : `${API}/api/admin/products`;
      const method = isEdit ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');

      showToast(isEdit ? 'Product updated!' : 'Product created!', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={{ maxWidth: 680 }}>
        <button className="admin-modal-close" onClick={onClose}>✕</button>
        <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field full">
              <label className="admin-label">Product Name *</label>
              <input className="admin-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rose Gold Drop Earring" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Category</label>
              <select className="admin-input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Stock Quantity</label>
              <input className="admin-input" type="number" name="stock" value={form.stock} onChange={handleChange} min="0" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Price (₹) *</label>
              <input className="admin-input" type="number" name="price" value={form.price} onChange={handleChange} required min="0" placeholder="699" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Product Rating (0-5)</label>
              <input className="admin-input" type="number" name="rating" value={form.rating} onChange={handleChange} min="0" max="5" step="0.1" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Discounted Price (₹)</label>
              <input className="admin-input" type="number" name="discounted_price" value={form.discounted_price} onChange={handleChange} min="0" placeholder="Same as price if no discount" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Metal</label>
              <div style={{
                border: '1px solid #e8b4c8',
                borderRadius: 8,
                padding: '10px 12px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {METALS.map(({ id, label }) => (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: selectedMetals.has(id) ? '#c0386b' : '#555',
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${selectedMetals.has(id) ? '#c0386b' : '#ddd'}`,
                      background: selectedMetals.has(id) ? '#c0386b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {selectedMetals.has(id) && (
                        <svg width="10" height="8" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={selectedMetals.has(id)}
                      onChange={() => toggleMetal(id)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Color(s)</label>
              <input className="admin-input" name="color" value={form.color} onChange={handleChange} placeholder="e.g. Gold, Silver, Rose Gold" />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Separate multiple colors with commas to auto-create variants.</div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Dropdown Options</label>
              <input className="admin-input" name="dropdown_options" value={form.dropdown_options} onChange={handleChange} placeholder="e.g. Red, Blue, Pink" />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Comma separated. Creates a single product with a dropdown menu.</div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Occasion</label>
              <div style={{
                border: '1px solid #e8b4c8',
                borderRadius: 8,
                padding: '10px 12px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {OCCASIONS.map(({ id, label }) => (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: selectedOccasions.has(id) ? '#c0386b' : '#555',
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${selectedOccasions.has(id) ? '#c0386b' : '#ddd'}`,
                      background: selectedOccasions.has(id) ? '#c0386b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}>
                      {selectedOccasions.has(id) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedOccasions.has(id)}
                      onChange={() => toggleOccasion(id)}
                      style={{ display: 'none' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {selectedOccasions.size === 0 && (
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Select at least one occasion</p>
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Type</label>
              <div style={{
                border: '1px solid #e8b4c8',
                borderRadius: 8,
                padding: '10px 12px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {TYPES.map(({ id, label }) => (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: selectedTypes.has(id) ? '#c0386b' : '#555',
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${selectedTypes.has(id) ? '#c0386b' : '#ddd'}`,
                      background: selectedTypes.has(id) ? '#c0386b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {selectedTypes.has(id) && (
                        <svg width="10" height="8" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={selectedTypes.has(id)}
                      onChange={() => toggleType(id)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-field full">
              <label className="admin-label">Description</label>
              <textarea className="admin-input" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the product…" />
            </div>

            <div className="admin-field full" style={{ flexDirection: 'row', gap: 20 }}>
              <label className="admin-toggle">
                <input type="checkbox" name="is_bestseller" checked={form.is_bestseller} onChange={handleChange} />
                Mark as Bestseller
              </label>
              <label className="admin-toggle">
                <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} />
                Mark as New Arrival
              </label>
            </div>

            <div className="admin-field full">
              <label className="admin-label">Product Images</label>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => addFiles(Array.from(e.target.files || []), activeVariantForUpload || undefined)} />

              {isMultiColor ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {colorsArray.map(color => (
                    <div key={color} style={{ border: '1px solid #ffd1e3', borderRadius: 8, padding: 16, background: '#fff9fb' }}>
                      <label className="admin-label" style={{ color: '#b3184f', marginBottom: 12 }}>Images for {color}</label>
                      
                      <div
                        className={`upload-zone ${dragOver === color ? 'drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(color); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => onDrop(e, color)}
                        onClick={() => { setActiveVariantForUpload(color); fileRef.current?.click(); }}
                      >
                        <svg width="28" height="28" fill="none" stroke="#ffa0c0" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <p>Drag & drop images for {color}</p>
                      </div>
                      
                      {(variantPreviews[color] || []).length > 0 && (
                        <div className="upload-previews" style={{ marginTop: 10 }}>
                          {(variantPreviews[color] || []).map((src, i) => (
                            <div key={i} className="upload-preview">
                              <img src={src} alt="" />
                              <button className="upload-preview-del" onClick={() => removeNewImage(i, color)} type="button">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {existingImages.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Existing images:</p>
                      <div className="upload-previews">
                        {existingImages.map((url, i) => (
                          <div key={i} className="upload-preview">
                            <img src={url} alt="" />
                            <button className="upload-preview-del" onClick={() => removeExistingImage(i)} type="button">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    className={`upload-zone ${dragOver === true ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => onDrop(e)}
                    onClick={() => { setActiveVariantForUpload(null); fileRef.current?.click(); }}
                  >
                    <svg width="28" height="28" fill="none" stroke="#ffa0c0" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p>Drag & drop images here, or click to browse</p>
                  </div>
                  
                  {newImagePreviews.length > 0 && (
                    <div className="upload-previews" style={{ marginTop: 10 }}>
                      {newImagePreviews.map((src, i) => (
                        <div key={i} className="upload-preview">
                          <img src={src} alt="" />
                          <button className="upload-preview-del" onClick={() => removeNewImage(i)} type="button">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
