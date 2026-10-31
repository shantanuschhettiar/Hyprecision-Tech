import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ProductItem } from '../types.ts';
import { validateRfqInput } from '../utils/productLogic.ts';

interface RfqModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onSubmitted?: () => void;
  onViewFormalOffer?: (product: ProductItem, customData?: any) => void;
}

export const RfqModal: React.FC<RfqModalProps> = ({
  product,
  onClose,
  onSubmitted,
  onViewFormalOffer,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customSpecs, setCustomSpecs] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'Simrad Halo20+ Radar Suite',
    'Certified 4-Leg Crane Slings',
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [createdRfqObj, setCreatedRfqObj] = useState<any>(null);

  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateRfqInput({
      customer_name: customerName,
      email,
      company_name: companyName,
      quantity_requested: quantity,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const combinedSpecs = [
        customSpecs.trim(),
        selectedOptions.length > 0 ? `Selected Options: ${selectedOptions.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product ? product.id : null,
          customer_name: customerName.trim(),
          company_name: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          quantity_requested: quantity,
          custom_specs: combinedSpecs,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record RFQ');
      }

      const created = await res.json();
      setCreatedRfqObj(created);
      setSubmittedRef(created.reference_no || created.id || 'RFQ-' + Date.now());
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      alert(err.message || 'Error submitting quote request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F8F7F4] max-w-lg w-full p-6 shadow-2xl border border-black/15 my-auto text-[#111113]">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#111113] text-[#B8860B]">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#111113]">
                {product ? `Request Quote: ${product.sku}` : 'Request Naval Engineering Quote'}
              </h3>
              <p className="mono text-[10px] text-[#111113]/50">
                Official ISO 9001:2015 Techno-Commercial Offer workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-black/40 hover:text-black transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {submittedRef ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-editorial text-xl font-bold text-[#111113]">Techno-Commercial Offer Generated</h4>
            <div className="mono text-xs bg-white py-1.5 px-3 border border-black/10 inline-block text-[#111113]">
              Official Reference: <span className="font-bold text-[#B8860B]">{submittedRef}</span>
            </div>
            <p className="text-xs text-[#111113]/70 leading-relaxed max-w-sm mx-auto">
              Your inquiry has been logged under ISO 9001:2015 guidelines. You can view, download, or print the official 4-section technical and commercial offer document now.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row justify-center gap-2">
              {product && onViewFormalOffer && (
                <button
                  onClick={() => {
                    onClose();
                    onViewFormalOffer(product, {
                      reference_no: submittedRef,
                      company_name: companyName,
                      customer_name: customerName,
                      email,
                      phone,
                    });
                  }}
                  className="px-5 py-2.5 bg-[#B8860B] hover:bg-[#9a7009] text-black font-bold mono text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  View Official Offer (PDF Format)
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#111113] hover:bg-black/80 text-white mono text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {product && (
              <div className="p-3 bg-white border border-black/10 flex items-center justify-between">
                <div>
                  <div className="mono font-bold text-[#B8860B] text-xs">{product.sku}</div>
                  <div className="font-editorial text-sm text-[#111113] truncate max-w-xs">{product.title}</div>
                </div>
                <div className="text-right mono font-bold text-xs text-[#111113]">
                  ${product.price_usd.toLocaleString()} FOB
                </div>
              </div>
            )}

            <div>
              <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                Company / Organization *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-[#111113]/40" size={15} />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Reliance Offshore, Larsen & Toubro, Navantia"
                  className="w-full pl-9 pr-3 py-2 border border-black/15 bg-white text-xs focus:outline-none focus:border-[#B8860B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                  Contact Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-[#111113]/40" size={15} />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-9 pr-3 py-2 border border-black/15 bg-white text-xs focus:outline-none focus:border-[#B8860B]"
                  />
                </div>
                {errors.customer_name && (
                  <p className="text-rose-600 mono text-[9px] mt-0.5">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                  Quantity (Units) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-black/15 bg-white text-xs mono focus:outline-none focus:border-[#B8860B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#111113]/40" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eng@client.com"
                    className="w-full pl-9 pr-3 py-2 border border-black/15 bg-white text-xs focus:outline-none focus:border-[#B8860B]"
                  />
                </div>
                {errors.email && <p className="text-rose-600 mono text-[9px] mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                  Phone / Mobile
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-[#111113]/40" size={15} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 border border-black/15 bg-white text-xs focus:outline-none focus:border-[#B8860B]"
                  />
                </div>
              </div>
            </div>

            {/* Optional Equipment Selection */}
            <div>
              <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1.5">
                Include Project Equipment & Systems
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white p-2.5 border border-black/10">
                {[
                  { label: 'Simrad Halo20+ Radar Suite', desc: 'Pulse compression radar + 9-in chartplotter' },
                  { label: 'Certified 4-Leg Crane Slings', desc: 'Proof load tested to 2.5x SWL' },
                  { label: 'Ullman Shock Seating', desc: 'Military suspension jockey seats' },
                  { label: '1-Year Consumable Spares', desc: 'Filters, impellers, anodes & gaskets' },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-black/5 text-[11px]">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(item.label)}
                      onChange={() => toggleOption(item.label)}
                      className="mt-0.5 accent-[#B8860B]"
                    />
                    <div>
                      <span className="font-semibold text-[#111113] block leading-tight">{item.label}</span>
                      <span className="text-[10px] text-[#111113]/50 leading-tight">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mono text-[10px] text-[#111113]/70 uppercase font-semibold mb-1">
                Custom Specs / Operating Environment
              </label>
              <textarea
                rows={2}
                value={customSpecs}
                onChange={(e) => setCustomSpecs(e.target.value)}
                placeholder="Mention sea state requirements (e.g. Sea State 5), shallow draft needs, weapon mount wiring, or delivery destination port..."
                className="w-full px-3 py-2 border border-black/15 bg-white text-xs focus:outline-none focus:border-[#B8860B]"
              ></textarea>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              {product && onViewFormalOffer && (
                <button
                  type="button"
                  onClick={() => {
                    onViewFormalOffer(product, {
                      company_name: companyName || 'Client Organization',
                      customer_name: customerName || 'Engineering Director',
                      email: email || 'inquiry@marine-client.com',
                      phone: phone || '+91 98196 01233',
                    });
                  }}
                  className="px-3 py-2 border border-[#B8860B] bg-[#B8860B]/10 hover:bg-[#B8860B] hover:text-white text-[#111113] text-xs mono uppercase tracking-wider font-bold transition cursor-pointer"
                >
                  Preview Official Offer (PDF)
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 border border-black/15 text-xs mono uppercase tracking-wider text-[#111113] hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111113] hover:bg-[#B8860B] text-white mono text-xs uppercase tracking-wider font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Logging to DB...' : 'Submit Quotation Request'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
