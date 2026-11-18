import React from 'react';
import { Database, ShieldCheck, Anchor } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAdmin }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                <Anchor size={16} />
              </div>
              <div className="text-sm font-bold text-amber-600">HY PRECISION TECHNOLOGIES</div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              MARINE &amp; OFFSHORE SYSTEMS // 2026
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Joint Venture partner with Euro Offshore Group. Specialized naval patrol vessels, ASD escort tugboats, indestructible HDPE workboats, and SOLAS lifesaving systems.
            </p>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Vessel Divisions
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <button onClick={() => onSelectCategory('governmental-military')} className="hover:text-amber-600 transition cursor-pointer">
                  • Fast Attack Patrol 2380 &amp; USV 5.60
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('alunautic-aluminium')} className="hover:text-amber-600 transition cursor-pointer">
                  • Alunautic Aluminium Landing Crafts
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('blue-spirit-ribs')} className="hover:text-amber-600 transition cursor-pointer">
                  • Blue Spirit GRP Tactical RHIBs
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('hdpe-workboats')} className="hover:text-amber-600 transition cursor-pointer">
                  • HDPE Indestructible Hull Workboats
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('eo-lifesaving')} className="hover:text-amber-600 transition cursor-pointer">
                  • EO Lifeboats &amp; Hydraulic Davits
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Locations &amp; Facilities
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p><strong>India Works:</strong> Renaissance Infrastructure Park, Unit 4, Vashere, Thane, MH 421301</p>
              <p><strong>Europe Yard:</strong> Euro Offshore B.V., Beatrixhaven, Werkendam, Netherlands</p>
              <p><strong>Norway Partner:</strong> Northbay Shipyards, Norway</p>
              <p className="text-[10px] text-amber-600 font-semibold pt-1 flex items-center gap-1">
                <ShieldCheck size={12} /> ISO 9001:2015 &amp; IMO / SOLAS Certified
              </p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Commercial &amp; Sales Inquiries
            </div>
            <div className="space-y-1 text-xs text-slate-600 font-mono">
              <p>sales@hyprecisiontechnology.com</p>
              <p>+91 70836 78003</p>
              <p>+91 900470 9634</p>
              <p className="text-[11px] text-slate-400 font-sans pt-1">
                Techno-Commercial Quotations generated with 30/30/30/10 milestone schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100 text-xs text-slate-400">
          <div>
            © 2026 HY Precision Technologies. Naval Engineering Catalogue · IMO &amp; IACS Standards.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Database size={13} />
              <span>Admin Inventory Console</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
