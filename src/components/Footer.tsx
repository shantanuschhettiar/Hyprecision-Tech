import React from 'react';
import { Database, Sparkles } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAdmin }) => {
  return (
    <footer className="mt-20 border-t border-[#111113] pt-8 pb-12 text-[#111113]/70 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="font-editorial text-2xl font-bold text-[#111113] mb-2">HY</div>
          <div className="mono text-[10px] uppercase tracking-widest text-[#B8860B] mb-2">
            Precision Technology // 2026
          </div>
          <p className="text-[11px] leading-relaxed text-[#111113]/60">
            We deliver confidence, not just components. Engineered fluid power, ASME Section VIII
            filtration, and 5-axis aerospace precision machining.
          </p>
        </div>

        <div>
          <span className="label-bracket mb-2">Capabilities</span>
          <ul className="space-y-1.5 text-[11px]">
            <li>• Hydraulic Screw Pumps (0-40 Bar)</li>
            <li>• Bladder Accumulators (350 Bar)</li>
            <li>• Mechanically Cleaned Filters</li>
            <li>• 5-Axis Titanium Machining (±0.005mm)</li>
            <li>• SOLAS Rescue Boats & Davit Skids</li>
          </ul>
        </div>

        <div>
          <span className="label-bracket mb-2">Locations & Works</span>
          <div className="space-y-1 text-[11px]">
            <p><strong>HQ:</strong> Bhumi World, Bhiwandi, Maharashtra 421302, India</p>
            <p><strong>Works:</strong> Renaissance Infrastructure Park, Thane</p>
            <p className="mono text-[10px] text-[#B8860B] pt-1">ISO 9001:2015 & ASME VIII Certified</p>
          </div>
        </div>

        <div>
          <span className="label-bracket mb-2">Direct Contact</span>
          <div className="space-y-1 text-[11px] mono">
            <p>sales@hyprecisiontechnology.com</p>
            <p>+91 70836 78003</p>
            <p>+91 900470 9634</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-black/5 text-[11px] mono">
        <div>
          © 2026 HY Precision Technology. ISO 9001:2015 & ASME VIII Div 1 Certified.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdmin}
            className="hover:text-[#B8860B] underline cursor-pointer"
          >
            Relational DB Console
          </button>
          <span>//</span>
          <span>Integrated with Gemini 3.8 Flash</span>
        </div>
      </div>
    </footer>
  );
};
