import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface SupabaseProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  discounted_price: number;
  description?: string;
  images: string[];
  stock: number;
  is_bestseller: boolean;
  is_new: boolean;
  metal?: string;
  color?: string;
  occasion?: string;
  type?: string;
  dropdown_options?: string;
  created_at: string;
}

// Normalise a Supabase product into the Product shape used by ProductCard / pages
export function toProduct(p: SupabaseProduct) {
  return {
    id: p.id,
    name: p.name,
    price: p.discounted_price,
    originalPrice: p.price,
    img: p.images?.[0] || '',
    badge: p.is_new ? 'New' : (p.is_bestseller ? 'Best' : undefined),
    stock: p.stock,
    category: p.category,
    images: p.images,
    description: p.description,
    metal: p.metal,
    color: p.color,
    occasion: p.occasion,
    type: p.type,
    dropdownOptions: p.dropdown_options,
  };
}

// Fetch all products (optionally filtered by category / type)
export function useProducts(options?: {
  category?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  limit?: number;
}) {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (options?.category) query = query.eq('category', options.category);
        if (options?.isBestseller !== undefined) query = query.eq('is_bestseller', options.isBestseller);
        if (options?.isNew !== undefined) query = query.eq('is_new', options.isNew);
        if (options?.limit) query = query.limit(options.limit);

        const { data, error: err } = await query;
        if (cancelled) return;
        if (err) throw err;
        const sorted = (data || []).sort((a: any, b: any) => {
          const aInStock = a.stock > 0 ? 1 : 0;
          const bInStock = b.stock > 0 ? 1 : 0;
          return bInStock - aInStock;
        });
        setProducts(sorted);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [options?.category, options?.isBestseller, options?.isNew, options?.limit]);

  return { products, loading, error };
}

// Fetch a single product by ID
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<SupabaseProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (err) setError(err.message);
      else setProduct(data);
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [id]);

  return { product, loading, error };
}
