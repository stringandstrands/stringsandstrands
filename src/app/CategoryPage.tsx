import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { ChevronDown, ChevronRight, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { ProductCard, Product, MAGENTA, CHARCOAL, OFFWHITE } from "./Shared";
import { supabase } from '../lib/supabase';

interface CategoryPageProps {
  wishlist: Set<number>;
  toggleWishlist: (id: number) => void;
  type: "category" | "bestsellers" | "new-arrivals" | "occasion";
}


const FILTER_GROUPS = [
  {
    id: "metal",
    label: "Metal",
    options: ["Gold Plated", "Rose Gold", "Silver", "Oxidised"]
  },
  {
    id: "color",
    label: "Color / Stone",
    options: ["White", "Pink", "Green", "Blue", "Pearl"]
  },
  {
    id: "occasion",
    label: "Occasion",
    options: ["Everyday", "Office", "Celebrations", "Gift for Her"]
  },
  {
    id: "type",
    label: "Type",
    options: ["Studs", "Hoops", "Danglers", "Jhumkas", "Chokers", "Long"]
  }
];

export default function CategoryPage({ wishlist, toggleWishlist, type }: CategoryPageProps) {
  const { categoryId, occasionId } = useParams();
  
  const paramId = type === "category" ? categoryId : type === "occasion" ? occasionId : type;
  const titleStr = paramId ? paramId.replace("-", " ") : "";
  const title = titleStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const defaultSort = type === "new-arrivals" ? "Newest First" : "Best Selling";
  const [currentSort, setCurrentSort] = useState(defaultSort);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const SORT_OPTIONS = ["Best Selling", "Price Low-High", "Price High-Low", "Newest First"];

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from('products').select('*');
      if (type === 'category' && paramId) {
        query = query.ilike('category', paramId);
      } else if (type === 'bestsellers') {
        query = query.eq('is_bestseller', true);
      } else if (type === 'new-arrivals') {
        query = query.eq('is_new', true);
      } else if (type === 'occasion' && paramId) {
        query = query.ilike('occasion', `%${paramId}%`);
      }
      const { data } = await query;
      if (cancelled) return;
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.discounted_price,
        originalPrice: p.price,
        img: p.images?.[0] || '',
        badge: p.is_new ? 'New' : (p.is_bestseller ? 'Best' : undefined),
        stock: p.stock,
        metal: p.metal || '',
        color: p.color || '',
        occasion: p.occasion || '',
        type: p.type || '',
        created_at: p.created_at,
        dropdownOptions: p.dropdown_options,
      }));
      mapped.sort((a, b) => {
        const aInStock = a.stock > 0 ? 1 : 0;
        const bInStock = b.stock > 0 ? 1 : 0;
        return bInStock - aInStock;
      });

      setProducts(mapped);
      setLoading(false);
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, [type, paramId]);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set(
    type === "occasion" ? ["occasion"] : ["price", "metal"]
  ));

  const toggleFilterGroup = (id: string) => {
    setExpandedFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isEarrings = paramId?.toLowerCase() === 'earrings';
  const filteredGroups = FILTER_GROUPS.filter(g => {
    if (g.id === 'type' && !isEarrings) return false;
    return true;
  });

  const activeFilters = type === "occasion" 
    ? [filteredGroups.find(g => g.id === "occasion")!, ...filteredGroups.filter(g => g.id !== "occasion")]
    : filteredGroups;

  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});
  
  const toggleFilterOption = (groupId: string, option: string) => {
    setSelectedFilters(prev => {
      const next = { ...prev };
      if (!next[groupId]) next[groupId] = new Set();
      const nextSet = new Set(next[groupId]);
      if (nextSet.has(option)) nextSet.delete(option);
      else nextSet.add(option);
      next[groupId] = nextSet;
      return next;
    });
  };

  const displayProducts = React.useMemo(() => {
    let filtered = products.filter(p => {
      for (const group of activeFilters) {
        const selected = selectedFilters[group.id];
        if (!selected || selected.size === 0) continue;
        
        const pValue = (p as any)[group.id]?.toLowerCase() || '';
        let matched = false;
        
        for (const opt of selected) {
          if (group.id === 'occasion') {
            const occId = opt === 'Gift for Her' ? 'gift-for-her' : opt.toLowerCase();
            if (pValue.includes(occId)) { matched = true; break; }
          } else {
            if (pValue.includes(opt.toLowerCase())) { matched = true; break; }
          }
        }
        if (!matched) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;

      if (currentSort === "Price Low-High") return a.price - b.price;
      if (currentSort === "Price High-Low") return b.price - a.price;
      if (currentSort === "Newest First") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0; // Best Selling fallback
    });
  }, [products, selectedFilters, activeFilters, currentSort]);

  const FiltersContent = () => (
    <div className="space-y-4">
      {activeFilters.map(group => (
        <div key={group.id} className="bg-white border border-[#FFD1E3] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(179,24,79,0.05)]">
          <button
            onClick={() => toggleFilterGroup(group.id)}
            className="w-full flex items-center justify-between p-4 text-[#B3184F] hover:bg-[#FFD1E3]/20 transition-colors"
          >
            <span className="text-sm font-bold tracking-wide">{group.label}</span>
            <ChevronDown
              size={16}
              className={`text-[#FFD1E3] transition-transform duration-200 ${expandedFilters.has(group.id) ? "rotate-180" : ""}`}
            />
          </button>
          {expandedFilters.has(group.id) && (
            <div className="p-4 pt-0 border-t border-[#FFD1E3]/30">
              <div className="flex flex-col gap-3 mt-3">
                {group.options.map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group/label">
                    <div className="relative flex items-center justify-center w-4 h-4 rounded border border-[#FFD1E3] bg-white group-hover/label:border-[#FF2D74] transition-colors">
                      <input 
                        type="checkbox" 
                        className="absolute opacity-0 w-0 h-0 peer" 
                        checked={selectedFilters[group.id]?.has(opt) || false}
                        onChange={() => toggleFilterOption(group.id, opt)}
                      />
                      <div className="w-2.5 h-2.5 rounded-sm bg-[#FF2D74] opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-[#B3184F] group-hover/label:text-[#FF2D74] transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        
        {/* Header Row: Title & Controls */}
        <div className="flex items-center justify-between pt-2 pb-6 mb-6 md:mb-8 relative">
          
          {/* Title (Left aligned) */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#B3184F]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h1>

          {/* Controls (Filters & Sort - Right aligned) */}
          <div className="flex items-center gap-5 md:gap-8">

            {/* Filters Button */}
            <div className="relative">
              <button 
                className="flex items-center gap-1.5 md:gap-2 text-sm font-semibold tracking-wide cursor-pointer transition-colors hover:opacity-80 active:opacity-60"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              >
                <SlidersHorizontal size={16} className="text-[#FF2D74]" />
                <span className="text-gray-900 md:text-[#B3184F]">Filter</span>
              </button>
              
              {/* Mobile Filters Dropdown */}
              {isMobileFiltersOpen && (
                <>
                  <div 
                    className="md:hidden fixed inset-0 z-10" 
                    onClick={() => setIsMobileFiltersOpen(false)}
                  />
                  <div className="md:hidden absolute top-full right-0 mt-4 w-[85vw] max-w-sm bg-white rounded-xl border border-[#FFD1E3] shadow-xl overflow-hidden z-20 flex flex-col max-h-[70vh]">
                    <div className="flex-1 overflow-y-auto p-4">
                      <FiltersContent />
                    </div>
                    <div className="p-4 border-t border-[#FFD1E3] bg-white">
                      <button 
                        className="w-full py-3 bg-[#FF2D74] text-[#FFEAF2] text-xs font-bold uppercase tracking-widest rounded shadow-[0_4px_14px_rgba(255,45,116,0.3)] active:scale-95 transition-transform"
                        onClick={() => setIsMobileFiltersOpen(false)}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort Button */}
            <div className="relative group/sort">
              <div 
                className="flex items-center gap-1.5 md:gap-2 text-sm font-semibold tracking-wide cursor-pointer transition-colors hover:opacity-80 active:opacity-60"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <ArrowUpDown size={16} className="text-[#FF2D74]" />
                <span className="text-gray-900 md:text-[#B3184F]">Sort</span>
              </div>
              
              {isSortOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSortOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-4 w-48 bg-white rounded-xl border border-[#FFD1E3] shadow-lg overflow-hidden z-20">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setCurrentSort(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold tracking-wide transition-colors hover:bg-[#FFD1E3]/30 ${currentSort === option ? "text-[#FF2D74] bg-[#FFD1E3]/10" : "text-[#B3184F]"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          {/* Desktop Filters Side Panel */}
          <div className="hidden md:block w-56 lg:w-64 flex-shrink-0">
            <FiltersContent />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {displayProducts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl font-bold text-[#B3184F] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  New pieces coming soon
                </h3>
                <Link to="/">
                  <button className="px-8 py-3.5 bg-[#FF2D74] text-[#FFEAF2] text-[11px] font-bold tracking-widest uppercase rounded shadow-[0_4px_14px_rgba(255,45,116,0.3)] hover:bg-[#D41E5C] hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Browse All Categories
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                  {displayProducts.map(p => (
                    <div key={p.id} className="w-full">
                      <ProductCard product={p} wishlist={wishlist} onWishlistToggle={toggleWishlist} />
                    </div>
                  ))}
                </div>

              </>
            )}
          </div>
        </div>

      </div>


    </div>
  );
}
