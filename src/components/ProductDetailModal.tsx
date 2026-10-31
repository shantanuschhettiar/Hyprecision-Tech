import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { ProductItem } from '../types.ts';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onToggleCompare: (product: ProductItem) => void;
  isCompared: boolean;
  onRequestQuote: (product: ProductItem) => void;
  onViewFormalOffer?: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onToggleCompare,
  isCompared,
  onRequestQuote,
  onViewFormalOffer,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  if (!product) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F8F7F4] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/15 overflow-hidden my-auto text-[#111113]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#111113] text-white flex justify-between items-center shrink-0 border-b border-black/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] font-bold text-[#B8860B] bg-white/10 px-2 py-0.5 border border-white/10">
                {product.sku}
              </span>
              <span className="mono text-[10px] text-white/50">{product.category_name}</span>
            </div>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold mt-1.5 text-white">
              {product.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Top Banner Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            <div
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              className="sm:col-span-5 h-60 bg-black border border-black/15 overflow-hidden relative group cursor-crosshair select-none"
            >
              <img
                src={product.image_url}
                alt={product.title}
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isZoomed ? 'scale(2.4)' : 'scale(1)',
                }}
                className="w-full h-full object-cover transition-transform duration-100 ease-out pointer-events-none"
              />

              {/* Inspection HUD indicator */}
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs text-white px-2 py-1 mono text-[9px] uppercase tracking-wider flex items-center gap-1 border border-white/10 pointer-events-none">
                {isZoomed ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] animate-pulse"></span>
                    <span className="text-[#B8860B] font-bold">2.4x Zoom Active</span>
                  </>
                ) : (
                  <>
                    <ZoomIn size={11} className="text-[#B8860B]" />
                    <span>Hover to Zoom</span>
                  </>
                )}
              </div>

              <div className="absolute bottom-2 left-2 bg-[#111113]/90 text-[#B8860B] px-2 py-0.5 mono text-[9px] uppercase tracking-wider border border-[#B8860B]/30 pointer-events-none flex items-center gap-1">
                <span>CAD Verified Inspection</span>
              </div>
            </div>

            <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <span className="label-bracket">[01] Technical Overview</span>
                <p className="text-[#111113]/80 leading-relaxed text-xs mt-1">
                  {product.description || product.short_desc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-black/10 bg-white p-3">
                <div>
                  <span className="mono text-[9px] text-[#111113]/50 uppercase">Unit Price</span>
                  <div className="text-lg font-bold text-[#111113] font-editorial mt-0.5">
                    ${product.price_usd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="mono text-[9px] text-[#111113]/50 uppercase">Stock Status</span>
                  <div className="mono text-[11px] font-bold text-[#111113] mt-1">
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} in stock`
                      : 'Built to Order'}
                  </div>
                </div>
                <div>
                  <span className="mono text-[9px] text-[#111113]/50 uppercase">Lead Time</span>
                  <div className="mono text-[11px] font-bold text-[#111113] mt-1">
                    {product.lead_time_days} days
                  </div>
                </div>
              </div>

              {/* Certifications list */}
              <div>
                <div className="mono text-[9px] uppercase font-bold text-[#111113]/60 mb-1 flex items-center gap-1">
                  <Shield size={11} className="text-[#B8860B]" /> Testing & Certification Standards
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(product.certifications || ['ISO 9001:2015', 'CE', 'ASME VIII']).map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white text-[#111113] mono text-[10px] border border-black/10"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Specifications Table */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="label-bracket">[02] Full Specifications Sheet</span>
            </div>
            <div className="border border-black/10 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111113] text-white mono text-[10px] uppercase">
                  <tr>
                    <th className="p-3 w-1/2">Parameter</th>
                    <th className="p-3">Specification / Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {product.specifications.map((s, idx) => (
                    <tr key={idx} className={s.highlight ? 'bg-[#B8860B]/5' : 'hover:bg-black/5'}>
                      <td className="p-3 font-medium text-[#111113] flex items-center justify-between">
                        <span>{s.key}</span>
                        {s.highlight && (
                          <span className="mono text-[9px] text-[#B8860B] bg-[#B8860B]/10 font-bold px-1.5 py-0.5 border border-[#B8860B]/20 mr-2">
                            CRITICAL
                          </span>
                        )}
                      </td>
                      <td className="p-3 mono font-semibold text-[#111113]">
                        {s.value} {s.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-black/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onToggleCompare(product)}
            className={`px-4 py-2 text-xs mono uppercase tracking-wider border transition cursor-pointer ${
              isCompared
                ? 'bg-[#B8860B] text-white border-[#B8860B] font-bold'
                : 'border-black/20 text-[#111113] hover:border-black/50'
            }`}
          >
            {isCompared ? 'In Comparison Tray ✓' : '+ Add to Compare'}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onViewFormalOffer && (
              <button
                onClick={() => {
                  onClose();
                  onViewFormalOffer(product);
                }}
                className="px-4 py-2 border border-[#B8860B] bg-[#B8860B]/10 hover:bg-[#B8860B] hover:text-white text-[#111113] text-xs mono uppercase tracking-wider font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="View authentic ISO 9001:2015 Techno-Commercial Offer document (as per HPT sample quotation)"
              >
                <Sparkles size={13} className="text-[#B8860B]" />
                <span>Formal Quotation (PDF Offer)</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onRequestQuote(product);
              }}
              className="px-5 py-2 bg-[#111113] hover:bg-[#B8860B] text-white text-xs mono uppercase tracking-wider font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Submit RFQ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
