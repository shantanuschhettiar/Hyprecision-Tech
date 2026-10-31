import React, { useState } from 'react';
import {
  Sparkles,
  Database,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

interface NavbarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAi: () => void;
  onOpenAdmin: () => void;
  onOpenRfq: () => void;
  dbHealthy: boolean;
  totalProducts: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenAi,
  onOpenAdmin,
  onOpenRfq,
  dbHealthy,
  totalProducts,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navCategories = [
    { slug: 'all', label: 'All Systems' },
    { slug: 'hydraulics', label: 'Hydraulics (0-40 Bar)' },
    { slug: 'filtration', label: 'Industrial Filtration' },
    { slug: 'cnc-machining', label: 'CNC Machining (±0.005mm)' },
    { slug: 'offshore-marine', label: 'Offshore & Marine' },
  ];

  return (
    <>
      {/* 1. TOP UTILITY STRIP */}
      <div className="bg-[#081524] text-slate-300 text-xs py-2 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3 sm:space-x-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <ShieldCheck size={14} /> Official Distributor: Euro Offshore Ltd. & Fluen Co. Korea
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">ISO 9001:2015 & ASME VIII Div 1 Certified</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              <span
                className={`h-2 w-2 rounded-full ${
                  dbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span className="font-mono text-emerald-400 font-semibold">Relational DB</span>
              <span className="text-slate-500">({totalProducts} SKU items)</span>
            </div>

            <button
              onClick={onOpenAdmin}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold px-2 py-0.5 rounded hover:bg-cyan-950/40 transition cursor-pointer"
              title="Open Relational Database & Inventory Console"
            >
              <Database size={13} />
              <span>Admin Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F2B48] text-white shadow-xl border-b border-cyan-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => onSelectCategory('all')}
          >
            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg border border-cyan-300/30 text-white font-black text-xl tracking-wider group-hover:scale-105 transition-transform">
              HY
            </div>
            <div>
              <div className="font-extrabold text-lg sm:text-xl tracking-tight leading-none text-white flex items-center gap-1.5">
                <span>HY PRECISION</span>
                <span className="text-cyan-400 font-light">TECHNOLOGY</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-cyan-200/70 font-medium tracking-widest uppercase mt-1">
                We deliver confidence, not just components
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs font-semibold">
            {navCategories.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Gemini AI Copilot */}
            <button
              onClick={onOpenAi}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Sparkles size={16} className="text-yellow-300 animate-spin-slow" />
              <span className="hidden sm:inline">Gemini AI Copilot</span>
              <span className="sm:hidden">AI Assistant</span>
            </button>

            {/* Request RFQ */}
            <button
              onClick={onOpenRfq}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border border-cyan-400/60 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Request RFQ</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle mobile navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a1f33] border-t border-slate-800 px-4 py-4 space-y-2 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Engineering Domains
            </div>
            {navCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between ${
                  selectedCategory === cat.slug
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ))}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenRfq();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-cyan-500 text-slate-900 font-bold rounded-lg text-center"
              >
                Request Custom RFQ
              </button>
              <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-center flex items-center justify-center gap-1.5"
              >
                <Database size={14} /> Open Admin Database Console
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
