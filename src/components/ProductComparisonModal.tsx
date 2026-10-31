import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { ProductItem, AiComparisonResult } from '../types.ts';
import { buildProductComparisonMatrix } from '../utils/productLogic.ts';

interface ProductComparisonModalProps {
  products: ProductItem[];
  onClose: () => void;
  onRemoveProduct: (id: string) => void;
  onRequestQuote: (product: ProductItem) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  products,
  onClose,
  onRemoveProduct,
  onRequestQuote,
}) => {
  const [aiData, setAiData] = useState<AiComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localMatrix = buildProductComparisonMatrix(products);

  const fetchAiComparison = async () => {
    if (products.length < 2) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: products.map((p) => p.id) }),
      });

      if (!res.ok) {
        throw new Error('AI comparison service encountered an issue.');
      }

      const data = await res.json();
      setAiData(data);
    } catch (err: any) {
      console.warn('AI comparison fetch failed:', err);
      setError(err.message || 'Failed to complete AI comparison.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiComparison();
  }, [products]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F8F7F4] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/15 overflow-hidden my-auto text-[#111113]">
        {/* Architectural Header */}
        <div className="p-4 sm:p-5 bg-[#111113] text-white flex justify-between items-center shrink-0 border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 text-[#B8860B] border border-white/10">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight">
                  Component Comparison Matrix
                </h3>
                <span className="mono text-[9px] text-[#B8860B] border border-[#B8860B]/40 px-1.5 py-0.5">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="mono text-[10px] text-white/50 tracking-wider">
                Grounding side-by-side engineering tolerances & operational specs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAiComparison}
              disabled={loading || products.length < 2}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono transition cursor-pointer"
              title="Refresh AI Analysis"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-[#B8860B]' : ''} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. PRODUCT CARDS HEADER ROW */}
          <div
            className={`grid gap-4 ${
              products.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-black/10 p-4 flex flex-col justify-between relative shadow-xs"
              >
                {products.length > 2 && (
                  <button
                    onClick={() => onRemoveProduct(prod.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-black/40 hover:text-red-600 transition"
                    title="Remove from comparison"
                  >
                    <X size={15} />
                  </button>
                )}

                <div>
                  <div className="flex justify-between items-center">
                    <span className="mono text-[10px] font-bold text-[#B8860B] bg-[#F8F7F4] px-2 py-0.5 border border-black/10">
                      {prod.sku}
                    </span>
                    <span className="mono text-[9px] text-[#111113]/50">{prod.category_name}</span>
                  </div>

                  {/* Vessel Image with Hover Zoom */}
                  <div className="h-28 w-full bg-slate-900 border border-black/10 overflow-hidden relative my-2.5 group">
                    <img
                      src={prod.image_url}
                      alt={prod.title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-120"
                    />
                  </div>

                  <h4 className="font-editorial text-base sm:text-lg font-bold text-[#111113] mb-1 leading-tight">
                    {prod.title}
                  </h4>
                  <div className="text-xl font-bold text-[#111113] font-editorial">
                    ${prod.price_usd.toLocaleString()}{' '}
                    <span className="mono text-[9px] text-[#111113]/40 font-normal">Ex-Works</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between text-xs">
                  <span className="mono text-[10px] text-[#111113]/60">Lead Time: {prod.lead_time_days}d</span>
                  <button
                    onClick={() => onRequestQuote(prod)}
                    className="px-2.5 py-1 bg-[#111113] hover:bg-[#B8860B] text-white text-[10px] mono uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  >
                    <FileSpreadsheet size={11} /> Quote
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 2. GEMINI AI ANALYSIS CARD */}
          <div className="bg-white border border-black/10 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-black/10 pb-2.5">
              <h4 className="font-editorial text-lg font-bold text-[#111113] flex items-center gap-2">
                <Sparkles size={16} className="text-[#B8860B]" />
                <span>Gemini 3.8 Flash Synthesis</span>
              </h4>
              {loading && (
                <div className="flex items-center gap-1.5 mono text-[10px] text-[#B8860B] animate-pulse">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Cross-referencing specs...</span>
                </div>
              )}
            </div>

            {aiData && !loading ? (
              <div className="space-y-4">
                <p className="text-xs text-[#111113]/80 leading-relaxed italic border-l-2 border-[#B8860B] pl-3 py-1 bg-[#F8F7F4]">
                  "{aiData.summary}"
                </p>

                {/* Recommendations grid */}
                <div
                  className={`grid gap-3 ${
                    aiData.recommendations.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-3'
                  }`}
                >
                  {aiData.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-[#F8F7F4] border border-black/10 p-3.5 space-y-2 text-xs"
                    >
                      <div className="font-bold text-[#111113] mono text-xs flex items-center justify-between border-b border-black/10 pb-1.5">
                        <span>{rec.sku}</span>
                        <Award size={14} className="text-[#B8860B]" />
                      </div>
                      <div className="text-[11px] text-[#111113]/80">
                        <strong className="text-[#111113] font-semibold">Optimal Use-Case:</strong> {rec.bestFor}
                      </div>

                      <div>
                        <div className="mono text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle size={10} /> Strengths:
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-[#111113]/70 pl-1 space-y-0.5">
                          {rec.pros.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="mono text-[10px] font-bold text-amber-800 flex items-center gap-1">
                          <AlertCircle size={10} /> Considerations:
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-[#111113]/70 pl-1 space-y-0.5">
                          {rec.cons.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="py-8 text-center text-xs text-[#111113]/60 space-y-2">
                <RefreshCw size={24} className="animate-spin text-[#B8860B] mx-auto" />
                <p className="mono text-[11px]">Gemini is evaluating pressure tolerances and metallurgy criteria...</p>
              </div>
            ) : (
              <div className="text-xs text-[#111113]/60 py-3 mono">
                Select at least 2 items to view AI-generated comparative recommendations.
              </div>
            )}
          </div>

          {/* 3. RELATIONAL SPECIFICATION COMPARISON MATRIX TABLE */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="label-bracket">[04] Technical Matrix</span>
            </div>

            <div className="border border-black/10 overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111113] text-white">
                    <tr>
                      <th className="p-3 font-medium w-1/3 mono text-[10px] uppercase tracking-wider">
                        Parameter / Specification
                      </th>
                      {products.map((p) => (
                        <th key={p.id} className="p-3 mono font-bold text-[11px] text-[#B8860B]">
                          {p.sku}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {/* Common Price & Stock row */}
                    <tr className="bg-[#F8F7F4] font-medium">
                      <td className="p-3 text-[#111113] font-semibold">Unit Price (FOB)</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-3 text-[#111113] font-editorial text-sm font-bold">
                          ${p.price_usd.toLocaleString()} USD
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-[#F8F7F4]">
                      <td className="p-3 text-[#111113]/80">Stock Availability</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-3 text-[#111113] mono text-[11px]">
                          {p.stock_quantity > 0
                            ? `${p.stock_quantity} units available`
                            : 'Made to Order'}
                        </td>
                      ))}
                    </tr>

                    {/* Dynamic Specs Rows */}
                    {localMatrix.rows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          row.isDifferent ? 'bg-[#B8860B]/5 font-medium' : 'hover:bg-black/5'
                        }
                      >
                        <td className="p-3 text-[#111113]/90 flex items-center justify-between">
                          <span>{row.specKey}</span>
                          {row.isDifferent && (
                            <span className="mono text-[9px] text-[#B8860B] bg-[#B8860B]/10 font-bold px-1.5 py-0.5 border border-[#B8860B]/20">
                              DIFF
                            </span>
                          )}
                        </td>
                        {products.map((p) => (
                          <td key={p.id} className="p-3 text-[#111113] mono text-[11px]">
                            {row.values[p.id] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-black/10 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#111113] hover:bg-[#B8860B] text-white text-xs mono uppercase tracking-wider transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
