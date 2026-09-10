import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: new Set(),
  toggleWishlist: async () => {},
  isWishlisted: () => false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlist(new Set()); return; }
    const { data } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', user.id);
    if (data) setWishlist(new Set(data.map((r: any) => r.product_id)));
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return; // caller should open auth modal
    if (wishlist.has(productId)) {
      await supabase.from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      setWishlist(prev => { const s = new Set(prev); s.delete(productId); return s; });
    } else {
      if (window.fbq) {
        window.fbq('track', 'AddToWishlist', {
          content_ids: [productId]
        });
      }
      await supabase.from('wishlist_items')
        .insert({ user_id: user.id, product_id: productId });
      setWishlist(prev => new Set([...prev, productId]));
    }
  };

  const isWishlisted = (productId: string) => wishlist.has(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
