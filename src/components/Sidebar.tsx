import React from 'react';
import {
  Sparkles,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  X,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAi: () => void;
  onOpenAdmin: () => void;
  onOpenRfq: () => void;
  dbHealthy: boolean;
  totalProducts: number;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenAi,
  onOpenAdmin,
  onOpenRfq,
  dbHealthy,
  totalProducts,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const navCategories = [
    { slug: 'all', label: 'All Marine Fleet', countLabel: `${totalProducts}` },
    { slug: 'alunautic-aluminium', label: 'Alunautic Aluminium', countLabel: '5083-H111' },
    { slug: 'blue-spirit-ribs', label: 'Blue Spirit GRP RIBs', countLabel: 'Orca 1670' },
    { slug: 'fibre-shark-grp', label: 'Fibre Shark Workboats', countLabel: 'Pilots/Cats' },
    { slug: 'hdpe-workboats', label: 'HDPE Indestructible', countLabel: '5-Yr Warr.' },
    { slug: 'eo-lifesaving', label: 'EO Lifesaving & Davits', countLabel: 'SOLAS/MED' },
    { slug: 'aquacat-catamarans', label: 'AquaCat Catamarans', countLabel: 'Modular AQ' },
    { slug: 'governmental-military', label: 'Governmental & Defense', countLabel: 'Naval / USV' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Persistent 280px architectural panel) */}
      <aside className="hidden lg:flex w-72 h-screen sticky top-0 flex-col justify-between border-r border-black/10 bg-[#F8F7F4] p-8 overflow-y-auto z-20 shrink-0">
        <div>
          {/* Brand Mark */}
          <div
            onClick={() => onSelectCategory('all')}
            className="cursor-pointer group mb-8 select-none"
          >
            <div className="font-editorial text-3xl font-bold tracking-tight text-[#111113] group-hover:text-[#B8860B] transition-colors leading-none">
              HY-PRECISION
            </div>
            <div className="mono text-[9px] text-[#B8860B] tracking-widest mt-1.5 uppercase font-bold">
              & Euro Offshore Group JV
            </div>
            <div className="text-[10px] text-[#111113]/50 mt-1 italic font-editorial">
              Bhiwandi, India & Werkendam, Netherlands
            </div>
          </div>

          {/* Section [01] Navigation */}
          <nav className="space-y-4 mb-8">
            <span className="label-bracket">[01] Vessel & Division Portfolio</span>
            <div className="space-y-1">
              {navCategories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => onSelectCategory(cat.slug)}
                    className={`w-full text-left py-2 px-3 rounded-none transition-all flex items-center justify-between text-xs cursor-pointer border-l-2 ${
                      isActive
                        ? 'border-[#B8860B] bg-white font-bold text-[#111113] shadow-xs'
                        : 'border-transparent text-[#111113]/70 hover:text-[#111113] hover:border-black/20 hover:bg-black/5'
                    }`}
                  >
                    <span className="truncate pr-1">{cat.label}</span>
                    <span className="mono text-[9px] text-[#B8860B] shrink-0">{cat.countLabel}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Section [02] Direct Controls */}
          <div className="space-y-2 mb-8">
            <span className="label-bracket">[02] Intelligence & Tools</span>

            <button
              onClick={onOpenAi}
              className="w-full text-left py-2.5 px-3 bg-[#111113] text-white hover:bg-[#B8860B] transition flex items-center justify-between text-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#B8860B] group-hover:text-white" />
                <span className="font-medium">Gemini Copilot</span>
              </div>
              <span className="mono text-[9px] opacity-70">v3.8</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="w-full text-left py-2 px-3 border border-black/10 bg-white hover:border-[#B8860B] text-[#111113] transition flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Database size={13} className="text-[#111113]/60" />
                <span className="font-medium">Relational DB</span>
              </div>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dbHealthy ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              ></span>
            </button>

            <button
              onClick={onOpenRfq}
              className="w-full text-left py-2 px-3 border border-black/10 bg-white hover:border-[#111113] text-[#111113] transition flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={13} className="text-[#111113]/60" />
                <span className="font-medium">Request RFQ</span>
              </div>
              <span className="mono text-[9px] text-[#111113]/50">Direct</span>
            </button>
          </div>
        </div>

        {/* Section [03] Contact & Certification */}
        <div className="pt-6 border-t border-black/10 space-y-3 text-[11px] text-[#111113]/70">
          <span className="label-bracket">[03] Contact & Works</span>
          <div className="space-y-1">
            <div className="font-medium text-[#111113]">Bhiwandi / Thane Works</div>
            <div className="mono text-[10px] text-[#111113]/80">sales@hyprecisiontechnology.com</div>
            <div className="mono text-[10px] text-[#111113]/80">+91 70836 78003</div>
          </div>
          <div className="mono text-[9px] text-[#B8860B] font-semibold pt-1">
            ISO 9001:2015 & ASME VIII
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-80 bg-[#F8F7F4] h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="font-editorial text-3xl font-bold">HY</div>
                  <div className="mono text-[9px] text-[#111113]/60 uppercase">
                    Precision Technology
                  </div>
                </div>
                <button
                  onClick={onCloseMobileMenu}
                  className="p-2 text-[#111113] hover:opacity-70"
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-3 mb-6">
                <span className="label-bracket">[01] Navigation</span>
                {navCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      onCloseMobileMenu();
                    }}
                    className={`w-full text-left py-2 px-3 text-xs flex justify-between items-center ${
                      selectedCategory === cat.slug
                        ? 'bg-white font-bold border-l-2 border-[#B8860B]'
                        : 'text-[#111113]/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="mono text-[9px] text-[#B8860B]">{cat.countLabel}</span>
                  </button>
                ))}
              </nav>

              <div className="space-y-2 mb-6">
                <span className="label-bracket">[02] Intelligence</span>
                <button
                  onClick={() => {
                    onOpenAi();
                    onCloseMobileMenu();
                  }}
                  className="w-full py-2.5 px-3 bg-[#111113] text-white text-xs font-semibold flex items-center justify-between"
                >
                  <span>Gemini AI Copilot</span>
                  <Sparkles size={13} className="text-[#B8860B]" />
                </button>
                <button
                  onClick={() => {
                    onOpenAdmin();
                    onCloseMobileMenu();
                  }}
                  className="w-full py-2 px-3 border border-black/10 bg-white text-xs font-medium flex items-center justify-between"
                >
                  <span>Admin Database Console</span>
                  <Database size={13} />
                </button>
                <button
                  onClick={() => {
                    onOpenRfq();
                    onCloseMobileMenu();
                  }}
                  className="w-full py-2 px-3 border border-black/10 bg-white text-xs font-medium flex items-center justify-between"
                >
                  <span>Request RFQ Quote</span>
                  <FileSpreadsheet size={13} />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 text-xs text-[#111113]/70 space-y-1">
              <span className="label-bracket">[03] Contact</span>
              <p>sales@hyprecisiontechnology.com</p>
              <p className="mono text-[11px]">+91 70836 78003</p>
            </div>
          </div>
          <div className="flex-1" onClick={onCloseMobileMenu}></div>
        </div>
      )}
    </>
  );
};
