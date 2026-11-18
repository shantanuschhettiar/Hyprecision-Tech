import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Bot,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ProductItem } from '../types.ts';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onOpenAi: (initialPrompt?: string) => void;
  onOpenRfq: (product?: ProductItem) => void;
  onInspectFlagship: (sku: string) => void;
  flagshipProduct?: ProductItem;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onOpenAi,
  onOpenRfq,
  onInspectFlagship,
  flagshipProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearch(searchQuery.trim());
  };

  const popularQueries = [
    { label: 'Tugboats', query: 'tugboat ASD 80t' },
    { label: 'Engines under $300k', query: 'engine under 300000' },
    { label: 'Bollard Pull Guide', query: 'bollard pull 80t' },
  ];

  return (
    <div className="pt-2 pb-10">
      {/* 1. Subheader Breadcrumb */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold mb-4 sm:mb-6">
        <span className="text-amber-600">HY PRECISION TECHNOLOGIES</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">Naval Engineering Catalogue</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">IMO & IACS Standards</span>
      </div>

      {/* 2. Main Hero Layout (Two Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Headline, Search, Metrics */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.08] tracking-tight">
              Specialized Workboats &amp;<br />
              Precision Marine Propulsion<br />
              Systems.
            </h1>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
              Explore high-performance ASD escort tugs, fast aluminium crew vessels, self-righting pilot cutters, and heavy marine diesels. Compare verified technical specifications and query our embedded AI Assistant.
            </p>

            {/* Search Bar matching prototype */}
            <form onSubmit={handleSearchSubmit} className="mt-6 sm:mt-8 max-w-xl">
              <div className="bg-white border border-slate-200/90 rounded-xl p-1.5 pl-3.5 flex items-center shadow-xs focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <Search size={18} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vessels, bollard pull, models (e.g. 'ASD tug 80t', 'IW-D16')..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Search Fleet
                </button>
              </div>

              {/* Popular Queries */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2.5 flex-wrap">
                <span className="font-medium text-slate-500">Popular queries:</span>
                {popularQueries.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(item.label);
                        onSearch(item.query);
                      }}
                      className="text-slate-500 hover:text-amber-600 font-medium underline underline-offset-2 decoration-slate-300 hover:decoration-amber-500 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                    {idx < popularQueries.length - 1 && (
                      <span className="text-slate-300">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </form>
          </div>

          {/* Metrics Strip matching prototype */}
          <div className="grid grid-cols-3 gap-4 pt-8 sm:pt-10 mt-6 border-t border-slate-200/60 max-w-xl">
            {/* Metric 1: 80 t MAX BOLLARD PULL */}
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                80 t
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                MAX BOLLARD PULL
              </div>
            </div>

            {/* Metric 2: 2,400 kW PEAK ENGINE POWER */}
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight font-mono">
                2,400 kW
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                PEAK ENGINE POWER
              </div>
            </div>

            {/* Metric 3: IMO III SCR EMISSIONS */}
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                IMO III
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                SCR EMISSIONS
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Flagship Showcase Card matching prototype */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-3.5 flex flex-col justify-between">
            {/* Flagship Sunset Image */}
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-900 group">
              <img
                src="/images/products/flagship_stormtug_80.jpg"
                alt="StormTug 80 (ST-80) Flagship ASD Escort Tug"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Card Content */}
            <div className="pt-3 px-1">
              {/* Header row */}
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-600 uppercase tracking-wider text-[11px]">
                  Flagship Showcase
                </span>
                <span className="text-slate-400 text-xs">
                  Northbay Shipyards · Norway
                </span>
              </div>

              {/* Title & Price */}
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  StormTug 80 (ST-80)
                </h3>
                <span className="text-base sm:text-lg font-bold text-amber-600 font-mono">
                  $6,800,000
                </span>
              </div>

              {/* Summary description */}
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Escort and towing tug with high bollard pull (80t) and twin ASD azimuth propulsion.
              </p>

              {/* Footer actions matching prototype */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onInspectFlagship('ST-80-TUG')}
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspect Specifications</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenAi(
                      'Give me a detailed technical summary of the StormTug 80 (ST-80), its 80-tonne bollard pull curve, ASD azimuth thruster configuration, and fuel consumption.'
                    )
                  }
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bot size={14} className="text-amber-500" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
