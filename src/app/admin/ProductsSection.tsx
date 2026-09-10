import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';
import AddProductModal from './AddProductModal';

const API = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
const CATEGORIES = ['All', 'Earrings', 'Necklace', 'Ring', 'Bracelets', 'Bangles', 'Sets', 'Hair Accessories'];

async function getAdminToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

type SortField = 'name' | 'price' | 'stock' | 'created_at';

export default function ProductsSection() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      const params = new URLSearchParams({
        page: String(page), limit: String(limit),
        sortBy, sortDir,
        ...(search && { search }),
        ...(category && category !== 'All' && { category }),
      });
      const resp = await fetch(`${API}/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy, sortDir, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSort(field: SortField) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
    setPage(1);
  }

  async function toggleStock(product: any) {
    try {
      const token = await getAdminToken();
      const newStock = product.stock > 0 ? 0 : 50;
      const resp = await fetch(`${API}/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock: newStock }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      showToast(newStock === 0 ? 'Marked as out of stock' : 'Back in stock!', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getAdminToken();
      const resp = await fetch(`${API}/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      showToast(`"${deleteTarget.name}" deleted`, 'success');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function generateReviews(product: any) {
    try {
      showToast('Generating reviews...', 'success');
      const token = await getAdminToken();
      const resp = await fetch(`${API}/api/admin/products/${product.id}/generate-reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      showToast(data.message || `Reviews generated for ${product.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate reviews', 'error');
    }
  }

  const sortArrow = (field: SortField) => sortBy === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{total} products total</p>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(true)}>
          + Add Product
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-filters">
            <input
              className="admin-input"
              placeholder="Search by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width: 220 }}
            />
            <select
              className="admin-input"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
            >
              {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-spinner"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="admin-empty">No products found.</div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Image</th>
                    <th onClick={() => handleSort('name')}>Name{sortArrow('name')}</th>
                    <th>Category</th>
                    <th onClick={() => handleSort('price')}>Price{sortArrow('price')}</th>
                    <th>Disc. Price</th>
                    <th>Badges</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="admin-thumb" />
                          : <div className="admin-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ccc' }}>No img</div>
                        }
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{p.id}</div>
                      </td>
                      <td><span className="badge badge-pink">{p.category}</span></td>
                      <td style={{ fontWeight: 600 }}>₹{p.price?.toLocaleString()}</td>
                      <td style={{ color: '#b3184f' }}>₹{p.discounted_price?.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.is_bestseller && <span className="badge badge-yellow">⭐ Best</span>}
                          {p.is_new && <span className="badge badge-blue">✦ New</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-btn admin-btn-ghost" onClick={() => setEditProduct(p)} title="Edit">✎</button>
                          <button className="admin-btn admin-btn-ghost" onClick={() => generateReviews(p)} title="Generate Reviews">💬</button>
                          <button className="admin-btn admin-btn-ghost" onClick={() => toggleStock(p)} title={p.stock > 0 ? 'Mark out of stock' : 'Back in stock'}>
                            {p.stock > 0 ? '⊘' : '✓'}
                          </button>
                          <button className="admin-btn admin-btn-danger" style={{ padding: '6px 8px' }} onClick={() => setDeleteTarget(p)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-btn admin-btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button className="admin-btn admin-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editProduct) && (
        <AddProductModal
          onClose={() => { setShowAdd(false); setEditProduct(null); }}
          onSaved={fetchProducts}
          editProduct={editProduct}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="admin-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="admin-modal admin-modal-sm">
            <h2 style={{ color: '#e53e3e' }}>Delete Product?</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete <strong>"{deleteTarget.name}"</strong>? This cannot be undone.
              Past order history referencing this product will be preserved.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={deleting} style={{ background: '#e53e3e', color: '#fff', border: 'none' }}>
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
