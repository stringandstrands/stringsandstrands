import React, { useRef, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { MAGENTA, CHARCOAL, OFFWHITE, ProductCard, useHomeProducts, Product } from './Shared';

// ── Hero Carousel ─────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    desktop: "/campaign/shipping_promo_banner_new.png",
    mobile: "/campaign/shipping_promo_banner_new.png",
    headline: "",
    sub: "",
    theme: "warm",
    hideOverlay: true,
    type: "shipping_promo",
  },
  {
    desktop: "/campaign/hero_desktop_medallion.png",
    mobile: "/campaign/hero_desktop_medallion.png",
    headline: "",
    sub: "",
    theme: "warm",
    hideOverlay: true,
    type: "new_user_promo",
  },
  {
    desktop: "/assets/products/Ring/ring-2.png",
    mobile: "/assets/products/Ring/ring-2.png",
    headline: "",
    sub: "",
    theme: "warm",
    hideOverlay: true,
    type: "promo",
  }
];

function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", () => setIsDragging(true));
    emblaApi.on("pointerUp", () => setIsDragging(false));
    
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", () => setIsDragging(true));
      emblaApi.off("pointerUp", () => setIsDragging(false));
    };
  }, [emblaApi]);

  const handleAnimationEnd = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  return (
    <div 
      className="relative w-full overflow-hidden bg-[#fdf6f0] min-h-[420px] h-[55vh] md:h-[80vh] max-h-[850px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full">

              {/* ── Shipping Promo Slide: Figma-style banner for free shipping ── */}
              {(s as any).type === 'shipping_promo' ? (
                <>
                  {/* Solid beige background */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, #e8dfd5 40%, #e0d4c6 100%)" }}
                  />
                  {/* Actual product image — fades in from right */}
                  <img
                    src={s.desktop}
                    alt="Free Shipping Promo"
                    className="absolute right-0 top-0 h-full w-[72%] md:w-[70%] object-cover object-center select-none pointer-events-none"
                    style={{
                      maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,1) 30%)",
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,1) 30%)",
                    }}
                  />
                  {/* Left beige overlay blends left edge seamlessly */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #e8dfd5 30%, rgba(232,223,213,0.6) 45%, transparent 60%)" }}
                  />
                  {/* Text content */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-center px-8 md:px-14 lg:px-20 transition-all duration-700 ${
                      i === selectedIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                    style={{ maxWidth: "55%" }}
                  >
                    <p
                      className="text-[9px] md:text-[10px] font-bold uppercase mb-2 md:mb-3 tracking-[0.2em]"
                      style={{ color: "#b08849", fontFamily: "'Inter', sans-serif", transitionDelay: i === selectedIndex ? "200ms" : "0ms" }}
                    >
                      SHIPPED WITH LOVE
                    </p>
                    <h2
                      className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-1"
                      style={{ color: "#2a1e12", fontFamily: "'Playfair Display', serif" }}
                    >
                      Free Shipping
                    </h2>
                    <p
                      className="text-2xl md:text-3xl lg:text-4xl italic mb-4 md:mb-6"
                      style={{ color: "#c69b55", fontFamily: "'Playfair Display', serif" }}
                    >
                      On All Orders Above ₹599
                    </p>
                    <p
                      className="text-[10px] md:text-xs mb-6 md:mb-10 leading-relaxed font-medium"
                      style={{ color: "#7a6a5a", fontFamily: "'Inter', sans-serif" }}
                    >
                      No code needed — applied automatically at checkout.
                    </p>
                    <div>
                      <Link
                        to="/new-arrivals"
                        className="group/btn inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-3.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300"
                        style={{
                          background: "#b88a44",
                          color: "#fff",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#9c7333";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#b88a44";
                        }}
                      >
                        Shop Now
                      </Link>
                    </div>
                    {/* Decorative gold line */}
                    <div className="mt-8 md:mt-10" style={{ width: "40px", height: "1px", background: "#b88a44" }} />
                  </div>
                </>
              ) : (s as any).type === 'new_user_promo' ? (
                <>
                  {/* Solid very light beige background */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, #faf7f2 40%, #f0e6d5 100%)" }}
                  />
                  {/* Actual product image — fades in from right */}
                  <img
                    src={s.desktop}
                    alt="New User Promo"
                    className="absolute right-0 top-0 h-full w-full object-cover object-center select-none pointer-events-none"
                    style={{
                      maskImage: "linear-gradient(to right, transparent 0%, transparent 51%, rgba(0,0,0,0.4) 62%, rgba(0,0,0,1) 75%)",
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 51%, rgba(0,0,0,0.4) 62%, rgba(0,0,0,1) 75%)",
                    }}
                  />
                  {/* Left beige overlay blends left edge seamlessly */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #faf7f2 50%, rgba(250,247,242,0.6) 65%, transparent 80%)" }}
                  />
                  {/* Text content */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-center px-8 md:px-14 lg:px-20 transition-all duration-700 ${
                      i === selectedIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                    style={{ maxWidth: "55%" }}
                  >
                    <p
                      className="text-[9px] md:text-[10px] font-bold uppercase mb-2 md:mb-3 tracking-[0.2em]"
                      style={{ color: "#a88046", fontFamily: "'Inter', sans-serif", transitionDelay: i === selectedIndex ? "200ms" : "0ms" }}
                    >
                      WELCOME TO STRINGS & STRANDS
                    </p>
                    <h2
                      className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-1"
                      style={{ color: "#3a2d20", fontFamily: "'Playfair Display', serif" }}
                    >
                      New Here?
                    </h2>
                    <p
                      className="text-2xl md:text-3xl lg:text-4xl italic mb-4 md:mb-6"
                      style={{ color: "#b58c4f", fontFamily: "'Playfair Display', serif" }}
                    >
                      Get 5% Off At Checkout
                    </p>
                    <p
                      className="text-[10px] md:text-xs mb-6 md:mb-10 leading-relaxed font-medium"
                      style={{ color: "#7a6a5a", fontFamily: "'Inter', sans-serif" }}
                    >
                      Use code <strong style={{ color: "#3a2d20" }}>NEW5</strong> at checkout for an exclusive discount.
                    </p>
                    <div>
                      <Link
                        to="/new-arrivals"
                        className="group/btn inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-3.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300"
                        style={{
                          background: "#a88046",
                          color: "#fff",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#8c6b39";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#a88046";
                        }}
                      >
                        Shop Now
                      </Link>
                    </div>
                    {/* Decorative gold line */}
                    <div className="mt-8 md:mt-10" style={{ width: "40px", height: "1px", background: "#a88046" }} />
                  </div>
                </>
              ) : (s as any).type === 'promo' ? (
                <>
                  {/* Solid warm cream background */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, #f5ede2 40%, #ede0d0 100%)" }}
                  />
                  {/* Actual product image — fades in from right */}
                  <img
                    src={s.desktop}
                    alt="Pearl Ring — free gift promo"
                    className="absolute right-0 top-0 h-full w-[72%] object-cover object-center select-none pointer-events-none"
                    style={{
                      maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 10%, rgba(0,0,0,1) 28%)",
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 10%, rgba(0,0,0,1) 28%)",
                    }}
                  />
                  {/* Cream overlay blends left edge seamlessly */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #f5ede2 24%, rgba(245,237,226,0.5) 40%, transparent 58%)" }}
                  />
                  {/* Text content */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-center px-8 md:px-14 lg:px-20 transition-all duration-700 ${
                      i === selectedIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                    style={{ maxWidth: "52%" }}
                  >
                    <p
                      className="text-[10px] md:text-[11px] font-semibold uppercase mb-3 md:mb-4 tracking-[0.22em]"
                      style={{ color: "#9a7a45", fontFamily: "'Inter', sans-serif", transitionDelay: i === selectedIndex ? "200ms" : "0ms" }}
                    >
                      A Little Something Extra
                    </p>
                    <h2
                      className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-1"
                      style={{ color: "#2c1f10", fontFamily: "'Playfair Display', serif" }}
                    >
                      Order Above ₹499
                    </h2>
                    <p
                      className="text-xl md:text-2xl lg:text-3xl italic font-semibold mb-4 md:mb-5"
                      style={{ color: "#9a7a45", fontFamily: "'Playfair Display', serif" }}
                    >
                      & Get a Free Gift
                    </p>
                    <p
                      className="text-[12px] md:text-sm mb-6 md:mb-8 leading-relaxed"
                      style={{ color: "#5c4a35", fontFamily: "'Inter', sans-serif" }}
                    >
                      Automatically added to your order at checkout.
                    </p>
                    <div>
                      <Link
                        to="/new-arrivals"
                        className="group/btn inline-flex items-center gap-2 px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300"
                        style={{
                          background: "#8b6914",
                          color: "#fff",
                          boxShadow: "0 4px 18px rgba(139,105,20,0.28)",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#6e5210";
                          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(139,105,20,0.4)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "#8b6914";
                          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 18px rgba(139,105,20,0.28)";
                        }}
                      >
                        Shop Now
                      </Link>
                    </div>
                    {/* Decorative gold line */}
                    <div className="mt-8 md:mt-10" style={{ width: "36px", height: "2px", background: "#9a7a45", borderRadius: "2px" }} />
                  </div>
                </>
              ) : (
                /* ── Normal Slides ── */
                <>
                  {/* Full-bleed image — desktop only */}
                  <img
                    src={s.desktop}
                    alt={s.headline ? s.headline.replace("\n", " ") : "Strings & Strands Campaign"}
                    className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
                  />

                  {/* Invisible click overlay */}
                  {(s as any).clickTo && (
                    <button
                      aria-label="Shop Now — view bestsellers"
                      className="absolute inset-0 w-full h-full z-10 cursor-pointer bg-transparent"
                      onClick={() => {
                        document.getElementById((s as any).clickTo)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  )}

                  {/* DESKTOP: full-bleed image + left text overlay */}
                  {!s.hideOverlay && (
                    <div className="hidden md:flex absolute inset-0 items-center pointer-events-none">
                      <div className="max-w-7xl mx-auto px-8 lg:px-16 w-full">
                        <div className={`max-w-md pointer-events-auto transition-all duration-1000 transform ${i === selectedIndex ? "translate-y-0 opacity-100 delay-300" : "translate-y-4 opacity-0"}`}>
                          <h1
                            className={`text-4xl lg:text-[4rem] font-bold leading-[1.1] mb-4 tracking-tight ${s.theme === 'dark' ? 'text-white' : 'text-[#B3184F]'}`}
                            style={{ fontFamily: "'Playfair Display', serif", whiteSpace: "pre-line", textShadow: s.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 10px rgba(255,255,255,0.5)' }}
                          >
                            {s.headline}
                          </h1>
                          <p
                            className={`text-sm font-medium mb-7 max-w-xs ${s.theme === 'dark' ? 'text-white/90' : 'text-[#B3184F]/90'}`}
                            style={{ fontFamily: "'Inter', sans-serif", textShadow: s.theme === 'dark' ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 10px rgba(255,255,255,0.5)' }}
                          >
                            {s.sub}
                          </p>
                          <button
                            className={`px-8 py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 rounded-full border-2 ${s.theme === 'dark' ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-[#B3184F] text-[#B3184F] hover:bg-[#B3184F] hover:text-[#FFEAF2]'}`}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Discover Collection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOBILE: split layout — cream text panel left, photo right */}
                  {!s.hideOverlay && (
                    <div
                      className={`md:hidden absolute inset-0 transition-opacity duration-700 ${i === selectedIndex ? "opacity-100" : "opacity-0"}`}
                    >
                      {/* Right photo panel — absolutely fills right 48% top-to-bottom */}
                      <div
                        className="absolute top-0 right-0 bottom-0 overflow-hidden"
                        style={{ left: "52%" }}
                      >
                        <img
                          src={s.mobile}
                          alt={s.headline ? s.headline.replace("\n", " ") : "Strings & Strands"}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      </div>

                      {/* Left cream text panel — absolutely fills left 52% top-to-bottom */}
                      <div
                        className="absolute top-0 left-0 bottom-0 flex flex-col justify-center px-4 py-6"
                        style={{
                          right: "48%",
                          background: "linear-gradient(to right, #fdf6f0 75%, rgba(253,246,240,0.92) 100%)",
                        }}
                      >
                        <h1
                          className="font-bold leading-tight mb-2"
                          style={{ fontFamily: "'Playfair Display', serif", whiteSpace: "pre-line", color: "#2c1f10", fontSize: "clamp(1.2rem, 5.5vw, 1.7rem)" }}
                        >
                          {s.headline}
                        </h1>
                        <p
                          className="mb-4 leading-relaxed"
                          style={{ fontFamily: "'Inter', sans-serif", color: "#5c4a35", fontSize: "clamp(0.6rem, 2.2vw, 0.75rem)" }}
                        >
                          {s.sub}
                        </p>
                        <div>
                          <button
                            className="font-bold uppercase rounded-full border-2 border-[#B3184F] text-[#B3184F] transition-all duration-300 active:bg-[#B3184F] active:text-white"
                            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.5rem, 1.8vw, 0.62rem)", letterSpacing: "0.15em", padding: "0.4rem 0.9rem" }}
                          >
                            Discover
                          </button>
                        </div>
                        <div className="mt-5" style={{ width: "28px", height: "2px", background: "#9a7a45", borderRadius: "2px" }} />
                      </div>
                    </div>
                  )}

                  {/* Mobile full image for hideOverlay slides (e.g. welcome slide) */}
                  {s.hideOverlay && (
                    <img
                      src={s.mobile}
                      alt="Strings & Strands Campaign"
                      className="md:hidden absolute inset-0 w-full h-full object-cover object-center"
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/40 hover:bg-white/70 flex items-center justify-center transition-all backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <ChevronLeft size={24} color="#B3184F" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/40 hover:bg-white/70 flex items-center justify-center transition-all backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <ChevronRight size={24} color="#B3184F" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === selectedIndex ? "w-12 bg-white/60" : "w-2 bg-white/60 hover:bg-white/90"}`}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === selectedIndex && (
              <div 
                className="absolute left-0 top-0 h-full bg-[#B3184F]"
                style={{ 
                  animation: "fillProgress 5s linear forwards",
                  animationPlayState: (isHovered || isDragging) ? "paused" : "running"
                }}
                onAnimationEnd={handleAnimationEnd}
              />
            )}
          </button>
        ))}
      </div>
      <style>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

// ── Category Circles ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Earrings", img: "/categories/cat_earrings.png" },
  { label: "Necklace", img: "/categories/cat_necklace.png" },
  { label: "Ring", img: "/categories/cat_ring.png" },
  { label: "Bracelets", img: "/categories/cat_bracelets.png" },
  { label: "Bangles", img: "/categories/cat_bangles.png" },
  { label: "Sets", img: "/categories/cat_sets.png" },
  { label: "Hair Accessories", img: "/categories/cat_pendants.png" },
];

function CategoryCircle({ label, img }: { label: string; img: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/category/${label.toLowerCase()}`}
      className="flex flex-col items-center gap-2.5 group flex-shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#FFD1E3] [transform:translateZ(0)] ring-2 ring-transparent group-hover:ring-[#FF2D74] transition-all duration-300 shadow-[0_4px_14px_rgba(179,24,79,0.15)] group-hover:shadow-[0_8px_24px_rgba(179,24,79,0.25)]">
        <img
          src={img}
          alt={label}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
        />
      </div>
      <span
        className={`text-[11px] font-semibold tracking-wide text-center leading-snug max-w-[84px] transition-colors duration-200 ${hovered ? "text-[#FF2D74]" : "text-[#B3184F]"}`}
      >
        {label}
      </span>
    </Link>
  );
}

function ShopByCategory() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2
          className="text-left text-2xl lg:text-3xl font-bold text-[#B3184F] mb-8"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Shop by Category
        </h2>
        <div className="hidden md:grid grid-cols-7 gap-4 justify-items-center">
          {CATEGORIES.map(cat => (
            <CategoryCircle key={cat.label} {...cat} />
          ))}
        </div>
        <div className="md:hidden grid grid-cols-2 gap-2 px-1">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              to={`/category/${cat.label.toLowerCase()}`}
              className={`relative rounded-xl overflow-hidden aspect-[4/3] ${i === 6 ? 'col-span-2 aspect-[16/9]' : ''}`}
            >
              <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1">
                <span className="text-white font-semibold text-sm tracking-wide">{cat.label}</span>
                <ChevronRight size={14} color="white" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCarousel({
  title,
  subtitle,
  products,
  bg = "bg-white",
  wishlist,
  onWishlistToggle,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  bg?: string;
  wishlist: Set<number>;
  onWishlistToggle: (id: number) => void;
}) {
  return (
    <section className={`py-12 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div className="text-left">
            <h2
              className="text-2xl lg:text-3xl font-bold text-[#B3184F]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#B3184F] mt-2 tracking-wide">{subtitle}</p>
            )}
          </div>
          <Link
            to={title === "New Arrivals" ? "/new-arrivals" : "/bestsellers"}
            className="text-[11px] font-bold uppercase tracking-widest text-[#FF2D74] hover:text-[#D41E5C] transition-colors p-2 -mr-2"
          >
            View All
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {products.map(p => (
            <div key={p.id} className="snap-start w-44 lg:w-52 flex-shrink-0">
              <ProductCard product={p} wishlist={wishlist} onWishlistToggle={onWishlistToggle} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ── Shop by Occasion ──────────────────────────────────────────────────────────
const OCCASION_TILES = [
  {
    id: "everyday",
    label: "Everyday",
    img: "/campaign/occ_everyday.png",
  },
  {
    id: "office",
    label: "Office",
    img: "/campaign/occ_work.png",
  },
  {
    id: "celebrations",
    label: "Celebrations",
    img: "/campaign/occ_celebrations.png",
  },
  {
    id: "gift-for-her",
    label: "Gift for Her",
    img: "/campaign/occ_gifting.png",
  },
];

function ShopByOccasion() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (scrollRef.current) {
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeft.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-8">
        <h2
          className="text-left text-2xl lg:text-3xl font-bold text-[#B3184F]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Shop by Occasion
        </h2>
      </div>
      <div 
        ref={scrollRef}
        className="max-w-7xl mx-auto px-4 lg:px-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none pb-8"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-5 md:gap-6 w-max">
          {OCCASION_TILES.map((tile) => (
            <div 
              key={tile.id} 
              className="w-[82vw] md:w-[42vw] lg:w-[calc((100vw-4rem)/3.15)] xl:w-[386px] flex-shrink-0 snap-start"
            >
              <Link 
                to={`/occasion/${tile.id}`}
                className="group block relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-[#FFD1E3] shadow-sm hover:shadow-xl transition-all duration-300"
                draggable={false}
              >
                <img
                  src={tile.img}
                  alt={tile.label}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between">
                  <h3
                    className="text-white text-xl md:text-2xl font-bold tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {tile.label}
                  </h3>
                  <ArrowRight className="text-white transform transition-transform duration-300 group-hover:translate-x-1.5" size={22} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya M.",
    city: "Mumbai",
    quote: "Absolutely love my pearl necklace! The quality is exceptional and it arrived within 3 days. Will definitely order again.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format",
  },
  {
    name: "Aarti S.",
    city: "Delhi",
    quote: "The oxidised silver bangles are stunning! Got so many compliments at the party. Great packaging too.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&auto=format",
  },
  {
    name: "Neha K.",
    city: "Bangalore",
    quote: "Best jewellery brand I've come across. The rose gold ring fits perfectly and hasn't tarnished at all!",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&auto=format",
  },
  {
    name: "Kavya R.",
    city: "Chennai",
    quote: "Ordered the party set for my sister's birthday. The quality exceeded all expectations. Strings & Strands is now my go-to!",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&auto=format",
  },
];

function Testimonials() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2
          className="text-left text-2xl lg:text-3xl font-bold text-[#B3184F] mb-8"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          What Our Customers Say
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:snap-none">
          {TESTIMONIALS.map(t => (
            <div
              key={t.name}
              className="flex-shrink-0 snap-start w-72 lg:w-auto bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(179,24,79,0.1)] border border-[#FFD1E3]"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill={MAGENTA} color={MAGENTA} />
                ))}
              </div>
              <p className="text-sm text-[#B3184F] italic leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover bg-[#FFD1E3]"
                />
                <div>
                  <p className="text-sm font-bold text-[#B3184F]">{t.name}</p>
                  <p className="text-xs text-[#B3184F]">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ wishlist, toggleWishlist }: { wishlist: Set<number>, toggleWishlist: (id: number) => void }) {
  const navigate = useNavigate();
  const { newArrivals, bestsellers } = useHomeProducts();
  return (
    <main>
      <HeroCarousel />
      <ShopByCategory />
      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        wishlist={wishlist}
        onWishlistToggle={toggleWishlist}
      />
      <div id="bestsellers">
        <ProductCarousel
          title="Bestsellers"
          subtitle="Loved by our customers"
          products={bestsellers}
          bg="bg-white"
          wishlist={wishlist}
          onWishlistToggle={toggleWishlist}
        />
      </div>
      <ShopByOccasion />
      <Testimonials />
    </main>
  );
}
