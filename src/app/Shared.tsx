import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingBag, Heart, Menu, X, ChevronLeft, ChevronRight,
  ChevronDown, Instagram, Facebook, User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';

export const MAGENTA = '#FF2D74';
export const MAGENTA_DARK = '#D41E5C';
export const CHARCOAL = '#B3184F';
export const OFFWHITE = '#FFEAF2';
export const BLUSH = '#FFD1E3';
export const WARM_GREY = '#B3184F';

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ variant = "dark", bgFill = OFFWHITE }: {
  variant?: "dark" | "white" | "magenta";
  bgFill?: string;
}) {
  const color = variant === "white" ? "#FFEAF2" : variant === "magenta" ? MAGENTA : CHARCOAL;
  return (
    <Link to="/" className="flex items-center gap-2.5 select-none cursor-pointer">
      
      <span
        className="text-[17px] font-bold whitespace-nowrap relative -top-[1.5px]"
        style={{ fontFamily: "'Playfair Display', serif", color, letterSpacing: "0.025em" }}
      >
        Strings & Strands
      </span>
    </Link>
  );
}

// ── Announcement Bar ──────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  "✨  Free Shipping Across India on Orders Above ₹499",
  "💎  Certified Quality · Anti-Tarnish Guaranteed",
];

export function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ANNOUNCEMENTS.length), 3500);
    return () => clearInterval(t);
  }, []);
  
  const next = () => setIdx(i => (i + 1) % ANNOUNCEMENTS.length);
  const prev = () => setIdx(i => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);

  return (
    <div className="bg-[#FF2D74] text-[#FFEAF2] text-xs py-2.5 px-10 flex items-center justify-center relative min-h-[36px]">
      <button
        onClick={prev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 p-1"
        aria-label="Previous announcement"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="font-medium tracking-wider text-center flex-1 max-w-xl px-2">{ANNOUNCEMENTS[idx]}</span>
      <button
        onClick={next}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 p-1"
        aria-label="Next announcement"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = ["Earrings", "Necklace", "Ring", "Bracelets", "Bangles", "Sets", "Hair Accessories"];
const SEARCH_PLACEHOLDERS = [
  "Search by style, mood, or occasion…",
  "Find the perfect gift…",
  "Discover new arrivals…",
  "Shop by metal or gemstone…",
];

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
  onAccountClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({ cartCount = 0, onCartClick, onAccountClick, isLoggedIn, userName }: HeaderProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % SEARCH_PLACEHOLDERS.length), 3200);
    return () => clearInterval(t);
  }, []);

  // Debounced search suggestions from Supabase
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      supabase.from('products').select('id, name, category, images, discounted_price, price')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5)
        .then(({ data }) => {
          setSuggestions((data || []).map((p: any) => ({ ...p, title: p.name, originalPrice: p.price, discounted_price: p.discounted_price })));
          setShowSuggestions(true);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setQuery('');
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const SearchBox = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="relative">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3184F] z-10" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
        onFocus={() => query && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={mobile ? 'Search jewellery…' : SEARCH_PLACEHOLDERS[phIdx]}
        className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-white border border-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] focus:ring-1 focus:ring-[#FF2D74] transition-all placeholder:text-[#B3184F]"
        autoFocus={mobile}
      />
      {/* Live suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#FFD1E3] rounded-2xl shadow-lg overflow-hidden z-50">
          {suggestions.map(p => (
            <button
              key={p.id}
              onMouseDown={() => { navigate(`/product/${p.id}`); setQuery(''); setShowSuggestions(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFD1E3]/30 transition-colors text-left"
            >
              <img src={p.images?.[0] || p.images?.[0]} alt={p.title || p.name} className="w-8 h-10 object-cover rounded-lg flex-shrink-0 bg-[#FFD1E3]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#B3184F] truncate">{p.title || p.name}</p>
                <p className="text-xs text-[#D41E5C]">{p.category} · ₹{p.discounted_price}</p>
              </div>
            </button>
          ))}
          <button
            onMouseDown={() => handleSearch(query)}
            className="w-full px-4 py-2.5 text-xs font-bold text-[#FF2D74] text-center hover:bg-[#FFD1E3]/30 border-t border-[#FFD1E3] transition-colors"
          >
            See all results for "{query}" →
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FFEAF2]/85 backdrop-blur-md border-b border-[#FFD1E3] shadow-[0_2px_8px_rgba(179,24,79,0.1)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
        <button
          className="md:hidden flex-shrink-0"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} color={CHARCOAL} /> : <Menu size={22} color={CHARCOAL} />}
        </button>

        <div className="flex-shrink-0">
          <Logo variant="dark" bgFill={OFFWHITE} />
        </div>

        <nav className="hidden md:flex items-center gap-4 lg:gap-6 ml-4 flex-shrink-0">
          {NAV_ITEMS.map(item => (
            <Link
              key={item}
              to={`/category/${item.toLowerCase()}`}
              className="text-[11px] font-semibold uppercase tracking-widest text-[#B3184F] hover:text-[#FF2D74] transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex-1 max-w-sm mx-auto hidden md:block">
          <SearchBox />
        </div>

        <div className="flex items-center gap-3.5 ml-auto">
          <button className="md:hidden" onClick={() => setSearchOpen(v => !v)} aria-label="Search">
            <Search size={20} color={CHARCOAL} />
          </button>
          <button onClick={onAccountClick} aria-label={isLoggedIn ? 'Account' : 'Login'} title={isLoggedIn ? `Hi, ${userName}` : 'Login / Sign Up'} className="relative">
            <User size={20} color={isLoggedIn ? MAGENTA : CHARCOAL} />
            {isLoggedIn && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#FF2D74] rounded-full border border-[#FFEAF2]" />}
          </button>
          <Link to="/wishlist" aria-label="Wishlist">
            <Heart size={20} color={CHARCOAL} />
          </Link>
          <button className="relative" onClick={onCartClick} aria-label="Cart">
            <ShoppingBag size={20} color={CHARCOAL} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF2D74] text-[#FFEAF2] text-[9px] flex items-center justify-center font-bold leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-[#FFD1E3]">
          <div className="mt-2">
            <SearchBox mobile />
          </div>
        </div>
      )}

      </header>

      <div className={`md:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-[#B3184F]/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <nav className={`absolute top-0 left-0 w-[85%] max-w-sm bg-white h-full flex flex-col shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#FFD1E3]">
            <Logo variant="dark" bgFill={OFFWHITE} />
            <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
              <X size={22} color={CHARCOAL} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-5">
            {NAV_ITEMS.map(item => (
              <Link
                key={item}
                to={`/category/${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left py-4 text-[11px] font-bold uppercase tracking-widest text-[#B3184F] border-b border-[#FFD1E3] last:border-0 hover:text-[#FF2D74] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="p-5 border-t border-[#FFD1E3] bg-white">
            <button
              onClick={() => { setMobileMenuOpen(false); onAccountClick?.(); }}
              className="w-full py-3.5 bg-[#FF2D74] text-[#FFEAF2] text-[11px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 hover:bg-[#D41E5C] transition-colors"
            >
              <User size={16} />
              {isLoggedIn ? `Hi, ${userName}` : 'Login / Sign Up'}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

export interface Product {
  id: number | string;
  name: string;
  price: number;
  originalPrice: number;
  badge?: string;
  img: string;
  stock?: number;
}

// Shuffle helper
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Hook that fetches live products from Supabase and returns arrays for home page sections
export function useHomeProducts() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!data || data.length === 0) { setLoading(false); return; }
      const toProduct = (p: any): Product => ({
        id: p.id,
        name: p.name,
        price: p.discounted_price,
        originalPrice: p.price,
        img: p.images?.[0] || '',
        badge: p.is_new ? 'New' : (p.is_bestseller ? 'Best' : undefined),
        stock: p.stock,
      });
      const availableData = data.filter((p: any) => p.stock > 0);
      const newArr = shuffleArray(availableData.filter((p: any) => p.is_new)).slice(0, 8).map(toProduct);
      const best = shuffleArray(availableData.filter((p: any) => p.is_bestseller)).slice(0, 8).map(toProduct);
      // fallback: if no flags, use all
      setNewArrivals(newArr.length > 0 ? newArr : shuffleArray(availableData).slice(0, 8).map(toProduct));
      setBestsellers(best.length > 0 ? best : shuffleArray(availableData).slice(8, 16).map(toProduct));
      setLoading(false);
    }
    load();
  }, []);

  return { newArrivals, bestsellers, loading };
}

// Keep these exports so nothing else breaks — they'll be empty arrays replaced at runtime by the hook
export const NEW_ARRIVALS: Product[] = [];
export const BESTSELLERS: Product[] = [];

export function ProductCard({
  product,
  wishlist,
  onWishlistToggle,
}: {
  product: Product;
  wishlist: Set<string | number>;
  onWishlistToggle: (id: string | number) => void;
}) {
  const { addToCart } = useCart();
  const [addedToBag, setAddedToBag] = useState(false);
  const wished = wishlist.has(product.id) || wishlist.has(String(product.id));

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.img,
    });
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 1500);
  };

  return (
    <Link to={`/product/${product.id}`} className="w-full h-full flex flex-col group cursor-pointer">
      <div className="relative bg-[#FFD1E3] rounded-2xl overflow-hidden aspect-square [transform:translateZ(0)]">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/FFD1E3/FF2D74?text=✦'; }}
        />
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 bg-[#FF2D74] text-[#FFEAF2] text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-widest uppercase">
            {product.badge}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(String(product.id)); }}
          className="absolute top-2.5 right-2.5 w-11 h-11 rounded-full bg-white/85 hover:bg-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={18}
            fill={wished ? MAGENTA : "none"}
            color={wished ? MAGENTA : CHARCOAL}
            strokeWidth={wished ? 0 : 2}
          />
        </button>
        {(product as any).stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-200">Out of Stock</span>
          </div>
        )}
        {/* Slides up on desktop hover */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
              addedToBag
                ? "bg-[#D41E5C] text-[#FFEAF2]"
                : "bg-[#FF2D74] hover:bg-[#D41E5C] text-[#FFEAF2]"
            }`}
          >
            {addedToBag ? "Added ✓" : "Add to Bag"}
          </button>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-1">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-[#FF2D74]">₹{product.price}</span>
          <span className="text-xs text-[#B3184F] line-through">₹{product.originalPrice}</span>
        </div>
        <button
          onClick={handleAdd}
          className="md:hidden mt-2 w-full py-1.5 text-[10px] font-bold rounded-xl bg-[#FF2D74] text-[#FFEAF2] tracking-widest uppercase"
        >
          {addedToBag ? "Added ✓" : "Add to Bag"}
        </button>
      </div>
    </Link>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
const FOOTER_LINKS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Earrings", to: "/category/earrings" },
      { label: "Necklace", to: "/category/necklace" },
      { label: "Ring", to: "/category/ring" },
      { label: "Bracelets", to: "/category/bracelets" },
      { label: "Bangles", to: "/category/bangles" },
      { label: "Sets", to: "/category/sets" },
      { label: "Hair Accessories", to: "/category/hair accessories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping Policy", to: "/shipping-policy" },
      { label: "Returns & Exchange", to: "/returns" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
    ],
  },
];

const PinterestIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  return (
    <footer className="bg-[#B3184F] text-[#FFEAF2] pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-[#FFEAF2]/10">
          <div className="md:col-span-1">
            <Logo variant="#FFEAF2" bgFill="#B3184F" />
            <p className="text-[#FFEAF2]/50 text-xs mt-3 leading-relaxed max-w-[180px]">
              Handcrafted jewellery for every story, every style, every you.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { label: "Instagram", icon: <Instagram size={14} /> },
                { label: "Facebook", icon: <Facebook size={14} /> },
                { label: "Pinterest", icon: <PinterestIcon /> },
              ].map(s => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FF2D74] flex items-center justify-center transition-colors"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map(section => (
            <div key={section.title} className="hidden md:block">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#FFEAF2]/40 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-[#FFEAF2]/60 hover:text-[#FF2D74] text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:hidden space-y-0">
            {FOOTER_LINKS.map(section => (
              <div key={section.title} className="border-b border-[#FFEAF2]/10">
                <button
                  className="w-full flex items-center justify-between py-3.5 text-sm font-semibold text-[#FFEAF2]/80"
                  onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                >
                  {section.title}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${openSection === section.title ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === section.title && (
                  <ul className="pb-3 space-y-2.5 pl-2">
                    {section.links.map(link => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          onClick={() => setOpenSection(null)}
                          className="text-[#FFEAF2]/60 hover:text-[#FF2D74] text-sm transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-[#FFEAF2]/30 text-xs">© 2026 Strings & Strands. All Rights Reserved.</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["UPI", "Visa", "Mastercard", "RuPay", "COD"].map(m => (
              <span key={m} className="bg-white/10 text-[#FFEAF2]/50 text-[10px] px-3 py-1 rounded font-semibold tracking-wider">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

