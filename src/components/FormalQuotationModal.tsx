import React, { useRef } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Building,
  Anchor,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Download,
} from 'lucide-react';
import { FormalQuotationOffer } from '../types.ts';

interface FormalQuotationModalProps {
  quotation: FormalQuotationOffer;
  onClose: () => void;
}

export const FormalQuotationModal: React.FC<FormalQuotationModalProps> = ({ quotation, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quotation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${quotation.referenceNo.replace(/[^a-zA-Z0-9]/g, '_')}_Techno_Commercial_Offer.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#F8F7F4] max-w-5xl w-full shadow-2xl border border-black/20 my-auto text-[#111113] flex flex-col max-h-[92vh]">
        {/* Top Action Bar (hidden in print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 bg-[#111113] text-white border-b border-black/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#B8860B] text-black">
              <FileText size={16} />
            </div>
            <div>
              <div className="mono text-[10px] text-[#B8860B] font-bold tracking-widest uppercase">
                Official Techno-Commercial Document
              </div>
              <div className="text-sm font-semibold truncate max-w-md">
                {quotation.referenceNo} — {quotation.projectTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs mono uppercase tracking-wider transition cursor-pointer"
              title="Export structured JSON"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#B8860B] hover:bg-[#9a7009] text-black font-bold text-xs mono uppercase tracking-wider transition cursor-pointer"
              title="Print document or save as PDF"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white transition cursor-pointer ml-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Formal Offer Container */}
        <div ref={printRef} className="overflow-y-auto p-6 sm:p-10 space-y-8 bg-white print:p-0 print:space-y-6">
          {/* Header Banner: HPT & Euro Offshore Joint Venture */}
          <div className="border-b-2 border-[#111113] pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#111113] text-[#B8860B] flex items-center justify-center font-bold text-lg">
                    HP
                  </div>
                  <div>
                    <h1 className="font-editorial text-2xl font-bold tracking-tight text-[#111113]">
                      HY-PRECISION TECHNOLOGY
                    </h1>
                    <div className="mono text-[11px] font-semibold tracking-wider text-[#B8860B] uppercase">
                      In Joint Venture with Euro Offshore B.V. (Netherlands)
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-[#111113]/70 leading-relaxed max-w-xl">
                  {quotation.jointVenture.indiaOffice}
                  <br />
                  Email: {quotation.jointVenture.indiaEmail} | Mobile: {quotation.jointVenture.indiaPhone}
                  <br />
                  Regd: {quotation.jointVenture.indiaRegdOffice}
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="inline-flex items-center gap-1.5 bg-black/5 border border-black/15 px-3 py-1 text-[#111113] mono text-[10px] font-bold uppercase mb-2">
                  <Award size={13} className="text-[#B8860B]" />
                  <span>{quotation.jointVenture.isoStandard}</span>
                </div>
                <div className="text-[11px] text-[#111113]/70">
                  <span className="font-bold">European JV Partner:</span>
                  <br />
                  Euro Offshore Group
                  <br />
                  {quotation.jointVenture.netherlandsOffice}
                </div>
              </div>
            </div>

            {/* Reference & Metadata Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F7F4] border border-black/10 p-3.5 mt-6 text-xs">
              <div>
                <span className="mono text-[9px] text-[#111113]/50 uppercase block font-bold">Reference No.</span>
                <span className="mono font-bold text-[#111113] text-sm">{quotation.referenceNo}</span>
              </div>
              <div>
                <span className="mono text-[9px] text-[#111113]/50 uppercase block font-bold">Date</span>
                <span className="mono font-medium text-[#111113]">{quotation.date}</span>
              </div>
              <div>
                <span className="mono text-[9px] text-[#111113]/50 uppercase block font-bold">Customer Ref</span>
                <span className="text-[#111113] truncate block">{quotation.customerReference}</span>
              </div>
              <div>
                <span className="mono text-[9px] text-[#111113]/50 uppercase block font-bold">Validity</span>
                <span className="mono text-[#111113] font-medium">{quotation.commercialTerms.validityDays} Days</span>
              </div>
            </div>
          </div>

          {/* Client Particulars & Transmittal Letter */}
          <div className="space-y-4">
            <div className="bg-white border border-black/10 p-4">
              <span className="mono text-[9px] uppercase font-bold text-[#B8860B] block mb-1">To (Client Particulars)</span>
              <div className="font-editorial text-lg font-bold text-[#111113]">{quotation.client.company}</div>
              <div className="text-xs text-[#111113]/80 mt-1">
                <span className="font-medium">Kind Attention:</span> {quotation.client.contactName}
                <br />
                <span className="font-medium">Address:</span> {quotation.client.address}
                <br />
                <span className="font-medium">Email:</span> {quotation.client.email} | <span className="font-medium">Mobile:</span> {quotation.client.phone}
              </div>
            </div>

            <div>
              <div className="mono text-xs uppercase font-bold text-[#111113]">
                Subject: <span className="text-[#B8860B]">{quotation.projectTitle}</span>
              </div>
              <p className="text-xs text-[#111113]/80 leading-relaxed mt-2">
                Dear Sir / Madam,
                <br />
                With reference to your Request for Quotation ({quotation.customerReference}), we are pleased to submit our comprehensive Techno-Commercial offer for the {quotation.vesselOverview.modelName}, incorporating the proposed project-specific operational requirements and marine safety certifications.
              </p>
            </div>

            {/* Official Project Customization Confirmation Box */}
            <div className="border-l-4 border-[#B8860B] bg-[#B8860B]/10 p-4 text-xs">
              <div className="mono font-bold text-[#B8860B] uppercase tracking-wider text-[11px] mb-1">
                Project Customization Confirmation
              </div>
              <p className="text-[#111113] leading-relaxed italic">
                "{quotation.customizationConfirmation}"
              </p>
            </div>
          </div>

          {/* Section 1: Vessel Overview & Intended Use */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <h2 className="font-editorial text-xl font-bold text-[#111113] flex items-center gap-2">
                <span className="mono text-xs bg-[#111113] text-white px-2 py-0.5">SECTION 1</span>
                Vessel Overview & Operational Envelope
              </h2>
              <span className="mono text-[10px] text-[#111113]/60">Base Platform: {quotation.vesselOverview.basePlatform}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Length Overall (LOA)</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.loa}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Beam Overall (BOA)</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.boa}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Maximum Draft</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.draft}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Max Operational Speed</span>
                <span className="font-bold text-sm text-[#B8860B]">{quotation.vesselOverview.maxSpeed}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Crew / Passengers</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.crewPassengerCapacity}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Hull Material</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.hullMaterial}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Fuel Capacity</span>
                <span className="font-bold text-sm text-[#111113]">{quotation.vesselOverview.fuelCapacity}</span>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-black/10">
                <span className="mono text-[9px] text-[#111113]/50 uppercase block">Classification / Code</span>
                <span className="font-bold text-sm text-[#111113] truncate block" title={quotation.vesselOverview.classCertification}>
                  {quotation.vesselOverview.classCertification}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Structured 22-Point Technical Specification Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <h2 className="font-editorial text-xl font-bold text-[#111113] flex items-center gap-2">
                <span className="mono text-xs bg-[#111113] text-white px-2 py-0.5">SECTION 2</span>
                Required Technical Specification & Scope Matrix (22 Points)
              </h2>
              <span className="mono text-[10px] text-[#B8860B] font-bold">100% Scope Compliance</span>
            </div>

            <div className="overflow-x-auto border border-black/15">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#111113] text-white mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-48">Parameter / System</th>
                    <th className="py-2.5 px-3">Client Specification Requirement</th>
                    <th className="py-2.5 px-3 w-24 text-center">Scope Included</th>
                    <th className="py-2.5 px-3">Engineering Comments & Standards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {quotation.technicalMatrix.map((row) => (
                    <tr key={row.itemNumber} className="hover:bg-black/5 transition">
                      <td className="py-2.5 px-3 text-center mono font-bold text-[#111113]/50">
                        {row.itemNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#111113]">
                        {row.parameter}
                      </td>
                      <td className="py-2.5 px-3 text-[#111113]/80 leading-relaxed">
                        {row.requirement}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 mono text-[10px] font-bold">
                          <CheckCircle size={11} /> YES
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#111113]/70 italic text-[11px]">
                        {row.comments}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Commercial Offer Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <h2 className="font-editorial text-xl font-bold text-[#111113] flex items-center gap-2">
                <span className="mono text-xs bg-[#111113] text-white px-2 py-0.5">SECTION 3</span>
                Techno-Commercial Offer & Pricing Schedule
              </h2>
              <span className="mono text-[10px] text-[#111113]/60">Currency: {quotation.commercialOffer.currency}</span>
            </div>

            <div className="overflow-x-auto border border-black/15 bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#111113] text-white mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 w-32 text-center">Scope Status</th>
                    <th className="py-2.5 px-3 w-36 text-right">Unit Price ({quotation.commercialOffer.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#111113]">
                      Base Vessel Platform: {quotation.vesselOverview.modelName} (Turnkey with standard engines & controls)
                    </td>
                    <td className="py-2.5 px-3 text-center mono text-emerald-700 font-bold">INCLUDED</td>
                    <td className="py-2.5 px-3 text-right mono font-bold">
                      ${quotation.commercialOffer.baseVesselPrice.toLocaleString()}
                    </td>
                  </tr>

                  {quotation.commercialOffer.options.map((opt, idx) => (
                    <tr key={idx} className="bg-[#F8F7F4]/50">
                      <td className="py-2 px-3 text-[#111113]/80">
                        + {opt.description}
                      </td>
                      <td className="py-2 px-3 text-center mono text-emerald-700 text-[11px]">INCLUDED</td>
                      <td className="py-2 px-3 text-right mono text-[#111113]">
                        ${opt.price.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td className="py-2 px-3 text-[#111113]/80">
                      + Recommended 1-Year Operational & Mechanical Spares Package (Filters, impellers, seals, zinc anodes)
                    </td>
                    <td className="py-2 px-3 text-center mono text-emerald-700 text-[11px]">INCLUDED</td>
                    <td className="py-2 px-3 text-right mono text-[#111113]">
                      ${quotation.commercialOffer.sparesPackagePrice.toLocaleString()}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 text-[#111113]/80">
                      + Heavy-Duty Steel Transport & Storage Cradle with Export Sea Fastening & Heat-Shrink Wrapping
                    </td>
                    <td className="py-2 px-3 text-center mono text-emerald-700 text-[11px]">INCLUDED</td>
                    <td className="py-2 px-3 text-right mono text-[#111113]">
                      ${quotation.commercialOffer.cradleAndPackingPrice.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="bg-[#111113] text-white font-bold">
                    <td className="py-3 px-3 mono text-sm uppercase">
                      Total Ex-Works Commercial Offer
                    </td>
                    <td className="py-3 px-3 text-center mono text-xs text-[#B8860B]">EX-WORKS WORKS THANE</td>
                    <td className="py-3 px-3 text-right mono text-base text-[#B8860B]">
                      ${quotation.commercialOffer.totalExWorks.toLocaleString()} {quotation.commercialOffer.currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Commercial Terms & Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <h2 className="font-editorial text-xl font-bold text-[#111113] flex items-center gap-2">
                <span className="mono text-xs bg-[#111113] text-white px-2 py-0.5">SECTION 4</span>
                Commercial Terms & Conditions
              </h2>
              <span className="mono text-[10px] text-[#111113]/60">ISO 9001:2015 Approved Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#F8F7F4] border border-black/10 p-4 space-y-2.5">
                <h3 className="mono font-bold text-[#B8860B] uppercase text-[11px]">
                  1. Delivery Terms & Lead Time
                </h3>
                <p className="text-[#111113]/80 leading-relaxed">
                  <span className="font-semibold text-[#111113]">Delivery Terms:</span> {quotation.commercialTerms.deliveryTerms}.
                  <br />
                  <span className="font-semibold text-[#111113]">Lead Time:</span> {quotation.commercialTerms.deliveryTimeWeeks}.
                </p>

                <h3 className="mono font-bold text-[#B8860B] uppercase text-[11px] pt-2">
                  2. Warranty & Guarantee
                </h3>
                <p className="text-[#111113]/80 leading-relaxed">
                  {quotation.commercialTerms.warranty} Full worldwide technical support guaranteed by Hy-Precision Technology and Euro Offshore B.V.
                </p>

                <h3 className="mono font-bold text-[#B8860B] uppercase text-[11px] pt-2">
                  3. Classification & Regulatory
                </h3>
                <p className="text-[#111113]/80 leading-relaxed">
                  {quotation.commercialTerms.classApproval}
                </p>
              </div>

              {/* Milestone Payment Schedule */}
              <div className="bg-[#F8F7F4] border border-black/10 p-4 space-y-2">
                <h3 className="mono font-bold text-[#B8860B] uppercase text-[11px]">
                  4. Payment Milestone Schedule (30 / 30 / 30 / 10)
                </h3>
                <div className="space-y-2 pt-1">
                  {quotation.commercialTerms.paymentMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white p-2.5 border border-black/10">
                      <div className="w-10 h-8 bg-[#111113] text-[#B8860B] mono font-bold flex items-center justify-center text-xs shrink-0">
                        {m.percentage}%
                      </div>
                      <div className="text-[11px] text-[#111113]">
                        <span className="font-bold text-[#111113] block">{m.milestone}</span>
                        <span className="text-[#111113]/70">{m.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Site Services & Supervision Rate Schedule */}
            <div className="bg-white border border-black/15 p-4 text-xs">
              <h3 className="mono font-bold text-[#111113] uppercase text-xs mb-2 flex items-center justify-between">
                <span>Site Services & Commissioning Supervision Rate Schedule (EUR)</span>
                <span className="text-[#B8860B] font-normal">Optional Field Engineering Assistance</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="p-3 bg-[#F8F7F4] border border-black/10">
                  <span className="mono text-[9px] text-[#111113]/50 uppercase block">Standard Working Day (8h)</span>
                  <span className="mono font-bold text-sm text-[#111113]">
                    €{quotation.commercialTerms.siteServices.standardDailyRateEur} / Day / Engineer
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F4] border border-black/10">
                  <span className="mono text-[9px] text-[#111113]/50 uppercase block">Weekend & Public Holidays</span>
                  <span className="mono font-bold text-sm text-[#111113]">
                    €{quotation.commercialTerms.siteServices.weekendDailyRateEur} / Day / Engineer
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F4] border border-black/10">
                  <span className="mono text-[9px] text-[#111113]/50 uppercase block">International Travel Days</span>
                  <span className="mono font-bold text-sm text-[#111113]">
                    {quotation.commercialTerms.siteServices.travelRatePercent}% of Standard Day Rate
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#111113]/70 italic">
                {quotation.commercialTerms.siteServices.logisticsTerms}
              </p>
            </div>
          </div>

          {/* Signatures & Execution Section */}
          <div className="pt-6 border-t-2 border-[#111113] grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <div>
              <div className="mono text-[10px] text-[#111113]/60 uppercase font-bold mb-8">
                Submitted on behalf of Hy-Precision Technology & Euro Offshore Joint Venture:
              </div>
              <div className="space-y-1">
                <div className="font-editorial text-lg font-bold text-[#111113]">
                  {quotation.signatures.preparedBy}
                </div>
                <div className="mono text-[11px] text-[#B8860B] font-semibold">
                  {quotation.signatures.preparedTitle}
                </div>
                <div className="text-[10px] text-[#111113]/50">
                  Works: Bhiwandi - Thane, Maharashtra, India & Werkendam, The Netherlands
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-black/15 md:pl-8 pt-4 md:pt-0">
              <div className="mono text-[10px] text-[#111113]/60 uppercase font-bold mb-8">
                Client Acceptance & Confirmation of Order:
              </div>
              <div className="space-y-3">
                <div className="border-b border-dashed border-black/30 pb-2">
                  <span className="text-[10px] text-[#111113]/50 block">Authorized Signatory Name & Designation:</span>
                </div>
                <div className="border-b border-dashed border-black/30 pb-2">
                  <span className="text-[10px] text-[#111113]/50 block">Company Stamp / Seal & Date:</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
