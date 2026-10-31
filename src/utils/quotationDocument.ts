import { ProductItem, FormalQuotationOffer, QuotationRequestItem, TechnicalSpecMatrixRow } from '../types.ts';

export const JOINT_VENTURE_DETAILS = {
  companyName: 'Hy-Precision Technology',
  partnerName: 'Euro Offshore B.V.',
  indiaOffice: 'Survey No-23/2/1, Unit No-4, Sector II A, Vashere Village, Dist.- Thane, Tal- Bhiwandi, 421301, M.S., India',
  indiaPhone: '+91 9819601233 / +91 8956282396',
  indiaEmail: 'naresh@hyprecisiontechnology.com',
  indiaRegdOffice: 'Bhumi World, Building # D8, Unit # 236, Near Kalyan-Bhiwandi Junction, PO: Pimplasa, Tal: Bhiwandi, Dist Thane, Maharashtra India, Pin 421302',
  netherlandsOffice: 'Beatrixhaven 19, 4251 NK Werkendam, The Netherlands',
  isoStandard: 'ISO 9001:2015 Certified Joint Venture',
};

/**
 * Generate a formal quotation reference number following HPT standard format:
 * HPT/[REF_ID]/[MONTH]/[YEAR] R0
 */
export function generateQuotationRefNumber(seedId?: string): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const num = seedId
    ? seedId.replace(/\D/g, '').slice(-3) || '256'
    : Math.floor(100 + Math.random() * 900).toString();
  return `HPT/${num}/${month}/${year} R0`;
}

/**
 * Build the complete 22-item Technical Specification Matrix as per sample quotation PDF
 */
export function buildTechnicalSpecMatrix(product: ProductItem): TechnicalSpecMatrixRow[] {
  const getSpec = (key: string, fallback: string) => {
    const found = product.specifications?.find(
      (s) => s.key.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(s.key.toLowerCase())
    );
    return found ? `${found.value} ${found.unit || ''}`.trim() : fallback;
  };

  const hullMat = getSpec('material', 'Marine Grade Aluminium 5083-H111');
  const loa = getSpec('length', '5.50 Meters');
  const boa = getSpec('beam', '2.10 Meters');
  const draft = getSpec('draft', '0.35 Meters');
  const engines = getSpec('engine', 'Outboard Marine Petrol / Diesel Waterjet');
  const speed = getSpec('speed', '30 - 38 Knots');
  const capacity = getSpec('capacity', '6 Persons');
  const certs = product.certifications?.join(', ') || 'ISO 9001:2015, CE Category C/B';

  return [
    {
      itemNumber: 1,
      parameter: 'General Vessel Purpose & Architecture',
      requirement: 'Multi-role littoral patrol, port surveillance, crew transfer, and search & rescue (SAR) operations in coastal and inland waters.',
      included: true,
      comments: `Compliant with operational scope; heavy-duty sea-keeping hull based on proven ${product.title} platform.`,
    },
    {
      itemNumber: 2,
      parameter: 'Hull Material & Structural Fabrication',
      requirement: `Constructed from ${hullMat}. Plate thicknesses: bottom 5mm, sides 4mm, transom 6mm with longitudinal stringers and transverse web frames.`,
      included: true,
      comments: 'Full continuous marine-certified welding under strict ISO 9001:2015 quality control.',
    },
    {
      itemNumber: 3,
      parameter: 'Buoyancy, Sub-division & Stability',
      requirement: 'Self-bailing cockpit deck with polyurethane closed-cell positive buoyancy foam filling void spaces. Multi-compartment watertight bulkheads.',
      included: true,
      comments: 'Provides guaranteed reserve buoyancy and positive stability under swamped/flooded condition.',
    },
    {
      itemNumber: 4,
      parameter: 'Fender System & Impact Protection',
      requirement: 'Heavy-duty D-section elastomer rubber / polyurea foam-filled impact fendering around entire gunwale perimeter.',
      included: true,
      comments: 'Designed for aggressive ship-to-ship boarding and quay transfers without hull abrasion.',
    },
    {
      itemNumber: 5,
      parameter: 'Console, Superstructure & Glazing',
      requirement: 'Center steering console / ergonomic wheelhouse with toughened safety glass, grab rails, and protective windscreen.',
      included: true,
      comments: 'Includes dual marine windscreen wipers with fresh water washer system on enclosed cabin models.',
    },
    {
      itemNumber: 6,
      parameter: 'Main Propulsion & Marine Machinery',
      requirement: `Specified Marine Engine: ${engines}. Electric start, power trim and tilt, stainless steel propeller.`,
      included: true,
      comments: 'Turnkey installation with remote control box, tachometer, trim gauge, and kill switch safety lanyard.',
    },
    {
      itemNumber: 7,
      parameter: 'Steering & Throttle System',
      requirement: 'Heavy-duty hydraulic steering helm unit with stainless steel marine steering wheel and high-pressure flex lines.',
      included: true,
      comments: 'Zero-backlash precision steering engineered for extreme maneuvers at high speeds.',
    },
    {
      itemNumber: 8,
      parameter: 'Fuel Tankage, Filtration & Venting',
      requirement: 'Integrated marine-grade fuel tank with electric fuel level sender, anti-siphon valve, and Racor water-separating fuel filter skid.',
      included: true,
      comments: 'Includes emergency fuel shut-off valve accessible from the helm deck.',
    },
    {
      itemNumber: 9,
      parameter: 'Bilge Pumping & Deck Drainage',
      requirement: 'Dual automatic heavy-duty electric submersible bilge pumps (2x 1500 GPH) with manual override and emergency hand diaphragm pump.',
      included: true,
      comments: 'Independent float switches with audio-visual alarm at the operator helm console.',
    },
    {
      itemNumber: 10,
      parameter: 'Electrical Installation & DC Distribution',
      requirement: '24V / 12V DC two-wire isolated electrical system with tinned copper marine cabling and dual AGM battery bank with rotary selector switch.',
      included: true,
      comments: 'Includes IP67 waterproof circuit breaker switchboard and 230V AC shore power inlet with Mastervolt charger.',
    },
    {
      itemNumber: 11,
      parameter: 'Navigation Lights & High-Output Searchlight',
      requirement: 'IMO COLREG-compliant LED navigation lights (Port, Starboard, All-Round White Stern) and remote-controlled 360° LED searchlight.',
      included: true,
      comments: 'Mounted on heavy-duty radar arch / mast for maximum visibility.',
    },
    {
      itemNumber: 12,
      parameter: 'VHF Marine Radio & Communications',
      requirement: 'Fixed-mount Class D DSC VHF marine transceiver with emergency distress button and 1.2m fibreglass antenna.',
      included: true,
      comments: 'Pre-wired and integrated into primary DC busbar with noise suppression filter.',
    },
    {
      itemNumber: 13,
      parameter: 'Navigation Chartplotter & Echo Sounder',
      requirement: 'Marine multifunction GPS / chartplotter display (Simrad / Garmin 9-inch) with through-hull depth / temperature transducer.',
      included: true,
      comments: 'Pre-loaded with regional electronic navigation charts.',
    },
    {
      itemNumber: 14,
      parameter: 'Mooring, Towing & Deck Hardware',
      requirement: 'Heavy-duty bow Samson towing post, 4x welded mooring bollards, stainless steel bow eye, and aft transom towing bollards.',
      included: true,
      comments: 'Engineered for emergency towing and shipside line handling.',
    },
    {
      itemNumber: 15,
      parameter: 'Lifting Pad Eyes, Slings & Transport Cradle',
      requirement: 'Certified 4-point lifting lugs integrated directly into structural frames, equipped with certified 4-leg wire rope lifting sling.',
      included: true,
      comments: 'Proof load tested to 2.5x SWL with formal third-party test certificate for offshore crane hoisting.',
    },
    {
      itemNumber: 16,
      parameter: 'Seating & Operator Ergonomics',
      requirement: 'High-comfort ergonomic marine seats with folding bolster / Ullman shock-mitigating suspension jockey seating for crew safety.',
      included: true,
      comments: 'Prevents spinal fatigue during high-impact wave impacts.',
    },
    {
      itemNumber: 17,
      parameter: 'Lifesaving & Fire Fighting Package',
      requirement: 'SOLAS-compliant lifebuoys with 30m buoyant lifeline, 2x 2kg dry chemical powder fire extinguishers, and emergency first aid medical pack.',
      included: true,
      comments: 'Mounted in quick-release deck brackets.',
    },
    {
      itemNumber: 18,
      parameter: 'Surface Treatment, Coating & Anodes',
      requirement: 'Marine epoxy tie-coat and polyurethane topside finish. Antifouling paint below the waterline and sacrificial zinc/aluminium hull anodes.',
      included: true,
      comments: 'Surface prepped to Sa 2.5 standard for 10+ years corrosion resistance.',
    },
    {
      itemNumber: 19,
      parameter: 'Factory Acceptance Testing & Sea Trials',
      requirement: 'Complete dock trials (electrical, engine running, bilge pump check) followed by 4-hour high-speed open water sea trial.',
      included: true,
      comments: 'Formal Sea Trial Acceptance Certificate and speed/bollard pull test report provided upon completion.',
    },
    {
      itemNumber: 20,
      parameter: 'Drawings, Documentation & Technical Manuals',
      requirement: '2x sets of comprehensive Operator & Maintenance Manuals, electrical line diagrams, stability booklet, and equipment warranty cards.',
      included: true,
      comments: 'Delivered in both English hard-bound folders and encrypted digital USB format.',
    },
    {
      itemNumber: 21,
      parameter: 'Classification, Standards & Certification',
      requirement: `Delivered fully compliant with ${certs}. Third-party survey and CE mark or RINA / IACS class approval certificate.`,
      included: true,
      comments: 'Builder Certificate and Declaration of Conformity issued directly by HPT & Euro Offshore.',
    },
    {
      itemNumber: 22,
      parameter: 'Warranty Policy & After-Sales Support',
      requirement: '18 months warranty on hull structure from date of dispatch or 12 months from vessel commissioning (whichever occurs first).',
      included: true,
      comments: 'Engine manufacturer international warranty applicable (typically 24 to 36 months). Euro Offshore global spares support.',
    },
  ];
}

/**
 * Generate the comprehensive FormalQuotationOffer object matching PDF sample
 */
export function generateFormalQuotationOffer(
  product: ProductItem,
  rfq?: Partial<QuotationRequestItem>
): FormalQuotationOffer {
  const getSpec = (key: string, fallback: string) => {
    const found = product.specifications?.find(
      (s) => s.key.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(s.key.toLowerCase())
    );
    return found ? `${found.value} ${found.unit || ''}`.trim() : fallback;
  };

  const refNo = rfq?.reference_no || generateQuotationRefNumber(rfq?.id || product.id);
  const dateFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const basePrice = product.price_usd || 45000;
  const options = [
    { description: 'Integrated Simrad Halo20+ Radar & 9-inch Chartplotter Suite', price: 6800, included: true },
    { description: 'Certified 4-Leg Heavy Duty Wire Rope Lifting Slings (Load Tested)', price: 1850, included: true },
    { description: 'Shock-mitigating Ullman / Grammer Marine Seating Upgrade', price: 3400, included: true },
    { description: 'Dual Battery Bank with Mastervolt 230V AC Shore Charger', price: 2100, included: true },
  ];

  const optionsTotal = options.filter((o) => o.included).reduce((acc, o) => acc + o.price, 0);
  const sparesPackagePrice = Math.round(basePrice * 0.08); // 8% recommended 1-year spares
  const cradleAndPackingPrice = 3200; // Sea export steel cradle and shrink wrap
  const totalExWorks = basePrice + optionsTotal + sparesPackagePrice + cradleAndPackingPrice;

  return {
    referenceNo: refNo,
    date: dateFormatted,
    customerReference: rfq?.id ? `RFQ / Ref ${rfq.id}` : `Customer Inquiry dated ${dateFormatted}`,
    projectTitle: `Supply of ${product.title}`,
    client: {
      company: rfq?.company_name || 'Ministry of Transport & Maritime Administration',
      contactName: rfq?.customer_name || 'Procurement & Engineering Directorate',
      email: rfq?.email || 'procurement@maritime-authority.gov',
      phone: rfq?.phone || '+91 98765 43210',
      address: 'Central Port Complex, Naval Dockyard District',
    },
    jointVenture: { ...JOINT_VENTURE_DETAILS },
    customizationConfirmation: `We hereby confirm that the existing ${product.title} (SKU: ${product.sku}) will serve as the base platform for this project. The vessel will be customized to meet the technical specifications and operational requirements outlined in this offer, subject to engineering assessment, and mutual approval of the final design by the concerned parties.`,
    vesselOverview: {
      modelName: product.title,
      intendedUse: 'Patrol, Port Surveillance, Search & Rescue (SAR), Offshore Windfarm Support & Military Interdiction',
      basePlatform: product.sku,
      loa: getSpec('length', '5.50 Meters'),
      boa: getSpec('beam', '2.10 Meters'),
      draft: getSpec('draft', '0.35 Meters'),
      lightDisplacement: getSpec('displacement', '850 kg'),
      fullLoadDisplacement: getSpec('load', '1,800 kg'),
      maxSpeed: getSpec('speed', '32 Knots'),
      cruisingSpeed: '24 Knots',
      fuelCapacity: getSpec('fuel', '150 Liters'),
      range: getSpec('range', '180 Nautical Miles @ 22 Knots'),
      crewPassengerCapacity: getSpec('capacity', '6 Persons'),
      hullMaterial: getSpec('material', 'Marine Grade Aluminium 5083-H111'),
      classCertification: product.certifications?.join(', ') || 'ISO 9001:2015, CE Category C/B, RINA',
    },
    technicalMatrix: buildTechnicalSpecMatrix(product),
    commercialOffer: {
      baseVesselPrice: basePrice,
      options,
      sparesPackagePrice,
      cradleAndPackingPrice,
      totalExWorks,
      currency: 'USD',
    },
    commercialTerms: {
      deliveryTerms: 'Ex-Works Thane Works (Maharashtra, India) / CIF Destination Port on request',
      deliveryTimeWeeks: `${Math.round(product.lead_time_days / 7) || 12} - 16 weeks from receipt of technically clear Purchase Order and advance payment`,
      paymentMilestones: [
        {
          milestone: 'Advance Payment',
          percentage: 30,
          description: '30% advance on formal placement of Purchase Order and signing of contract.',
        },
        {
          milestone: 'Hull Structure Completion',
          percentage: 30,
          description: '30% upon completion of aluminium / composite hull fabrication and structural inspection.',
        },
        {
          milestone: 'Engine Installation & Sea Trials',
          percentage: 30,
          description: '30% on completion of mechanical installation and readiness for customer Sea Acceptance Trials (SAT).',
        },
        {
          milestone: 'Dispatch & Shipping Documents',
          percentage: 10,
          description: '10% against copy of final shipping documents, Bill of Lading, and Factory Acceptance sign-off.',
        },
      ],
      warranty: '18 months from delivery or 12 months from commissioning, whichever occurs first.',
      classApproval: 'RINA / IACS / CE Class Declaration of Conformity and Builder Certificate.',
      siteServices: {
        standardDailyRateEur: 1200,
        weekendDailyRateEur: 1800,
        travelRatePercent: 50,
        logisticsTerms: 'Client shall provide round-trip business airfare, 4-star hotel accommodation, local transportation, security clearance, and visa sponsorship for HPT / Euro Offshore commissioning engineers.',
      },
      validityDays: 60,
    },
    signatures: {
      preparedBy: 'Naresh K.',
      preparedTitle: 'Technical Director, Hy-Precision Technology & Euro Offshore JV',
      approvedBy: 'Managing Director',
      approvedTitle: 'Euro Offshore Group & HPT Joint Venture Executive Board',
    },
  };
}
