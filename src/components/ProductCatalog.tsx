import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Package,
  X,
  Filter,
  FileSpreadsheet,
  ZoomIn,
} from 'lucide-react';
import { ProductItem } from '../types.ts';
import { filterAndSortProducts, FilterOptions } from '../utils/productLogic.ts';

interface ProductCatalogProps {
  products: ProductItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedForCompare: ProductItem[];
  onToggleCompare: (product: ProductItem) => void;
  onOpenCompareModal: () => void;
  onClearCompare: () => void;
  onViewProductDetail: (product: ProductItem) => void;
  onRequestQuote: (product: ProductItem) => void;
  onViewFormalOffer?: (product: ProductItem) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedForCompare,
  onToggleCompare,
  onOpenCompareModal,
  onClearCompare,
  onViewProductDetail,
  onRequestQuote,
  onViewFormalOffer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('sku');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | undefined>(undefined);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filtered = filterAndSortProducts(products, {
    categorySlug: selectedCategory,
    searchTerm,
    inStockOnly,
    sortBy,
    maxPrice: maxPriceFilter,
  });

  return (
    <section>
      {/* Variation 1 Section Label */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="label-bracket mb-1">[03] Joint Venture Marine Fleet</span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#111113]">
            Workboats, Patrol Vessels & Lifesaving Systems
          </h2>
          <p className="text-xs text-[#111113]/60 mt-1">
            Displaying <span className="font-bold text-[#111113]">{filtered.length}</span> naval
            craft and marine platforms co-manufactured with Euro Offshore Group.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 text-[#111113]/40" size={14} />
            <input
              type="text"
              placeholder="Search SKU, specs, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-black/10 text-xs text-[#111113] placeholder-[#111113]/40 focus:outline-none focus:border-[#B8860B] transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-black/10 text-xs text-[#111113] focus:outline-none focus:border-[#B8860B] cursor-pointer"
          >
            <option value="sku">Sort: SKU</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Stock Level</option>
            <option value="name">Product Name</option>
          </select>

          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden px-3 py-2 bg-white border border-black/10 text-[#111113] text-xs font-semibold flex items-center gap-1.5"
          >
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div
        className={`bg-white border border-black/8 p-4 mb-8 shadow-xs ${
          showFiltersMobile ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="label-bracket mr-2">Category:</span>
            {[
              { slug: 'all', label: 'All Systems' },
              { slug: 'hydraulics', label: 'Hydraulics' },
              { slug: 'filtration', label: 'Filtration' },
              { slug: 'cnc-machining', label: 'CNC Machining' },
              { slug: 'offshore-marine', label: 'Offshore & Marine' },
            ].map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3 py-1 text-xs transition cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-[#111113] text-white font-medium'
                    : 'bg-[#F8F7F4] hover:bg-black/10 text-[#111113]/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Secondary Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#111113]/80 font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#B8860B] h-3.5 w-3.5"
              />
              <span>In-Stock Only</span>
            </label>

            <div className="flex items-center gap-1.5 text-[#111113]/70">
              <span className="mono text-[10px]">Max Price:</span>
              <select
                value={maxPriceFilter || ''}
                onChange={(e) =>
                  setMaxPriceFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                className="px-2 py-1 bg-[#F8F7F4] border border-black/10 text-xs cursor-pointer focus:outline-none"
              >
                <option value="">Any</option>
                <option value="1000">&lt; $1,000</option>
                <option value="2500">&lt; $2,500</option>
                <option value="5000">&lt; $5,000</option>
                <option value="20000">&lt; $20,000</option>
              </select>
            </div>

            {(searchTerm || inStockOnly || maxPriceFilter || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setInStockOnly(false);
                  setMaxPriceFilter(undefined);
                  onSelectCategory('all');
                }}
                className="mono text-[10px] text-[#B8860B] hover:underline font-bold"
              >
                RESET FILTERS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid (Variation 1 Card Styling) */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-black/8 p-12 text-center max-w-md mx-auto my-8">
          <Package size={36} className="text-[#111113]/30 mx-auto mb-3" />
          <h3 className="font-editorial text-2xl text-[#111113] mb-1">No matching records</h3>
          <p className="text-xs text-[#111113]/60 mb-4">
            Try broadening your search parameters or ask the Gemini AI Copilot.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setInStockOnly(false);
              setMaxPriceFilter(undefined);
              onSelectCategory('all');
            }}
            className="px-4 py-2 bg-[#111113] text-white text-xs mono uppercase tracking-wider"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {filtered.map((product) => {
            const isCompared = selectedForCompare.some((p) => p.id === product.id);
            const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-black/8 p-6 relative flex flex-col justify-between hover:border-[#B8860B] transition-colors shadow-xs group"
              >
                <div>
                  {/* Top Bar: SKU & Stock Tag */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="mono text-xs font-bold text-[#B8860B] tracking-widest">
                      {product.sku}
                    </span>
                    <span className="mono text-[10px] text-[#111113]/60">
                      {isOutOfStock ? (
                        <span className="text-rose-700 font-semibold">BUILT TO ORDER</span>
                      ) : isLowStock ? (
                        <span className="text-amber-700 font-semibold">
                          LOW STOCK ({product.stock_quantity})
                        </span>
                      ) : (
                        <span>STOCK: {product.stock_quantity}</span>
                      )}
                    </span>
                  </div>

                  {/* Vessel Image & Title */}
                  <div
                    onClick={() => onViewProductDetail(product)}
                    className="h-48 w-full bg-slate-900 border border-black/10 overflow-hidden relative mb-3 cursor-pointer group-hover:border-[#B8860B] transition"
                  >
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-115"
                    />

                    {/* Hover Zoom HUD indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/85 backdrop-blur-xs text-[#B8860B] px-2 py-1 mono text-[9px] uppercase tracking-wider flex items-center gap-1 border border-[#B8860B]/40 shadow-md">
                      <ZoomIn size={11} />
                      <span>Inspect CAD Zoom</span>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-[#111113]/90 text-[#B8860B] px-2 py-0.5 mono text-[9px] uppercase tracking-wider">
                      {product.category_name}
                    </div>
                  </div>

                  {/* Product Title */}
                  <h3
                    onClick={() => onViewProductDetail(product)}
                    className="font-editorial text-2xl sm:text-2xl font-semibold text-[#111113] my-1 leading-tight hover:text-[#B8860B] transition cursor-pointer"
                  >
                    {product.title}
                  </h3>

                  <p className="text-xs text-[#111113]/70 leading-relaxed line-clamp-2 mb-3">
                    {product.short_desc}
                  </p>

                  {/* Technical Specifications Snapshot */}
                  <div className="border-t border-b border-black/5 py-2.5 my-2 space-y-1 bg-[#F8F7F4]/40 px-2">
                    {product.specifications.slice(0, 3).map((spec, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-[#111113]/50 mono text-[10px]">{spec.key}:</span>
                        <span className="mono text-[11px] font-semibold text-[#111113]">
                          {spec.value} {spec.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Price & Actions */}
                <div className="pt-2">
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <span className="label-bracket">Ex-Works Unit Price</span>
                      <div className="font-editorial text-2xl font-semibold text-[#111113]">
                        ${product.price_usd.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="label-bracket">Delivery Timeline</span>
                      <div className="mono text-xs text-[#111113] font-medium">
                        {Math.round(product.lead_time_days / 7) || 8} - 16 wks
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onToggleCompare(product)}
                      aria-label={`Compare ${product.sku}`}
                      className={`px-2 py-2 text-[11px] mono uppercase tracking-wider border transition cursor-pointer flex items-center justify-center gap-1 ${
                        isCompared
                          ? 'bg-[#B8860B] border-[#B8860B] text-white font-bold'
                          : 'border-black/15 text-[#111113] hover:border-[#111113] bg-white'
                      }`}
                    >
                      {isCompared ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Compare</span>
                        </>
                      )}
                    </button>

                    {onViewFormalOffer && (
                      <button
                        onClick={() => onViewFormalOffer(product)}
                        aria-label={`View formal offer for ${product.sku}`}
                        className="px-2 py-2 border border-[#B8860B] bg-[#B8860B]/10 hover:bg-[#B8860B] hover:text-white text-[#111113] text-[11px] mono uppercase tracking-wider font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        title="View authentic ISO 9001:2015 Techno-Commercial Offer document matching sample PDF"
                      >
                        <Sparkles size={11} className="text-[#B8860B]" />
                        <span>Offer PDF</span>
                      </button>
                    )}

                    <button
                      onClick={() => onRequestQuote(product)}
                      aria-label={`Request quote for ${product.sku}`}
                      className="px-2 py-2 bg-[#111113] hover:bg-[#B8860B] text-white text-[11px] mono uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 font-bold"
                    >
                      <FileSpreadsheet size={12} />
                      <span>Quote</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Tray (Architectural Ivory & Ink) */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-[#111113] text-white border border-[#B8860B]/40 p-4 shadow-2xl flex flex-col sm:flex-row items-center gap-4 max-w-lg">
          <div>
            <div className="mono text-xs text-[#B8860B] font-bold">
              Comparing {selectedForCompare.length}/3 Systems
            </div>
            <div className="mono text-[10px] text-white/60 truncate max-w-xs">
              {selectedForCompare.map((p) => p.sku).join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClearCompare}
              className="mono text-[10px] text-white/50 hover:text-white px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={onOpenCompareModal}
              disabled={selectedForCompare.length < 2}
              className={`px-4 py-2 mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                selectedForCompare.length >= 2
                  ? 'bg-[#B8860B] text-white hover:brightness-110'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Sparkles size={13} />
              <span>Analyze Side-by-Side</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
