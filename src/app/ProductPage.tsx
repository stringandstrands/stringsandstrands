import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, StarHalf, Minus, Plus, ChevronDown, CheckCircle, ThumbsUp, ThumbsDown, Heart, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { MAGENTA, CHARCOAL } from './Shared';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';

export interface Review {
  id: string;
  name: string;
  date: string;
  verified: boolean;
  rating: number;
  title: string;
  text: string;
  images?: string[];
}

export interface ProductData {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  images: string[];
  reviews: Review[];
  rating?: number;
  description?: string;
  dropdownOptions?: string[];
}

const TRUST_BADGES = [
  { icon: <Truck size={18} />, label: 'Free Shipping', sub: 'On orders above ₹499' },
  { icon: <ShieldCheck size={18} />, label: 'Certified Quality', sub: 'Anti-tarnish guaranteed' },
];

export default function ProductPage({ wishlist, toggleWishlist, isWishlisted }: { wishlist: Set<string | number>, toggleWishlist: (id: string | number) => void, isWishlisted?: (id: string) => boolean }) {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [stockCount, setStockCount] = useState<number>(50);
  const [variants, setVariants] = useState<{id: string, color: string, title: string}[]>([]);
  const [selectedDropdownOption, setSelectedDropdownOption] = useState<string>('');
  
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const wished = productId ? (wishlist.has(productId) || (isWishlisted ? isWishlisted(productId) : false)) : false;

  useEffect(() => {
    if (!productId) return;
    supabase.from('products').select('*').eq('id', productId).single().then(async ({ data }) => {
      if (data) {
        setStockCount(data.stock ?? 0);
        
        const dropdownOptions = data.dropdown_options
          ? data.dropdown_options.split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined;

        const { data: reviewsData } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
        const reviews = (reviewsData || []).map(r => ({
          id: r.id,
          name: r.reviewer_name,
          rating: r.rating,
          title: r.title,
          text: r.review_text,
          date: new Date(r.created_at).toLocaleDateString(),
          verified: true
        }));

        setProduct({
          id: data.id,
          title: data.name,
          category: data.category,
          price: data.discounted_price,
          originalPrice: data.price,
          images: data.images || [],
          reviews: reviews,
          rating: data.rating,
          description: data.description,
          dropdownOptions,
        });

        // Find variants by base name
        const match = data.name.match(/^(.*?)\s*\(([^)]+)\)$/);
        const baseName = match ? match[1] : data.name;
        
        supabase.from('products')
          .select('id, name, color')
          .ilike('name', `${baseName}%`)
          .then(({ data: variantData }) => {
            if (variantData) {
              const validVariants = variantData
                .filter((v: any) => {
                  const vMatch = v.name.match(/^(.*?)\s*\(([^)]+)\)$/);
                  const vBaseName = vMatch ? vMatch[1] : v.name;
                  return vBaseName.trim() === baseName.trim();
                })
                .map((v: any) => {
                  const m = v.name.match(/\(([^)]+)\)$/);
                  return { id: v.id, color: m ? m[1] : (v.color || 'Standard'), title: v.name };
                });
              if (validVariants.length > 1) {
                setVariants(validVariants);
              } else {
                setVariants([]);
              }
            }
          });
      }
    });
  }, [productId]);

  // Fallback while loading
  const displayProduct: ProductData = product || {
    id: productId || '',
    title: productId ? productId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '',
    category: 'Jewellery',
    price: 0,
    originalPrice: 0,
    images: [],
    reviews: [],
    description: '',
    dropdownOptions: undefined,
  };

  const savePercent = displayProduct.originalPrice > 0
    ? Math.round(((displayProduct.originalPrice - displayProduct.price) / displayProduct.originalPrice) * 100)
    : 0;
  const avgRating = displayProduct.reviews.length > 0 
    ? displayProduct.reviews.reduce((sum, r) => sum + r.rating, 0) / displayProduct.reviews.length 
    : (displayProduct.rating ?? 5.0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!e.currentTarget.src.includes('placehold.co')) {
      e.currentTarget.src = 'https://placehold.co/600x800/f5f5f5/cccccc?text=Product+Image';
    }
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }
    if (!reviewForm.title || !reviewForm.text) {
      alert("Please fill in all fields.");
      return;
    }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        reviewer_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
        rating: reviewForm.rating,
        title: reviewForm.title,
        review_text: reviewForm.text,
      });
      if (error) throw error;
      
      const { data: reviewsData } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (reviewsData) {
        const reviews = reviewsData.map(r => ({
          id: r.id,
          name: r.reviewer_name,
          rating: r.rating,
          title: r.title,
          text: r.review_text,
          date: new Date(r.created_at).toLocaleDateString(),
          verified: true
        }));
        setProduct(p => p ? { ...p, reviews } : p);
      }
      
      setReviewForm({ rating: 5, title: '', text: '' });
      setReviewFormOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const FAQS = [
    { q: "How should I store this piece so it lasts long?", a: "Store it in a cool, dry place, preferably in a pouch or soft-lined jewelry box." },
    { q: "How can I contact customer service?", a: "You can reach us via the Contact Us page or email stringsandstrands26@gmail.com" },
    { q: "How should I take care of this jewellery?", a: "Avoid direct contact with perfumes, lotions, and water. Wipe with a soft cloth after use." }
  ];


  return (
    <div className="bg-white min-h-screen font-sans text-gray-900">


      

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* ── Main Product Section ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-14 mb-16">

          {/* Left – Image Gallery */}
          <div className="w-full md:w-[52%] flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:w-[72px] snap-x pb-1 md:pb-0 scrollbar-hide">
              {displayProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative flex-shrink-0 w-[60px] h-[74px] md:w-[72px] md:h-[88px] rounded-lg overflow-hidden border transition-all snap-center ${
                    selectedImage === idx
                      ? 'border-[#FF2D74] ring-1 ring-[#FF2D74]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`${displayProduct.title} thumbnail ${idx + 1}`} onError={handleImageError} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-50 aspect-[4/5] relative border border-gray-100">
              <img
                src={displayProduct.images[selectedImage] || ''}
                alt={displayProduct.title}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
              {/* Save badge */}
              <div className="absolute top-4 left-4 bg-[#FF2D74] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                SAVE {savePercent}%
              </div>
            </div>
          </div>

          {/* Right – Product Info */}
          <div className="w-full md:w-[48%] flex flex-col">

            {/* Category tag */}
            <span className="text-xs font-semibold text-[#FF2D74] uppercase tracking-widest mb-2">
              {displayProduct.category}
            </span>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#B3184F] mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {displayProduct.title}
            </h1>

            {/* Stars */}
            <div
              className="flex items-center gap-2 mb-5 cursor-pointer group"
              onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="flex text-amber-400">
                {[1,2,3,4,5].map(i => (
                  i <= Math.floor(avgRating)
                    ? <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                    : i === Math.ceil(avgRating) && avgRating % 1 !== 0
                      ? <StarHalf key={i} size={16} fill="currentColor" strokeWidth={0} />
                      : <Star key={i} size={16} fill="none" className="text-gray-300" />
                ))}
              </div>
              <span className="text-sm text-gray-500 group-hover:text-gray-800 transition-colors">
                {avgRating.toFixed(1)} · {displayProduct.reviews.length} reviews
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-5" />

            {/* Price */}
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">₹{displayProduct.price}</span>
              <span className="text-lg text-gray-400 line-through mb-0.5">₹{displayProduct.originalPrice}</span>
              <span className="text-sm font-semibold text-[#FF2D74] mb-1 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                {savePercent}% OFF
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Tax included. <span className="underline cursor-pointer hover:text-gray-600">Shipping calculated</span> at checkout.
            </p>

            {/* Description */}
            {displayProduct.description && (
              <div className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
                {displayProduct.description}
              </div>
            )}

            {/* Color Variants */}
            {variants.length > 1 && (
              <div className="mb-6">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Color Options</span>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <Link key={v.id} to={`/product/${v.id}`}>
                      <button className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                        v.id === productId 
                          ? 'border-[#FF2D74] bg-[#FFEAF2] text-[#FF2D74]' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                        {v.color}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdown Options */}
            {displayProduct.dropdownOptions && displayProduct.dropdownOptions.length > 0 && (
              <div className="mb-6">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Select Option *</span>
                <select
                  value={selectedDropdownOption}
                  onChange={(e) => setSelectedDropdownOption(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:border-[#FF2D74] focus:ring-1 focus:ring-[#FF2D74] transition-all"
                >
                  <option value="" disabled>Choose an option...</option>
                  {displayProduct.dropdownOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-full w-[120px] bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={15} />
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6">
              {stockCount <= 0 ? (
                <button
                  disabled
                  className="flex-1 py-4 rounded-full font-bold text-base bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  Out of Stock
                </button>
              ) : (displayProduct.dropdownOptions && displayProduct.dropdownOptions.length > 0 && !selectedDropdownOption) ? (
                <button
                  disabled
                  className="flex-1 py-4 rounded-full font-bold text-base bg-pink-100 text-[#FF2D74] cursor-not-allowed border border-pink-200"
                >
                  Please select an option
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!displayProduct.id) return;
                    
                    const finalTitle = selectedDropdownOption 
                      ? `${displayProduct.title} (${selectedDropdownOption})`
                      : displayProduct.title;

                    for (let i = 0; i < quantity; i++) {
                      await addToCart({ 
                        id: String(displayProduct.id), 
                        name: finalTitle, 
                        price: displayProduct.price, 
                        image: displayProduct.images[0],
                        selectedOption: selectedDropdownOption || undefined
                      });
                    }
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                  className={`flex-1 py-4 rounded-full font-bold text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${
                    addedToCart
                      ? 'bg-gray-900 text-white'
                      : 'bg-[#FF2D74] text-white hover:bg-[#D41E5C]'
                  }`}
                >
                  {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
              )}
              <button
                onClick={() => productId && toggleWishlist(productId)}
                className="w-[52px] h-[52px] rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FF2D74] hover:bg-pink-50 transition-all"
                aria-label="Add to wishlist"
              >
                <Heart size={20} fill={wished ? MAGENTA : 'none'} color={wished ? MAGENTA : '#555'} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              {TRUST_BADGES.map((badge, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1.5">
                  <span className="text-[#FF2D74]">{badge.icon}</span>
                  <span className="text-[11px] font-semibold text-gray-800 leading-tight">{badge.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight hidden sm:block">{badge.sub}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
        
        {/* ── Customer Reviews ─────────────────────────────────────────────── */}
        <div id="reviews" className="mb-16 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#B3184F]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Customer Reviews
            </h2>
            <button 
              onClick={() => {
                if (!user) alert("Please log in to write a review!");
                else setReviewFormOpen(!reviewFormOpen);
              }}
              className="text-sm text-[#FF2D74] font-semibold hover:underline"
            >
              {reviewFormOpen ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {reviewFormOpen && user && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setReviewForm({ ...reviewForm, rating: i })} className="text-amber-400 focus:outline-none">
                      <Star size={24} fill={i <= reviewForm.rating ? "currentColor" : "none"} strokeWidth={i <= reviewForm.rating ? 0 : 2} className={i > reviewForm.rating ? "text-gray-300" : ""} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input type="text" placeholder="Summary of your experience" value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-[#FF2D74]" />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Review</label>
                <textarea rows={4} placeholder="What did you like or dislike?" value={reviewForm.text} onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-[#FF2D74] resize-none" />
              </div>
              
              <button disabled={submittingReview} onClick={submitReview} className="px-6 py-3 bg-[#FF2D74] text-white font-bold rounded-full hover:bg-[#D41E5C] transition-colors shadow-sm disabled:opacity-50">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {displayProduct.reviews.length === 0 && !reviewFormOpen && (
            <p className="text-gray-500 italic mb-8">No reviews yet. Be the first to review!</p>
          )}

          <div className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide">
            {displayProduct.reviews.map(review => (
              <div key={review.id} className="flex-shrink-0 w-80 md:w-96 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 snap-center">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill={i < review.rating ? "currentColor" : "none"} stroke={i < review.rating ? "currentColor" : "#d1d5db"} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-gray-900">{review.name}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold border border-green-100">
                      <CheckCircle size={9} /> Verified
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1.5">{review.title}</h4>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">{review.text}</p>

              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ Accordion ────────────────────────────────────────────────── */}
        <div className="mb-16 pt-8 border-t border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-[#B3184F] mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-white transition-all duration-300">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-gray-800 hover:text-[#FF2D74] transition-colors text-sm"
                >
                  {faq.q}
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 ml-3 text-gray-400 transform transition-transform duration-300 ${faqOpen === idx ? 'rotate-180 text-[#FF2D74]' : ''}`}
                  />
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${faqOpen === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
