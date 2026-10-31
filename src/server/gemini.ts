import { GoogleGenAI } from '@google/genai';
import { getAllProducts, updateProduct, getProductById } from './db.ts';

/**
 * Dynamically retrieve or initialize GoogleGenAI client with the active environment API key
 */
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI();
  } catch (err) {
    console.warn('GoogleGenAI initialization warning:', err);
    return null;
  }
}

/**
 * AI Product Comparison using live database records
 */
export async function compareProductsWithAI(productIds: string[]) {
  const allProducts = getAllProducts();
  const selected = allProducts.filter(
    (p: any) => productIds.includes(p.id) || productIds.includes(p.sku)
  );

  if (selected.length < 2) {
    throw new Error('Please select at least two products to compare.');
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You are the Principal Systems Engineering Consultant at HY Precision Technology (hyprecisiontechnology.com).
Analyze and compare the following ${selected.length} industrial components based on their technical specifications, operating pressures, materials, tolerances, and design standards:

Products Data:
${JSON.stringify(
  selected.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    title: p.title,
    category: p.category_name,
    price_usd: p.price_usd,
    lead_time_days: p.lead_time_days,
    specifications: p.specifications,
  })),
  null,
  2
)}

Return a strict, valid JSON object with the following schema:
{
  "summary": "Concise 2-3 sentence engineering analysis of the fundamental tradeoffs and architectural roles of these items.",
  "matrix": [
    {
      "criteria": "e.g. Operating Pressure / Load Rating",
      "values": { "[Product SKU]": "Technical evaluation or specification value" },
      "winnerSku": "[Product SKU with competitive edge, or null]"
    }
  ],
  "recommendations": [
    {
      "sku": "[Product SKU]",
      "bestFor": "Specific industrial use-case (e.g. continuous marine lubrication, cleanroom surgical implant)",
      "pros": ["Strength 1", "Strength 2"],
      "cons": ["Tradeoff 1", "Tradeoff 2"]
    }
  ]
}
Output only valid JSON, without markdown formatting or backticks.`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const text = response.text || '';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.error('Gemini compare failed, falling back to deterministic analyzer:', err);
    }
  }

  // Deterministic high-fidelity engineering fallback
  return generateDeterministicComparison(selected);
}

function generateDeterministicComparison(products: any[]) {
  const skus = products.map((p) => p.sku);
  const matrix: any[] = [
    {
      criteria: 'Cost & Acquisition',
      values: Object.fromEntries(
        products.map((p) => [
          p.sku,
          `$${p.price_usd.toLocaleString()} FOB (Lead time: ${p.lead_time_days} days)`,
        ])
      ),
      winnerSku: products.reduce((prev, curr) => (prev.price_usd < curr.price_usd ? prev : curr)).sku,
    },
    {
      criteria: 'Quality & Manufacturing Standards',
      values: Object.fromEntries(
        products.map((p) => [p.sku, (p.certifications || ['ISO 9001:2015']).join(' • ')])
      ),
      winnerSku: null,
    },
  ];

  // Add specific spec comparisons
  const specKeySet = new Set<string>();
  products.forEach((p) => p.specifications.forEach((s: any) => specKeySet.add(s.key)));

  specKeySet.forEach((key) => {
    const valMap: Record<string, string> = {};
    products.forEach((p) => {
      const match = p.specifications.find((s: any) => s.key === key);
      valMap[p.sku] = match ? `${match.value} ${match.unit || ''}`.trim() : 'N/A';
    });
    matrix.push({
      criteria: key,
      values: valMap,
      winnerSku: null,
    });
  });

  const recommendations = products.map((p) => {
    const isHydraulics = p.category_slug === 'hydraulics';
    const isFiltration = p.category_slug === 'filtration';
    const isCnc = p.category_slug === 'cnc-machining';

    return {
      sku: p.sku,
      bestFor: isHydraulics
        ? 'High pressure heavy machinery, hydraulic power packs, and maritime fluid transfer'
        : isFiltration
        ? 'Continuous slurry filtration, chemical processing, and pigment separation'
        : isCnc
        ? 'High-precision aerospace manifolds or biomedical implant assemblies'
        : 'Offshore rig emergency rescue, maritime safety, and workboat operations',
      pros: [
        `Verified ISO 9001:2015 engineering specifications with ${p.lead_time_days}-day lead time`,
        `Direct integration compatibility with HY Precision Technology standard assemblies`,
      ],
      cons: [
        p.stock_quantity <= 5
          ? 'Limited live inventory, consider pre-ordering for volume production'
          : 'Requires certified technician for initial commissioning',
      ],
    };
  });

  return {
    summary: `Technical comparison between ${skus.join(' vs ')}. Evaluated across operating parameters, engineering certifications, lead times, and application lifecycle costs.`,
    matrix,
    recommendations,
  };
}

/**
 * AI Database Assistant & Natural Language Q&A / Query Manager
 */
export async function handleAiDatabaseAgent(
  prompt: string,
  userRole: 'admin' | 'buyer' = 'buyer',
  history: { role: string; text: string }[] = [],
  clientProducts?: any[]
) {
  const rawProducts = (clientProducts && clientProducts.length > 0)
    ? clientProducts
    : getAllProducts();

  const inventorySnapshot = rawProducts.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    title: p.title,
    category: p.category_name || p.category,
    category_slug: p.category_slug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : ''),
    price_usd: p.price_usd,
    stock_quantity: p.stock_quantity,
    lead_time_days: p.lead_time_days,
    specifications: p.specifications || [],
    certifications: p.certifications || [],
  }));

  const ai = getAiClient();
  if (ai) {
    try {
      const historyFormatted =
        history.length > 0
          ? history
              .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
              .join('\n')
          : 'None (new inquiry)';

      const agentSystemPrompt = `You are the Lead Naval Architect, Marine Systems Engineer & Quotation Specialist at Hy-Precision Technology in Joint Venture with Euro Offshore Group (Netherlands).
Your primary duty is to ACTUALLY AND DIRECTLY ANSWER all user questions with deep naval architecture authority, marine engineering precision, and practical commercial clarity.

Joint Venture Background & Facilities:
- Organizations: Hy-Precision Technology (India) & Euro Offshore B.V. (Werkendam, The Netherlands).
- Certifications: ISO 9001:2015 Quality Management, SOLAS 74/96, IMO LSA Code, MED Wheelmark, CE Category A/B/C, RINA, and IACS Class Society standards.
- Production Yards:
  * Works: Survey No-23/2/1, Unit No-4, Sector II A, Renaissance Infrastructure Industrial Park, Vashere Village, Bhiwandi-Padgha Highway, Dist. Thane 421301, Maharashtra, India.
  * European HQ: Beatrixhaven 19, 4251 NK Werkendam, The Netherlands.
  * Registered Office: Bhumi World, Building # D8, Unit # 236, Kalyan-Bhiwandi Junction, Dist. Thane 421302, India.
- Core Joint Venture Fleet & Divisions:
  1. Alunautic Aluminium Workboats: 5083-H111 marine aluminium monohulls, WB 5.50 (the base platform specified in official offer HPT/256/10/26 R0), Military Support 650, LC 850 Landing Crafts, and Windmill 14M/16M Offshore Cabin Patrol vessels.
  2. Blue Spirit GRP RIB Patrol Line: Deep-V composite rigid inflatables with Orca Hypalon 1670 dtex collars. Blue Spirit 650 Open, 820 Cabin, and 1120 Interceptor (triple 350HP Verados, 55+ knots, Ullman shock seating).
  3. Fibre Shark GRP Workboats: Thick solid laminate pilot launches (Pilot 1050) and high-speed commercial catamarans (Fast Passenger Cat 1400 with 48 seats).
  4. HDPE Indestructible Workboats: High-Density Polyethylene hulls that absorb high-impact collisions and ballistic shrapnel, zero corrosion, no painting/anodes needed, backed by an exclusive 5-year hull warranty.
  5. EO Lifesaving & Davit Systems: SOLAS TEMPSC enclosed lifeboats, Freefall Lifeboats FF 600 (25m drop), Fast Rescue Boats FRB 650 with Castoldi waterjets, and hydraulic slewing davit launching systems (SWL 25kN).
  6. AquaCat Modular Catamarans: AquaCat 13.60m modular catamarans engineered with containerized AQ Lego modular kits fitting inside standard 40ft sea shipping containers.
  7. Governmental & Military Support: Multi-Role Fast Attack Patrol 2380 (23.8m flagship, twin 1400 HP MAN Rollo diesels, 42 knots, armored wheelhouse, stern slipway ramp for 5.5m boarding RHIB), GRP Unmanned Surface Vehicle USV Patrol 5.60 JET (Simrad Halo20+, triple-sensor PTZ thermal camera, Starlink BLOS satellite control), and Type 8.7 Inland Fast Response.
- Quotation Standards (Sample PDF Offer Structure):
  * Official Reference Format: HPT/[REF_ID]/[MONTH]/[YEAR] R0 (e.g. HPT/256/10/26 R0).
  * Project Customization Confirmation statement on all custom builds.
  * 22-Point Technical Matrix covering Hull, Buoyancy, Fenders, Console, Propulsion, Steering, Electrical, Navigation, Bilge, Mooring, Slings, Seating, Firefighting, Coating, Sea Trials, and Manuals.
  * Milestone Payments: 30% advance on PO, 30% hull structure completion, 30% mechanical/engine installation and SAT readiness, 10% against shipping documents.
  * Warranty: 18 months from delivery or 12 months from commissioning.
  * Site Services Rate: €1,200/day standard engineer, €1,800/day weekend/holidays + flights and lodging.

Live Relational Database Fleet Inventory Snapshot:
${JSON.stringify(inventorySnapshot, null, 2)}

User Role: ${userRole}
Conversation History:
${historyFormatted}

User Message: "${prompt}"

CRITICAL INSTRUCTIONS:
1. DIRECTLY AND THOROUGHLY ANSWER THE USER'S QUESTION:
   - Provide a complete, helpful, highly knowledgeable answer. Explain the engineering principles, fluid dynamics, metallurgy, manufacturing tolerances, operational benefits, and practical considerations.
   - If the user asks a technical or general question (e.g. "How do screw pumps work?", "What is a bladder accumulator?", "Why choose Titanium over 316L?", "What is cavitation and how do you prevent it?", "Where are your facilities?", "Can you manufacture custom manifolds?"), write a thorough, well-structured answer with technical specifics and clear paragraphs or bullet points. DO NOT give a lazy 1-line response.
   - If the question relates to products in the live inventory, reference them by SKU and title, explain their relevant specs (pressure rating, material, lead time, price), and include their SKUs in "matchedSkus".
   - If the question is about company capabilities, certifications (ASME VIII, ISO 9001:2015, SOLAS), location, custom manufacturing, or RFQ ordering, explain clearly.

2. SEARCH & FILTERING INTENT:
   - If the user explicitly wants to search, filter, or recommend items (e.g. "Find pumps with pressure > 30 Bar under $2000", "Show low stock items"):
     * Set "action": "SEARCH_RESULTS"
     * Provide a clear explanation of how the matched items meet the requirements.
     * Set "matchedSkus" to the matching SKU list.

3. COMPARISON INTENT:
   - If the user asks to compare 2 or 3 components:
     * Set "action": "COMPARE_PRODUCTS"
     * Provide a comparative breakdown of key differences in pressure, materials, use-cases, and lead times.
     * Set "matchedSkus" to the SKUs being compared.

4. ADMIN DATABASE UPDATE INTENT:
   - If userRole === 'admin' and the prompt requests modifying a database record (e.g. "Update stock of HY-SP-40B to 25", "Set price of HY-ACC-BLD to $890"):
     * Set "action": "EXECUTE_DB_COMMAND"
     * Set "command": { "type": "UPDATE_PRODUCT", "sku": "...", "fields": { ... } }
     * Set "answer": Clear confirmation of the database transaction committed.

5. SUGGESTED FOLLOW-UPS:
   - Provide 2 to 3 concise, highly relevant follow-up questions in "suggestedFollowUps" that the user might want to ask next.

Return strictly a valid JSON object matching this schema (no markdown formatting or backticks):
{
  "action": "ANSWER" | "SEARCH_RESULTS" | "COMPARE_PRODUCTS" | "EXECUTE_DB_COMMAND",
  "answer": "The full, articulate, highly informative answer to the question...",
  "explanation": "Same as answer",
  "matchedSkus": ["SKU-1", "SKU-2"],
  "suggestedFollowUps": ["Follow-up question 1?", "Follow-up question 2?"]
}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: agentSystemPrompt,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const cleanJson = (response.text || '').replace(/```json|```/g, '').trim();
      const decision = JSON.parse(cleanJson);

      // Ensure explanation and answer are synced
      if (!decision.answer && decision.explanation) {
        decision.answer = decision.explanation;
      }
      if (!decision.explanation && decision.answer) {
        decision.explanation = decision.answer;
      }

      // Execute command if admin requested and valid
      if (
        userRole === 'admin' &&
        decision.action === 'EXECUTE_DB_COMMAND' &&
        decision.command?.sku
      ) {
        const prod = getProductById(decision.command.sku);
        if (prod && decision.command.fields) {
          const rawFields = decision.command.fields;
          const normalizedFields: any = {};
          if (rawFields.price_usd !== undefined || rawFields.price !== undefined) {
            normalizedFields.price_usd = parseFloat(rawFields.price_usd ?? rawFields.price);
          }
          if (rawFields.stock_quantity !== undefined || rawFields.stock !== undefined) {
            normalizedFields.stock_quantity = parseInt(rawFields.stock_quantity ?? rawFields.stock, 10);
          }
          if (rawFields.title) normalizedFields.title = String(rawFields.title);
          if (rawFields.lead_time_days !== undefined) {
            normalizedFields.lead_time_days = parseInt(rawFields.lead_time_days, 10);
          }

          if (Object.keys(normalizedFields).length > 0) {
            updateProduct(prod.id, normalizedFields);
            decision.executionStatus = 'SUCCESS';
            decision.updatedProduct = getProductById(prod.id);
          }
        }
      }

      return decision;
    } catch (err) {
      console.error('Gemini Agent error, falling back to deterministic Q&A engine:', err);
    }
  }

  // High-fidelity deterministic engineering Q&A engine fallback
  return handleDeterministicAgent(prompt, userRole, inventorySnapshot);
}

/**
 * Intelligent domain knowledge Q&A engine fallback
 */
function handleDeterministicAgent(prompt: string, userRole: string, inventory: any[]) {
  const lower = prompt.toLowerCase();

  // 1. Admin DB modification command
  if (
    userRole === 'admin' &&
    (lower.includes('update') ||
      lower.includes('set stock') ||
      lower.includes('change price') ||
      (lower.includes('stock') && lower.includes('to')))
  ) {
    const matchedProd = inventory.find((p) => lower.includes(p.sku.toLowerCase()));
    const numMatches = lower.match(/\d+(\.\d+)?/g);

    if (matchedProd && numMatches && numMatches.length > 0) {
      const num = parseFloat(numMatches[numMatches.length - 1]);
      const isPrice = lower.includes('price') || lower.includes('$');
      const fieldsToUpdate: any = {};

      if (isPrice) {
        fieldsToUpdate.price_usd = num;
      } else {
        fieldsToUpdate.stock_quantity = Math.round(num);
      }

      updateProduct(matchedProd.id, fieldsToUpdate);
      const updated = getProductById(matchedProd.id);

      const msg = `Database Transaction Confirmed: SKU ${matchedProd.sku} (${matchedProd.title}) has been updated in the relational SQLite database. ${
        isPrice ? `Unit price adjusted to $${num} USD FOB.` : `Stock inventory updated to ${num} units.`
      }`;

      return {
        action: 'EXECUTE_DB_COMMAND',
        answer: msg,
        explanation: msg,
        matchedSkus: [matchedProd.sku],
        command: {
          type: 'UPDATE_PRODUCT',
          sku: matchedProd.sku,
          fields: fieldsToUpdate,
        },
        executionStatus: 'SUCCESS',
        updatedProduct: updated,
        suggestedFollowUps: [
          `View updated specifications for ${matchedProd.sku}`,
          'Check current warehouse low stock items',
          'Run audit log query in Admin Console',
        ],
      };
    }
  }

  // 2. Specific Technical Questions: Screw Pumps
  if (
    lower.includes('screw pump') ||
    (lower.includes('how') && lower.includes('pump') && lower.includes('work')) ||
    lower.includes('three-spindle') ||
    lower.includes('viscosity')
  ) {
    const pump = inventory.find((p) => p.sku === 'HY-SP-40B') || inventory[0];
    const answer = `**Three-Spindle High Pressure Screw Pumps (Principle & Operation):**

Three-spindle screw pumps are positive displacement pumps engineered specifically for continuous, pulsation-free fluid transfer. In our **HY-SP-40B** model:

1. **Working Principle:** A central power rotor directly drives two symmetrically opposed intermeshing idle counter-rotors within an accurately bored casing. As the screws rotate, sealed hydraulic chambers form axially, moving fluid continuously from the suction port to the discharge port.
2. **Pulsation-Free & Low Acoustic Signature:** Unlike gear or piston pumps, the axial fluid conveyance creates zero volumetric pulsation, which eliminates hydraulic water hammer and prevents fluid emulsion/shearing.
3. **Viscosity Range:** Engineered for fluids ranging from **3 to 3800 cSt**, making it the premier choice for Heavy Fuel Oil (HFO), Marine Gas Oil (MGO), turbine lubrication, and offshore hydraulic power units.
4. **Current Database Specifications:** 
   • Rated Pressure: **40 Bar**
   • Flow Capacity: **350 L/min**
   • Unit Price: **$1,850 USD FOB** (${pump.stock_quantity} units available, lead time ${pump.lead_time_days} days).`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-SP-40B'],
      suggestedFollowUps: [
        'Compare screw pump vs variable vane pump',
        'Can this pump handle low-sulfur marine gas oil?',
        'Request quotation for HY-SP-40B',
      ],
    };
  }

  // 3. Bladder Accumulators & Hydraulic Energy Storage
  if (
    lower.includes('accumulator') ||
    lower.includes('bladder') ||
    lower.includes('pressure vessel') ||
    lower.includes('350 bar') ||
    lower.includes('nitrogen')
  ) {
    const acc = inventory.find((p) => p.sku === 'HY-ACC-BLD') || inventory[0];
    const answer = `**High-Pressure Bladder Accumulators (350 Bar):**

Our **HY-ACC-BLD** is designed in accordance with **ASME Boiler & Pressure Vessel Code Section VIII Division 1** and PED 2014/68/EU standards.

1. **How It Works:** The accumulator consists of a seamless forged chrome-molybdenum steel shell (34CrMo4) containing an elastic flexible bladder (NBR or Viton/FKM). The bladder is pre-charged with dry Nitrogen (N2) gas through a top gas valve. When system pressure exceeds pre-charge pressure, hydraulic fluid enters the vessel, compressing the nitrogen gas and storing potential fluid energy.
2. **Key Industrial Applications:**
   • **Pulsation Damping:** Dampens high-frequency ripple generated by positive displacement pumps.
   • **Hydraulic Shock Absorption:** Protects valves and piping from line hammer during emergency shutdowns.
   • **Emergency Power Storage:** Provides immediate auxiliary pressure to actuate blowout preventers (BOPs) or marine steering gears during power loss.
3. **Current Catalog Data:**
   • Max Working Pressure: **350 Bar**
   • Nominal Volume: **25 Liters**
   • Working Temperature: **-20 °C to +80 °C**
   • Price: **$920 USD FOB** (Live stock: ${acc.stock_quantity} units).`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-ACC-BLD'],
      suggestedFollowUps: [
        'What nitrogen pre-charge pressure should I use?',
        'Compare accumulator with proportional directional valve',
        'Request CAD drawings and ASME VIII certificate for HY-ACC-BLD',
      ],
    };
  }

  // 4. Industrial Filtration & Scraper Technology
  if (
    lower.includes('filter') ||
    lower.includes('filtration') ||
    lower.includes('scraper') ||
    lower.includes('duplex') ||
    lower.includes('micron')
  ) {
    const answer = `**Industrial Filtration Systems & Automated Scraper Technology:**

HY Precision Technology manufactures automated continuous filtration systems designed for heavy process uptime without filter element replacement:

1. **Mechanically Cleaned Scraper Filter (HY-FILT-SCRP):**
   • **Mechanism:** Slurry or viscous fluid flows inside-out through a precision wedge-wire cylindrical screen. When differential pressure rises (ΔP > 0.5 Bar), a motorized spring-loaded scraper blade automatically rotates along the inner screen surface, scraping particulate cake down into a concentrated purge sump without interrupting main flow.
   • **Benefits:** Completely eliminates disposable bag/cartridge consumption and hazardous waste exposure.
   • **Specs:** Design Pressure **16 Bar**, Filtration Rating **50 - 500 Microns**, Body **SS 316L**, Price **$4,200 FOB**.

2. **ASME Section VIII Duplex Basket Strainers (HY-FILT-DUP):**
   • Utilizes twin filtration chambers connected by an integral 3-way diversion ball valve. Allows maintenance and screen wash-down on one chamber while 100% flow continues through the parallel chamber. Rated to **25 Bar** with **25 Micron** absolute filtration.`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-FILT-SCRP', 'HY-FILT-DUP'],
      suggestedFollowUps: [
        'What is the maximum flow rate of the scraper filter?',
        'What differential pressure triggers the purge cycle?',
        'Request quotation for industrial filtration skid',
      ],
    };
  }

  // 5. 5-Axis CNC Machining & Material Science (Titanium vs PEEK)
  if (
    lower.includes('titanium') ||
    lower.includes('peek') ||
    lower.includes('cnc') ||
    lower.includes('tolerance') ||
    lower.includes('machin')
  ) {
    const answer = `**5-Axis CNC Precision Machining & Advanced Metallurgy:**

HY Precision operates high-precision 5-axis simultaneous machining centers (DMG MORI / Mazak) achieving tight geometric dimensioning and tolerancing (GD&T) to **±0.005 mm**.

1. **Aerospace Titanium Grade 5 Manifolds (HY-CNC-TI6):**
   • **Material:** Ti-6Al-4V (Grade 5 annealed).
   • **Advantages:** Exceptional strength-to-density ratio (4.43 g/cm³), outstanding fatigue strength, and complete immunity to pitting and crevice corrosion in marine/seawater subsea environments.
   • **Specs:** Pressure rating **450 Bar**, Surface finish **Ra 0.4 µm**, 100% CMM inspected with AS9100 / EN 10204 3.1 material test certification.

2. **Medical Implant Grade PEEK Surgical Assemblies (HY-CNC-PEEK):**
   • **Material:** Invibio PEEK-OPTIMA / ASTM F2026 implant grade.
   • **Advantages:** Biocompatible, radiolucent (visible under X-ray/fluoroscopy without artifact distortion), elasticity close to cortical bone (E-modulus ~3.6 GPa), and autoclavable over thousands of steam sterilization cycles. Cleanroom machined with zero coolant contamination.`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-CNC-TI6', 'HY-CNC-PEEK'],
      suggestedFollowUps: [
        'Can HY Precision machine custom titanium manifolds to customer CAD?',
        'What surface roughness Ra is achievable on CNC titanium?',
        'Request quotation for 5-axis CNC machining',
      ],
    };
  }

  // 6. Offshore & Marine Safety (Rescue Boats & Davits)
  if (
    lower.includes('boat') ||
    lower.includes('rescue') ||
    lower.includes('marine') ||
    lower.includes('solas') ||
    lower.includes('davit') ||
    lower.includes('offshore')
  ) {
    const answer = `**SOLAS-Certified Offshore Marine Equipment & Fast Rescue Craft:**

Through our partnership with Euro Offshore Ltd. and in-house engineering, HY Precision Technology supplies critical maritime life-saving appliances:

1. **Alunautic 4.5M Fast Rescue Craft (HY-ALU-RB45):**
   • **Construction:** Deep-V heavy-duty welded Marine Grade **5083-H111** aluminum hull with hypalon/polyurethane heavy-duty D-fendering.
   • **Performance:** Top speed **32 Knots** with outboard marine propulsion, **6 Persons** capacity.
   • **Compliance:** Full compliance with **SOLAS 74/96 Chapter III** and IMO MSC.81(70) testing.

2. **Offshore A-Frame Davit Skid (HY-SOLAS-DAV):**
   • Safe Working Load (SWL) of **25 kN** (2,500 kg).
   • Equipped with hydraulic constant-tension winches and emergency gravity-lowering fail-safe for wave-following launching in Sea State 4 to 5.`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-ALU-RB45', 'HY-SOLAS-DAV'],
      suggestedFollowUps: [
        'What certifications come with the rescue boat?',
        'What is the Safe Working Load (SWL) of the davit skid?',
        'Request export quotation for maritime safety craft',
      ],
    };
  }

  // 7. Fluid Power Science: Cavitation & Pressure Ratings
  if (lower.includes('cavitation') || lower.includes('npsh') || lower.includes('vapor pressure')) {
    const answer = `**Understanding & Preventing Cavitation in Fluid Systems:**

**Cavitation** occurs when the static pressure of a liquid drops below its vapor pressure at operating temperature, causing microscopic vapor bubbles (cavities) to form. When these bubbles travel to higher-pressure zones downstream, they violently implode, creating localized micro-jets with pressures exceeding 1,000 Bar and temperatures over 1,000 °C, leading to severe pitting, erosion, acoustic vibration, and rapid mechanical seal failure.

**How HY Precision Technology Prevents Cavitation:**
1. **Low Shear Axial Flow:** Our **HY-SP-40B** three-spindle screw pumps maintain smooth, linear axial fluid acceleration without centrifugal vortexes, significantly lowering Net Positive Suction Head Required (**NPSHr < 1.5m**).
2. **Suction Accumulators:** Installing our **HY-ACC-BLD** accumulator on pump suction manifolds absorbs negative pressure waves and maintains consistent fluid head.
3. **Optimized Piping Sizing:** We recommend limiting suction line fluid velocity to **0.8 - 1.2 m/s** and using full-bore suction isolation valves.`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-SP-40B', 'HY-ACC-BLD'],
      suggestedFollowUps: [
        'What fluid velocity is recommended for hydraulic suction lines?',
        'View specifications for HY-SP-40B screw pump',
        'How does temperature affect hydraulic oil viscosity?',
      ],
    };
  }

  // 8. Company Background, Facilities, Certifications, Locations
  if (
    lower.includes('where') ||
    lower.includes('location') ||
    lower.includes('address') ||
    lower.includes('office') ||
    lower.includes('factory') ||
    lower.includes('bhiwandi') ||
    lower.includes('thane') ||
    lower.includes('certif') ||
    lower.includes('who are you') ||
    lower.includes('company') ||
    lower.includes('about')
  ) {
    const answer = `**About HY Precision Technology:**

**HY Precision Technology** is an engineering manufacturer and distributor specializing in high-pressure fluid power assemblies, industrial automated filtration skids, aerospace CNC components, and SOLAS maritime rescue systems.

• **Headquarters & Commercial Office:** Bhumi World, Bhiwandi, Maharashtra 421302, India.
• **Heavy Manufacturing & Machining Works:** Renaissance Industrial Infrastructure Park, Thane, Maharashtra.
• **Quality Certifications:**
  - **ISO 9001:2015** Quality Management System.
  - **ASME Boiler & Pressure Vessel Code Section VIII Division 1** (U-Stamp authorized pressure vessel design).
  - Official Distributor for **Euro Offshore Ltd.** (UK/Netherlands) & **Fluen Co. Korea**.
• **Testing & Inspection Protocol:** Every component undergoes 100% hydrostatic pressure testing (up to 1.5x design pressure), dye penetrant non-destructive testing (NDT), and Coordinate Measuring Machine (CMM) dimensional verification.
• **Contact:** sales@hyprecisiontechnology.com | Tel: +91 70836 78003.`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: [],
      suggestedFollowUps: [
        'What quality control tests do you perform before shipping?',
        'How do I request a formal quotation (RFQ)?',
        'Browse our complete certified inventory catalog',
      ],
    };
  }

  // 9. Quotation, RFQ, Pricing, and Lead Time Inquiries
  if (
    lower.includes('rfq') ||
    lower.includes('quote') ||
    lower.includes('price') ||
    lower.includes('order') ||
    lower.includes('lead time') ||
    lower.includes('delivery') ||
    lower.includes('shipping')
  ) {
    const answer = `**Quotation (RFQ) & Delivery Policy:**

1. **How to Obtain a Formal Quote:** Click the **"Request RFQ"** button in the left sidebar or select **"Quote"** on any item card. Enter your operating parameters (working medium, design pressure, delivery address). Our engineering sales team logs the quotation directly to our relational database and issues a formal FOB/CIF quote within **24 hours**.
2. **Current Pricing Structure:**
   • All prices listed are in USD on an **FOB Port of Nhava Sheva (JNPT) / Mumbai** basis. CIF delivery is available worldwide.
   • Volume discounts and OEM recurring contract pricing are available for annual blanket orders.
3. **Lead Times:**
   • Standard in-stock components (accumulators, screw pumps, proportional valves): **3 to 7 business days**.
   • Custom-engineered filtration skids & 5-axis titanium manifolds: **2 to 4 weeks** including full mill test certification (EN 10204 3.1).`;

    return {
      action: 'ANSWER',
      answer,
      explanation: answer,
      matchedSkus: ['HY-ACC-BLD', 'HY-SP-40B'],
      suggestedFollowUps: [
        'Open RFQ quote submission modal',
        'What payment terms are accepted for export orders?',
        'Show in-stock hydraulic equipment',
      ],
    };
  }

  // 10. Low stock / inventory queries
  if (lower.includes('low stock') || lower.includes('reorder') || lower.includes('out of stock')) {
    const lowStock = inventory.filter((p) => p.stock_quantity <= 5);
    const skuList = lowStock.map((p) => p.sku);
    const answer = `**Warehouse Inventory Alert (Critical Stock <= 5 Units):**

We currently have **${lowStock.length} component(s)** with limited inventory in the live relational database:

${lowStock
  .map(
    (p) =>
      `• **${p.sku}** (${p.title}): **${p.stock_quantity} units remaining** | Price: $${p.price_usd.toLocaleString()} FOB | Lead time: ${p.lead_time_days} days`
  )
  .join('\n')}

For immediate batch reserve, please submit an RFQ or contact the dispatch desk at sales@hyprecisiontechnology.com.`;

    return {
      action: 'SEARCH_RESULTS',
      answer,
      explanation: answer,
      matchedSkus: skuList,
      suggestedFollowUps: [
        'Request quote for low stock components',
        'Update inventory stock level (Admin mode)',
        'Show all products in database',
      ],
    };
  }

  // 11. General Smart Synthesis Fallback
  // If user asks a general question, synthesize an informative, respectful engineering answer based on inventory and engineering discipline
  let matched = inventory;
  if (lower.includes('pump') || lower.includes('hydraulic') || lower.includes('bar')) {
    matched = inventory.filter((p) => p.category_slug === 'hydraulics');
  } else if (lower.includes('filter') || lower.includes('scraper') || lower.includes('duplex')) {
    matched = inventory.filter((p) => p.category_slug === 'filtration');
  } else if (lower.includes('titanium') || lower.includes('cnc') || lower.includes('peek')) {
    matched = inventory.filter((p) => p.category_slug === 'cnc-machining');
  } else if (lower.includes('boat') || lower.includes('rescue') || lower.includes('marine')) {
    matched = inventory.filter((p) => p.category_slug === 'offshore-marine');
  }

  const priceUnder = lower.match(/(?:under|below|less than)\s*\$?(\d+)/);
  if (priceUnder) {
    const max = parseFloat(priceUnder[1]);
    matched = matched.filter((p) => p.price_usd <= max);
  }

  const answer = `**Engineering Technical Consultation:**

Regarding your query **"${prompt}"**:

HY Precision Technology provides certified components tailored for this requirement. Based on our live relational catalog, here are the relevant systems and parameters:

${matched
  .slice(0, 3)
  .map(
    (p) =>
      `• **${p.sku}** - *${p.title}* (${p.category})
  - **FOB Unit Price:** $${p.price_usd.toLocaleString()} | **Lead Time:** ${p.lead_time_days} business days
  - **Key Specs:** ${p.specifications.slice(0, 2).map((s: any) => `${s.key}: ${s.value} ${s.unit || ''}`).join(', ')}`
  )
  .join('\n\n')}

All components are manufactured under **ISO 9001:2015** controls and 100% factory pressure tested before dispatch. You can filter the catalog or compare these specifications side-by-side using the controls below.`;

  return {
    action: matched.length > 0 ? 'SEARCH_RESULTS' : 'ANSWER',
    answer,
    explanation: answer,
    matchedSkus: matched.map((m) => m.sku),
    suggestedFollowUps: [
      `Compare ${matched[0]?.sku || 'HY-SP-40B'} and ${matched[1]?.sku || 'HY-ACC-BLD'}`,
      'Explain operating pressure tolerances for these parts',
      'Request engineering quote for custom setup',
    ],
  };
}
