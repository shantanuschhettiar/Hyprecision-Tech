import React, { useState, useEffect } from 'react';
import {
  Search,
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
  ShieldCheck,
  Check,
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
  externalSearch?: string;
  onResetSearch?: () => void;
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
  externalSearch = '',
  onResetSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState(externalSearch);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('sku');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | undefined>(undefined);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearchTerm(externalSearch);
    }
  }, [externalSearch]);

  const filtered = filterAndSortProducts(products, {
    categorySlug: selectedCategory,
    searchTerm,
    inStockOnly,
    sortBy,
    maxPrice: maxPriceFilter,
  });

  const categoriesList = [
    { slug: 'all', label: 'All Fleet & Systems' },
    { slug: 'governmental-military', label: 'Governmental & Defense' },
    { slug: 'alunautic-aluminium', label: 'Alunautic Aluminium' },
    { slug: 'blue-spirit-ribs', label: 'Blue Spirit RIBs' },
    { slug: 'fibre-shark-grp', label: 'Fibre Shark GRP' },
    { slug: 'hdpe-workboats', label: 'HDPE Indestructible' },
    { slug: 'eo-lifesaving', label: 'EO Lifesaving & Davits' },
    { slug: 'aquacat-catamarans', label: 'AquaCat Catamarans' },
  ];

  return (
    <section id="fleet-catalogue" className="pt-2 pb-16">
      {/* Section Header matching clean prototype */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              [ Fleet Catalogue &amp; Specifications ]
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">IMO &amp; IACS Verified</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Specialized Vessels &amp; Engineering Systems
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Displaying <span className="font-bold text-slate-800">{filtered.length}</span> verified platforms with full technical parameters and certified drawings.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search SKU, vessel, engine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  if (onResetSearch) onResetSearch();
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="sku">Sort: SKU Code</option>
            <option value="name">Sort: Vessel Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock">Inventory Availability</option>
          </select>

          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      {/* Filter Ribbon with Category Pills */}
      <div
        className={`bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 mb-8 shadow-2xs ${
          showFiltersMobile ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              FLEET DIVISION:
            </span>
            {categoriesList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Secondary Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-amber-500 h-3.5 w-3.5"
              />
              <span>In-Stock / Ready Hull</span>
            </label>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="font-mono text-[11px]">Max Price:</span>
              <select
                value={maxPriceFilter || ''}
                onChange={(e) =>
                  setMaxPriceFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs cursor-pointer focus:outline-none"
              >
                <option value="">Any</option>
                <option value="100000">&lt; $100,000</option>
                <option value="300000">&lt; $300,000</option>
                <option value="1000000">&lt; $1,000,000</option>
                <option value="3000000">&lt; $3,000,000</option>
              </select>
            </div>

            {(searchTerm || inStockOnly || maxPriceFilter || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setInStockOnly(false);
                  setMaxPriceFilter(undefined);
                  onSelectCategory('all');
                  if (onResetSearch) onResetSearch();
                }}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
              >
                RESET FILTERS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
          <Package size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800 mb-1">No matching vessels found</h3>
          <p className="text-xs text-slate-500 mb-4">
            Try adjusting your search criteria or query our AI Assistant.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setInStockOnly(false);
              setMaxPriceFilter(undefined);
              onSelectCategory('all');
              if (onResetSearch) onResetSearch();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const isCompared = selectedForCompare.some((p) => p.id === product.id);
            const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image Box */}
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden cursor-pointer" onClick={() => onViewProductDetail(product)}>
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-amber-300 font-semibold uppercase">
                      {product.sku}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 backdrop-blur-xs text-[10px] font-mono text-slate-300 font-semibold">
                          BUILT TO ORDER
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/90 text-[10px] font-mono text-slate-950 font-bold">
                          AVAILABLE ({product.stock_quantity})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] font-mono text-white font-semibold">
                          READY STOCK ({product.stock_quantity})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    {/* Category Label */}
                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                      {product.category_name}
                    </div>

                    <h3
                      onClick={() => onViewProductDetail(product)}
                      className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-amber-600 transition-colors cursor-pointer line-clamp-1"
                      title={product.title}
                    >
                      {product.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {product.short_desc}
                    </p>

                    {/* Highlighted Specifications */}
                    {product.specifications && product.specifications.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        {product.specifications
                          .filter((s) => s.highlight)
                          .slice(0, 4)
                          .map((spec, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono truncate">
                                {spec.key}
                              </div>
                              <div className="text-xs font-bold text-slate-800 truncate mt-0.5 font-mono">
                                {spec.value} {spec.unit}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">FOB UNIT PRICE</div>
                    <div className="text-sm sm:text-base font-bold text-amber-600 font-mono">
                      ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleCompare(product)}
                      className={`p-2 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        isCompared
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                      title={isCompared ? 'Remove from compare' : 'Add to compare'}
                    >
                      {isCompared ? <Check size={14} className="text-amber-600" /> : <Plus size={14} />}
                    </button>

                    <button
                      onClick={() => onViewProductDetail(product)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      Specs
                    </button>

                    <button
                      onClick={() => onRequestQuote(product)}
                      className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Quote</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Tray */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 bg-slate-900 text-white rounded-xl border border-amber-500/50 p-3.5 shadow-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-md">
          <div>
            <div className="text-xs text-amber-400 font-bold font-mono">
              Comparing {selectedForCompare.length}/3 Vessels
            </div>
            <div className="text-[11px] text-slate-300 truncate max-w-xs font-mono">
              {selectedForCompare.map((p) => p.sku).join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClearCompare}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={onOpenCompareModal}
              disabled={selectedForCompare.length < 2}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                selectedForCompare.length >= 2
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles size={13} />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
