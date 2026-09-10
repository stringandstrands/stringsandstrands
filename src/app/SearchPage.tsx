import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import { ProductCard } from './Shared';
import { supabase } from '../lib/supabase';

interface SearchPageProps {
  wishlist: Set<string>;
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

export default function SearchPage({ wishlist, toggleWishlist }: SearchPageProps) {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase.from('products').select('*')
      .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
      .then(({ data }) => {
        if (!cancelled) {
          const sorted = (data || []).sort((a: any, b: any) => {
            const aInStock = a.stock > 0 ? 1 : 0;
            const bInStock = b.stock > 0 ? 1 : 0;
            return bInStock - aInStock;
          });
          setResults(sorted); 
          setLoading(false); 
        }
      });
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Search size={20} className="text-[#FF2D74]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#FF2D74]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
        </div>
        <p className="text-sm text-[#D41E5C]/70 mb-8">{loading ? 'Searching…' : `${results.length} products found`}</p>

        {results.length === 0 && !loading ? (
          <div className="text-center py-20">
            <p className="text-[#B3184F] font-semibold text-lg mb-2">{q ? 'No results found' : 'Start typing to search'}</p>
            <p className="text-sm text-[#D41E5C]/60">Try a different search term or browse our categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map(p => (
              <ProductCard
                key={p.id}
                product={{ id: p.id, name: p.name, price: p.discounted_price, originalPrice: p.price, img: p.images?.[0] || '', stock: p.stock, dropdownOptions: p.dropdown_options }}
                wishlist={wishlist}
                onWishlistToggle={toggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
