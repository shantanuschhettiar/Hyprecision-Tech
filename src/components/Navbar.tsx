import React, { useState } from 'react';
import {
  Anchor,
  Bot,
  FileSpreadsheet,
  Menu,
  X,
  Database,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'overview' | 'catalogue' | 'compare' | 'ai' | 'commercial';
  onSelectTab: (tab: 'overview' | 'catalogue' | 'compare' | 'ai' | 'commercial') => void;
  compareCount: number;
  onOpenCompare: () => void;
  onOpenAi: () => void;
  onOpenRfq: () => void;
  onOpenAdmin: () => void;
  dbHealthy: boolean;
  totalProducts: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  compareCount,
  onOpenCompare,
  onOpenAi,
  onOpenRfq,
  onOpenAdmin,
  dbHealthy,
  totalProducts,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Identity matching prototype */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onSelectTab('overview')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100/90 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
            <Anchor size={20} className="stroke-[2.3]" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold tracking-tight text-amber-600 leading-tight">
              HY PRECISION TECHNOLOGIES
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              MARINE & OFFSHORE SYSTEMS
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs matching prototype */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm">
          <button
            onClick={() => onSelectTab('overview')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => onSelectTab('catalogue')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'catalogue'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Catalogue
          </button>

          <button
            onClick={() => {
              onSelectTab('compare');
              onOpenCompare();
            }}
            className={`pb-1 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compare'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Compare</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
              {compareCount > 0 ? compareCount : 2}
            </span>
          </button>

          <button
            onClick={onOpenAi}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            AI Assistant
          </button>

          <button
            onClick={() => onSelectTab('commercial')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'commercial'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Commercial Sales
          </button>
        </nav>

        {/* Right: Actions matching prototype */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Engineer button */}
          <button
            onClick={onOpenAi}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Bot size={15} className="text-amber-600" />
            <span>AI Engineer</span>
          </button>

          {/* Request Quote button */}
          <button
            onClick={onOpenRfq}
            className="px-4 sm:px-5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            Request Quote
          </button>

          {/* Admin Database Shortcut Icon */}
          <button
            onClick={onOpenAdmin}
            title="Database Console"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open Admin Database"
          >
            <Database size={16} />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <button
            onClick={() => {
              onSelectTab('overview');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'overview' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              onSelectTab('catalogue');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'catalogue' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-700'
            }`}
          >
            Catalogue
          </button>
          <button
            onClick={() => {
              onOpenCompare();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 flex items-center justify-between"
          >
            <span>Compare Fleet</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {compareCount}
            </span>
          </button>
          <button
            onClick={() => {
              onOpenAi();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2"
          >
            <Bot size={15} className="text-amber-600" />
            <span>AI Assistant & Copilot</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('commercial');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700"
          >
            Commercial Sales & ISO Quotations
          </button>
        </div>
      )}
    </header>
  );
};
