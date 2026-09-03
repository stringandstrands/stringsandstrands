import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;           // cart_item row id
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedOption?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isDrawerOpen: boolean;
  closeDrawer: () => void;
  addToCart: (product: { id: string; name: string; price: number; image: string; selectedOption?: string }) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQty: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartCount: 0,
  cartTotal: 0,
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQty: async () => {},
  clearCart: async () => {},
});

const SESSION_KEY = 'ss_session_id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (user) {
      // Fetch from Supabase for logged-in users
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, selected_option, products(id, name, discounted_price, images)')
        .eq('user_id', user.id);

      if (!error && data) {
        setCartItems(data.map((item: any) => ({
          id: item.id,
          productId: item.products.id,
          name: item.selected_option ? `${item.products.name} (${item.selected_option})` : item.products.name,
          price: item.products.discounted_price,
          image: item.products.images?.[0] || '',
          quantity: item.quantity,
          selectedOption: item.selected_option,
        })));
      }
    } else {
      // Load from localStorage for guests
      const local = JSON.parse(localStorage.getItem('ss_cart') || '[]');
      setCartItems(local);
    }
  }, [user]);

  // Merge guest cart into Supabase when user logs in
  useEffect(() => {
    if (user) {
      const local: CartItem[] = JSON.parse(localStorage.getItem('ss_cart') || '[]');
      if (local.length > 0) {
        const merge = async () => {
          for (const item of local) {
            let q = supabase.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', item.productId);
            if (item.selectedOption) q = q.eq('selected_option', item.selectedOption);
            else q = q.is('selected_option', null);
            
            const { data: existing } = await q.maybeSingle();
            if (existing) {
              await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id);
            } else {
              await supabase.from('cart_items').insert({ user_id: user.id, product_id: item.productId, quantity: item.quantity, selected_option: item.selectedOption || null });
            }
          }
          localStorage.removeItem('ss_cart');
          fetchCart();
        };
        merge();
      } else {
        fetchCart();
      }
    } else {
      fetchCart();
    }
  }, [user, fetchCart]);

  const saveLocalCart = (items: CartItem[]) => {
    localStorage.setItem('ss_cart', JSON.stringify(items));
  };

  const addToCart = async (product: { id: string; name: string; price: number; image: string; selectedOption?: string }) => {
    if (user) {
      // Check if already in cart
      let q = supabase.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', product.id);
      if (product.selectedOption) q = q.eq('selected_option', product.selectedOption);
      else q = q.is('selected_option', null);

      const { data: existing } = await q.maybeSingle();

      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: user.id, product_id: product.id, quantity: 1, selected_option: product.selectedOption || null });
      }
      await fetchCart();
    } else {
      // Local guest cart
      const current: CartItem[] = JSON.parse(localStorage.getItem('ss_cart') || '[]');
      const idx = current.findIndex(i => i.productId === product.id && i.selectedOption === product.selectedOption);
      if (idx >= 0) {
        current[idx].quantity += 1;
      } else {
        current.push({
          id: `local-${product.id}${product.selectedOption ? `-${product.selectedOption}` : ''}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          selectedOption: product.selectedOption,
        });
      }
      saveLocalCart(current);
      setCartItems(current);
    }
    setIsDrawerOpen(true);
  };

  const removeFromCart = async (cartItemId: string) => {
    if (user) {
      await supabase.from('cart_items').delete().eq('id', cartItemId);
      await fetchCart();
    } else {
      const current = cartItems.filter(i => i.id !== cartItemId);
      saveLocalCart(current);
      setCartItems(current);
    }
  };

  const updateQty = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(cartItemId);
    if (user) {
      await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
      await fetchCart();
    } else {
      const current = cartItems.map(i => i.id === cartItemId ? { ...i, quantity } : i);
      saveLocalCart(current);
      setCartItems(current);
    }
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
    localStorage.removeItem('ss_cart');
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal, isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      addToCart, removeFromCart, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
