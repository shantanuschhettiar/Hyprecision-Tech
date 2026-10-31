import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Gauge,
  Sliders,
  Check,
} from 'lucide-react';

interface HeroSectionProps {
  onQuickSearch: (query: string) => void;
  onOpenAi: (initialPrompt?: string) => void;
  onOpenRfq: (sku?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onQuickSearch,
  onOpenAi,
  onOpenRfq,
}) => {
  const [nlInput, setNlInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim()) return;
    onOpenAi(nlInput.trim());
  };

  const samplePrompts = [
    'Show Alunautic WB 5.50 specifications & quote terms',
    'Compare Fast Attack Patrol 2380 vs Blue Spirit 1120',
    'Why choose HDPE indestructible hull over aluminium?',
    'Explain the 30/30/30/10 quotation payment milestones',
  ];

  return (
    <div className="mb-12">
      {/* Editorial Header */}
      <header className="mb-10 sm:mb-12">
        <div className="flex items-center justify-between mb-3">
          <span className="mono text-xs text-[#B8860B] font-semibold tracking-widest uppercase">
            Hy-Precision Technology & Euro Offshore // 2026 Fleet
          </span>
          <span className="mono text-[10px] text-[#111113]/50 tracking-wider">
            ISO 9001:2015 • SOLAS • IACS • RINA
          </span>
        </div>
        <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-normal leading-[0.9] tracking-tight text-[#111113]">
          Maritime<br />
          Dominance.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#111113]/70 max-w-2xl leading-relaxed">
          International Joint Venture manufacturing heavy-duty aluminium workboats, military littoral patrol craft,
          GRP rigid inflatables, indestructible HDPE landing crafts, and SOLAS lifesaving davit systems.
        </p>
      </header>

      {/* Variation 1 Product Spotlight & Metrics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Spotlight Card */}
        <div className="lg:col-span-7 bg-white border border-black/8 p-6 sm:p-8 relative flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="label-bracket">Fleet Spotlight (Featured Offer)</span>
              <span className="mono text-[10px] text-[#B8860B] font-bold">ALU-WB-550</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111113] my-2">
              Alunautic WB 5.50 Monohull Aluminium Workboat
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-2">
              <div className="sm:col-span-7">
                <p className="text-xs sm:text-sm text-[#111113]/70 leading-relaxed">
                  The flagship standard platform specified in official offer HPT/256/10/26 R0. Constructed
                  from seaworthy 5083-H111 marine aluminium with polyurethane positive buoyancy foam,
                  dual 1500 GPH bilge pumps, certified 4-point crane lifting slings, and ISO 9001:2015 compliance.
                </p>
              </div>
              <div className="sm:col-span-5 h-32 bg-slate-900 border border-black/10 overflow-hidden relative group/spot cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=800"
                  alt="Alunautic WB 5.50 Workboat"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/spot:scale-125"
                />
                <div className="absolute bottom-1.5 left-1.5 bg-[#111113]/90 text-[#B8860B] px-1.5 py-0.5 mono text-[8px] uppercase">
                  Aluminium 5083
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => onOpenRfq('ALU-WB-550')}
              className="px-6 py-2.5 bg-[#111113] hover:bg-[#B8860B] text-white mono text-xs uppercase font-medium tracking-widest transition cursor-pointer"
            >
              Generate Formal Offer
            </button>
            <div className="mono text-xs text-[#111113]/60">
              Base Vessel: <span className="font-bold text-[#111113]">$48,500 Ex-Works</span>
            </div>
          </div>
        </div>

        {/* Operating Metrics Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-white border border-black/8 p-6 flex flex-col justify-center shadow-xs">
            <div className="font-editorial text-4xl sm:text-5xl font-light text-[#111113]">
              55+<span className="text-base text-[#B8860B] ml-1.5 font-normal">Knots</span>
            </div>
            <span className="label-bracket mt-2">Tactical Interception Top Speed</span>
          </div>

          <div className="bg-white border border-black/8 p-6 flex flex-col justify-center shadow-xs">
            <div className="font-editorial text-4xl sm:text-5xl font-light text-[#111113]">
              18<span className="text-base text-[#B8860B] ml-1.5 font-normal">Months</span>
            </div>
            <span className="label-bracket mt-2">Comprehensive Hull & Structure Warranty</span>
          </div>
        </div>
      </section>

      {/* Integrated Natural Language AI Search Bar */}
      <section className="bg-white border border-black/8 p-6 sm:p-7 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#B8860B]" />
            <span className="label-bracket text-[#111113] font-bold">
              [02] Naval Architecture Copilot & Quotation Advisor
            </span>
          </div>
          <span className="mono text-[10px] text-[#B8860B] font-semibold">
            Gemini 3.8 Flash Grounded
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder='Ask any question, e.g. "Show Alunautic WB 5.50 specs", "Compare Fast Attack 2380 vs USV 5.60", "Explain payment terms"...'
              className="w-full pl-4 pr-12 py-3 bg-[#F8F7F4] border border-black/10 text-xs sm:text-sm text-[#111113] placeholder-[#111113]/40 focus:outline-none focus:border-[#B8860B] focus:bg-white transition"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-2 bg-[#111113] hover:bg-[#B8860B] text-white transition cursor-pointer"
              title="Query with Gemini"
              aria-label="Submit natural language query"
            >
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="label-bracket mr-1">Vessel inquiries:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setNlInput(p);
                  onOpenAi(p);
                }}
                className="text-[11px] px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#111113] hover:text-white border border-black/8 text-[#111113]/80 transition cursor-pointer"
              >
                "{p}"
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
};
