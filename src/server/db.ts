import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { generateQuotationRefNumber } from '../utils/quotationDocument.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'hyprecision.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize relational schema and perform migrations
 */
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      sku TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      short_desc TEXT,
      description TEXT,
      price_usd REAL NOT NULL DEFAULT 0.0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_order_quantity INTEGER NOT NULL DEFAULT 1,
      lead_time_days INTEGER NOT NULL DEFAULT 7,
      image_url TEXT NOT NULL,
      certifications TEXT DEFAULT 'ISO 9001:2015,CE,RoHS',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_specifications (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      spec_key TEXT NOT NULL,
      spec_value TEXT NOT NULL,
      unit TEXT,
      is_highlight INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quotation_requests (
      id TEXT PRIMARY KEY,
      reference_no TEXT,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      quantity_requested INTEGER NOT NULL DEFAULT 1,
      custom_specs TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_usd);
    CREATE INDEX IF NOT EXISTS idx_specs_product ON product_specifications(product_id);
  `);

  // Migration for reference_no if table already existed without it
  try {
    const tableInfo = db.prepare('PRAGMA table_info(quotation_requests);').all() as any[];
    const hasRefNo = tableInfo.some((col) => col.name === 'reference_no');
    if (!hasRefNo) {
      db.exec('ALTER TABLE quotation_requests ADD COLUMN reference_no TEXT;');
    }
  } catch (err) {
    console.warn('Migration note for quotation_requests:', err);
  }

  // Seed data if categories are empty or if legacy categories need re-seeding
  const countRow = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  const marineCategory = db.prepare("SELECT COUNT(*) as count FROM categories WHERE slug = 'alunautic-aluminium'").get() as { count: number };
  if (!countRow || countRow.count === 0 || !marineCategory || marineCategory.count === 0) {
    seedDatabase();
  }
}

export function seedDatabase() {
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Clear existing seed data to ensure fresh migration to Marine & Workboat catalog
    db.exec('DELETE FROM product_specifications;');
    db.exec('DELETE FROM products;');
    db.exec('DELETE FROM categories;');

    // Categories
    const insertCat = db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, slug, description)
      VALUES (?, ?, ?, ?)
    `);

    insertCat.run(
      'cat-alunautic',
      'Alunautic Aluminium Workboats',
      'alunautic-aluminium',
      'High-grade 5083-H111 aluminium workboats, landing crafts, patrol vessels, and 12m-16m Windmill cabin series.'
    );
    insertCat.run(
      'cat-bluespirit',
      'Blue Spirit GRP RIB Patrol Line',
      'blue-spirit-ribs',
      'High-speed offshore GRP Rigid Inflatable Boats (6.5m to 11.2m) with Orca Hypalon collar and open/cabin tactical options.'
    );
    insertCat.run(
      'cat-fibreshark',
      'Fibre Shark GRP Workboats',
      'fibre-shark-grp',
      'Heavy-duty glass reinforced plastic pilot launches, port authority workboats, and high-speed commercial passenger catamarans.'
    );
    insertCat.run(
      'cat-hdpe',
      'HDPE Indestructible Workboats',
      'hdpe-workboats',
      'High-Density Polyethylene indestructible hull workboats, landing crafts, zero-corrosion, 5-year warranty, and bullet-absorbent properties.'
    );
    insertCat.run(
      'cat-lifesaving',
      'EO Lifesaving & Davit Systems',
      'eo-lifesaving',
      'SOLAS / IMO certified totally enclosed lifeboats, freefall boats, fast rescue crafts (FRB), and hydraulic slewing davit launching systems.'
    );
    insertCat.run(
      'cat-aquacat',
      'AquaCat Modular Catamarans',
      'aquacat-catamarans',
      'AquaCat 12.50m & 13.60m sailing and motor catamarans engineered with containerized AQ Lego modular transport assembly.'
    );
    insertCat.run(
      'cat-military',
      'Governmental & Naval Defense',
      'governmental-military',
      'Military Fast Attack Patrol 2380, GRP Unmanned Surface Vehicle USV Patrol 5.60 JET with radar/PTZ/Starlink, and Fast Inland Patrol vessels.'
    );

    // Products & Specifications
    const insertProd = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, category_id, sku, title, short_desc, description, price_usd, stock_quantity, lead_time_days, image_url, certifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSpec = db.prepare(`
      INSERT OR REPLACE INTO product_specifications (
        id, product_id, spec_key, spec_value, unit, is_highlight
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 1. Alunautic WB 5.50 (As highlighted in Sample Quotation PDF HPT-256)
    insertProd.run(
      'prod-wb-550',
      'cat-alunautic',
      'ALU-WB-550',
      'Alunautic WB 5.50 Monohull Aluminium Workboat',
      'Heavy-duty 5.50m marine grade 5083 aluminium multirole workboat with self-bailing deck and heavy D-fendering.',
      'The Alunautic WB 5.50 is the battle-tested base platform selected for maritime administrations and offshore support. Built with certified marine grade 5083-H111 aluminium, polyurethane closed-cell positive buoyancy foam, ergonomic center steering console, and heavy-duty towing Samson posts. Compliant with ISO 9001:2015 and CE Category C standards.',
      48500.0,
      4,
      45,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'ISO 9001:2015,CE Category C,IACS'
    );
    insertSpec.run('sp-wb-1', 'prod-wb-550', 'Length Overall (LOA)', '5.50', 'Meters', 1);
    insertSpec.run('sp-wb-2', 'prod-wb-550', 'Beam Overall (BOA)', '2.10', 'Meters', 1);
    insertSpec.run('sp-wb-3', 'prod-wb-550', 'Maximum Draft', '0.35', 'Meters', 1);
    insertSpec.run('sp-wb-4', 'prod-wb-550', 'Hull Material', 'Aluminium 5083-H111', '', 1);
    insertSpec.run('sp-wb-5', 'prod-wb-550', 'Person Capacity', '6', 'Persons', 1);
    insertSpec.run('sp-wb-6', 'prod-wb-550', 'Max Engine Power', '115', 'HP', 1);
    insertSpec.run('sp-wb-7', 'prod-wb-550', 'Max Speed', '34', 'Knots', 1);
    insertSpec.run('sp-wb-8', 'prod-wb-550', 'Light Displacement', '850', 'kg', 0);
    insertSpec.run('sp-wb-9', 'prod-wb-550', 'Payload Capacity', '950', 'kg', 0);

    // 2. Alunautic Military Support 650
    insertProd.run(
      'prod-alu-ms650',
      'cat-alunautic',
      'ALU-MS-650',
      'Alunautic Military Support 650 Tactical Craft',
      '6.50m heavy aluminum tactical platform with all-around elastomer D-fender and certified 4-point crane slings.',
      'Engineered specifically for naval boarding, special forces support, and rapid port interception. Reinforced transom accommodates single or twin outboards up to 250HP. Features non-slip checker plate deck, gun mount pre-wiring, and heavy duty samson posts.',
      72000.0,
      3,
      60,
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
      'ISO 9001:2015,CE Category B,Naval Defense Standard'
    );
    insertSpec.run('sp-ms-1', 'prod-alu-ms650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-ms-2', 'prod-alu-ms650', 'Beam Overall (BOA)', '2.45', 'Meters', 1);
    insertSpec.run('sp-ms-3', 'prod-alu-ms650', 'Hull Material', 'Aluminium 5083-H111 (5mm bottom)', '', 1);
    insertSpec.run('sp-ms-4', 'prod-alu-ms650', 'Crew Capacity', '8', 'Persons', 1);
    insertSpec.run('sp-ms-5', 'prod-alu-ms650', 'Propulsion', 'Single 250HP or Twin 115HP Outboard', '', 1);
    insertSpec.run('sp-ms-6', 'prod-alu-ms650', 'Max Speed', '42', 'Knots', 1);
    insertSpec.run('sp-ms-7', 'prod-alu-ms650', 'Lifting Slings', '4-Point Proof Tested 2.5x SWL', '', 0);

    // 3. Alunautic "Windmill" Cabin Patrol 14m / 16m
    insertProd.run(
      'prod-alu-wm14',
      'cat-alunautic',
      'ALU-WM-1400',
      'Alunautic Windmill 14M Enclosed Offshore Cabin Patrol',
      '14-meter all-weather offshore windfarm and coastal patrol vessel with climate-controlled cabin and shock seating.',
      'Designed for severe offshore conditions (Sea State 5+). Equipped with twin Scania or Volvo Penta 650HP marine diesels driving HamiltonJet waterjets or shaft lines. Enclosed wheelhouse seats 12 technicians plus 2 crew with Ullman suspension seats, thermal night vision, and boarding bow fender.',
      480000.0,
      1,
      120,
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=800',
      'RINA,IACS,CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-wm-1', 'prod-alu-wm14', 'Length Overall (LOA)', '14.20', 'Meters', 1);
    insertSpec.run('sp-wm-2', 'prod-alu-wm14', 'Beam Overall (BOA)', '4.60', 'Meters', 1);
    insertSpec.run('sp-wm-3', 'prod-alu-wm14', 'Draft', '0.85', 'Meters', 1);
    insertSpec.run('sp-wm-4', 'prod-alu-wm14', 'Main Engines', 'Twin Scania DI13 650HP Marine Diesels', '', 1);
    insertSpec.run('sp-wm-5', 'prod-alu-wm14', 'Max Speed', '36', 'Knots', 1);
    insertSpec.run('sp-wm-6', 'prod-alu-wm14', 'Passenger Capacity', '12 Pax + 2 Crew', '', 1);
    insertSpec.run('sp-wm-7', 'prod-alu-wm14', 'Fuel Capacity', '1,800', 'Liters', 0);
    insertSpec.run('sp-wm-8', 'prod-alu-wm14', 'Range @ 24 Knots', '320', 'NM', 0);

    // 4. Alunautic LC 850 Landing Craft
    insertProd.run(
      'prod-alu-lc850',
      'cat-alunautic',
      'ALU-LC-850',
      'Alunautic LC 850 Aluminium Heavy Landing Craft',
      '8.50m aluminium landing craft with bow loading door, wide cargo deck for ATVs, equipment, and personnel.',
      'Heavy-duty aluminium ramp operated by manual or hydraulic winches. Capable of beach landing in shallow estuaries with rugged flat-bottom forward entry and V-keel aft. Ideal for island logistics, disaster response, and oil spill deployment.',
      98000.0,
      2,
      75,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-lc-1', 'prod-alu-lc850', 'Length Overall (LOA)', '8.50', 'Meters', 1);
    insertSpec.run('sp-lc-2', 'prod-alu-lc850', 'Beam Overall (BOA)', '2.80', 'Meters', 1);
    insertSpec.run('sp-lc-3', 'prod-alu-lc850', 'Bow Ramp Width', '1.60', 'Meters', 1);
    insertSpec.run('sp-lc-4', 'prod-alu-lc850', 'Payload Deck Cargo', '2,500', 'kg', 1);
    insertSpec.run('sp-lc-5', 'prod-alu-lc850', 'Power Options', 'Twin 150HP Outboard Engines', '', 1);

    // 5. Blue Spirit Patrol RHIB 650 Open
    insertProd.run(
      'prod-bs-650',
      'cat-bluespirit',
      'BS-RIB-650',
      'Blue Spirit Patrol RHIB 650 Professional Interceptor',
      '6.50m professional GRP deep-V rigid inflatable with heavy Orca Hypalon 1670 dtex 5-chamber tubes.',
      'Blue Spirit boats division high-performance interceptor. Deep-V composite hull delivers unmatched wave-cutting capabilities in open sea chop. Features stainless steel A-frame with LED navigation lights, radar arch, jockey console, and SOLAS rescue equipment brackets.',
      59000.0,
      5,
      40,
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
      'SOLAS,CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-bs-1', 'prod-bs-650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-bs-2', 'prod-bs-650', 'Beam Overall (BOA)', '2.65', 'Meters', 1);
    insertSpec.run('sp-bs-3', 'prod-bs-650', 'Tube Diameter', '0.50', 'Meters', 1);
    insertSpec.run('sp-bs-4', 'prod-bs-650', 'Tube Fabric', 'Orca Hypalon 1670 dtex (5 Chambers)', '', 1);
    insertSpec.run('sp-bs-5', 'prod-bs-650', 'Engine Power', 'Single 175HP or Twin 90HP Outboard', '', 1);
    insertSpec.run('sp-bs-6', 'prod-bs-650', 'Max Speed', '44', 'Knots', 1);
    insertSpec.run('sp-bs-7', 'prod-bs-650', 'Capacity', '8', 'Persons', 0);

    // 6. Blue Spirit Patrol RHIB 820 Cabin
    insertProd.run(
      'prod-bs-820c',
      'cat-bluespirit',
      'BS-RIB-820C',
      'Blue Spirit Patrol RHIB 820 Enclosed Wheelhouse',
      '8.20m GRP rigid inflatable with enclosed pilot cabin, climate control, Simrad radar, and FLIR thermal imaging.',
      'Combines the stability and buoyancy of an offshore RHIB with an insulated, weatherproof cabin. Fitted with twin Yamaha or Mercury 225HP engines. Designed for 24/7 port security, coast guard surveillance, and SAR patrol in cold or torrential climates.',
      145000.0,
      2,
      70,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'CE Category B,RINA,ISO 9001:2015'
    );
    insertSpec.run('sp-bsc-1', 'prod-bs-820c', 'Length Overall (LOA)', '8.20', 'Meters', 1);
    insertSpec.run('sp-bsc-2', 'prod-bs-820c', 'Beam Overall (BOA)', '3.10', 'Meters', 1);
    insertSpec.run('sp-bsc-3', 'prod-bs-820c', 'Engines', 'Twin 225HP 4-Stroke Outboards', '', 1);
    insertSpec.run('sp-bsc-4', 'prod-bs-820c', 'Max Speed', '46', 'Knots', 1);
    insertSpec.run('sp-bsc-5', 'prod-bs-820c', 'Cabin Capacity', '4 Seats + 4 Deck Crew', '', 1);
    insertSpec.run('sp-bsc-6', 'prod-bs-820c', 'Electronics', 'Simrad NSS12 evo3 + Halo20+ Radar', '', 0);

    // 7. Blue Spirit 1120 Interceptor RHIB
    insertProd.run(
      'prod-bs-1120',
      'cat-bluespirit',
      'BS-RIB-1120',
      'Blue Spirit 1120 High-Speed Tactical Interceptor RHIB',
      '11.20m naval interceptor powered by triple 350HP outboard engines, reaching 55+ knots with 10 shock-absorbing seats.',
      'The pinnacle of rapid response marine interdiction. Features stepped high-speed GRP monohull, military-spec Hypalon collar with internal polyurethane foam inserts, tactical command console, ballistic protection panels, and heavy-duty towing bollards.',
      295000.0,
      1,
      90,
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
      'CE Category B,IACS,Naval Tactical Code'
    );
    insertSpec.run('sp-bs11-1', 'prod-bs-1120', 'Length Overall (LOA)', '11.20', 'Meters', 1);
    insertSpec.run('sp-bs11-2', 'prod-bs-1120', 'Beam Overall (BOA)', '3.50', 'Meters', 1);
    insertSpec.run('sp-bs11-3', 'prod-bs-1120', 'Propulsion', 'Triple 350HP Mercury Verado Outboards', '', 1);
    insertSpec.run('sp-bs11-4', 'prod-bs-1120', 'Top Speed', '55+', 'Knots', 1);
    insertSpec.run('sp-bs11-5', 'prod-bs-1120', 'Fuel Capacity', '900', 'Liters', 0);
    insertSpec.run('sp-bs11-6', 'prod-bs-1120', 'Seating', '10x Ullman Shock Mitigating Seats', '', 1);

    // 8. Fibre Shark Pilot 1050 GRP Workboat
    insertProd.run(
      'prod-fs-pilot1050',
      'cat-fibreshark',
      'FS-PILOT-1050',
      'Fibre Shark Pilot 1050 Heavy Duty GRP Pilot Launch',
      '10.50m heavy glass-reinforced composite pilot boat engineered for 24/7 port duty and pilot transfer.',
      'Fibre Shark Boats division flagship pilot vessel. Features thick solid laminate GRP hull with vinylester resin barrier, perimeter bonded elastomeric fender, heated wheelhouse windows, Yanmar 450HP diesel with V-drive or sterndrive, and non-slip boarding platform.',
      245000.0,
      2,
      90,
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=800',
      'CE Category B,Bureau Veritas / RINA,ISO 9001:2015'
    );
    insertSpec.run('sp-fsp-1', 'prod-fs-pilot1050', 'Length Overall (LOA)', '10.50', 'Meters', 1);
    insertSpec.run('sp-fsp-2', 'prod-fs-pilot1050', 'Beam Overall (BOA)', '3.40', 'Meters', 1);
    insertSpec.run('sp-fsp-3', 'prod-fs-pilot1050', 'Draft', '0.90', 'Meters', 1);
    insertSpec.run('sp-fsp-4', 'prod-fs-pilot1050', 'Engine', 'Single Yanmar 6CX-GTYE 450HP Diesel', '', 1);
    insertSpec.run('sp-fsp-5', 'prod-fs-pilot1050', 'Service Speed', '26', 'Knots', 1);
    insertSpec.run('sp-fsp-6', 'prod-fs-pilot1050', 'Fendering', 'Solid Elastomer Continuous D-Section', '', 0);

    // 9. Fibre Shark Fast Passenger Catamaran 1400
    insertProd.run(
      'prod-fs-cat1400',
      'cat-fibreshark',
      'FS-CAT-1400',
      'Fibre Shark Fast Passenger Catamaran 1400 (48 Pax)',
      '14.20m high-speed composite catamaran ferry with 48 air-conditioned passenger seats and twin diesel shaft drives.',
      'Commercial passenger ferry offering exceptional fuel efficiency, low wash wake, and high passenger comfort. Twin hull symmetrical design minimizes rolling motions. Features airline-style high-back seating, luggage racks, marine toilet compartment, and dual boarding gates.',
      540000.0,
      1,
      150,
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'RINA Passenger Class,CE Category B,IACS'
    );
    insertSpec.run('sp-fsc-1', 'prod-fs-cat1400', 'Length Overall (LOA)', '14.20', 'Meters', 1);
    insertSpec.run('sp-fsc-2', 'prod-fs-cat1400', 'Beam Overall (BOA)', '5.40', 'Meters', 1);
    insertSpec.run('sp-fsc-3', 'prod-fs-cat1400', 'Engines', 'Twin Volvo Penta D8-550HP Marine Diesels', '', 1);
    insertSpec.run('sp-fsc-4', 'prod-fs-cat1400', 'Cruise Speed', '28', 'Knots', 1);
    insertSpec.run('sp-fsc-5', 'prod-fs-cat1400', 'Passenger Capacity', '48 Passengers + 2 Crew', '', 1);
    insertSpec.run('sp-fsc-6', 'prod-fs-cat1400', 'Fuel Capacity', '2x 800', 'Liters', 0);

    // 10. HDPE 800 Indestructible Landing Craft
    insertProd.run(
      'prod-hdpe-lc800',
      'cat-hdpe',
      'HDPE-LC-800',
      'HDPE 800 Indestructible Landing Craft Workboat',
      '8.00m High-Density Polyethylene indestructible landing craft. 100% recyclable, zero corrosion, 5-year hull warranty.',
      'HDPE Workboats division craft. The hull is completely impervious to corrosion, osmosis, and marine fouling. Needs no anti-fouling paint or anodes. The elasticity of HDPE absorbs violent rock and pier impacts without cracking or denting. Bow ramp opens for loading quads and supplies.',
      88000.0,
      3,
      50,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'CE Category C,ISO 9001:2015,5-Year Warranty'
    );
    insertSpec.run('sp-hdp-1', 'prod-hdpe-lc800', 'Length Overall (LOA)', '8.00', 'Meters', 1);
    insertSpec.run('sp-hdp-2', 'prod-hdpe-lc800', 'Beam Overall (BOA)', '2.70', 'Meters', 1);
    insertSpec.run('sp-hdp-3', 'prod-hdpe-lc800', 'Material', 'High-Density Polyethylene PE100', '', 1);
    insertSpec.run('sp-hdp-4', 'prod-hdpe-lc800', 'Hull Maintenance', 'Zero Painting / Zero Anodes Required', '', 1);
    insertSpec.run('sp-hdp-5', 'prod-hdpe-lc800', 'Engines', 'Twin 150HP Marine Outboards', '', 1);
    insertSpec.run('sp-hdp-6', 'prod-hdpe-lc800', 'Max Speed', '36', 'Knots', 1);
    insertSpec.run('sp-hdp-7', 'prod-hdpe-lc800', 'Hull Warranty', '5', 'Years', 1);

    // 11. HDPE Patrol RHIB 900 Solid D-Fender
    insertProd.run(
      'prod-hdpe-pat900',
      'cat-hdpe',
      'HDPE-PAT-900',
      'HDPE Patrol 900 with Solid Foam Polyurea D-Fender',
      '9.00m HDPE heavy patrol craft with bullet-absorbent hull properties and puncture-proof solid polyurea D-fenders.',
      'Built for extreme duty operations. High-molecular weight HDPE absorbs ballistic shrapnel better than aluminum or GRP. Features center walk-around console with T-top, twin diesel sterndrives or outboards, stainless steel crash rails, and shock-cushioned helm.',
      138000.0,
      2,
      65,
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
      'CE Category B,ISO 9001:2015,5-Year Hull Warranty'
    );
    insertSpec.run('sp-hp9-1', 'prod-hdpe-pat900', 'Length Overall (LOA)', '9.00', 'Meters', 1);
    insertSpec.run('sp-hp9-2', 'prod-hdpe-pat900', 'Beam Overall (BOA)', '3.00', 'Meters', 1);
    insertSpec.run('sp-hp9-3', 'prod-hdpe-pat900', 'Fender System', '100% Solid Foam Filled Polyurea D-Fender', '', 1);
    insertSpec.run('sp-hp9-4', 'prod-hdpe-pat900', 'Ballistic Absorption', 'High Impact Energy Dissipation', '', 1);
    insertSpec.run('sp-hp9-5', 'prod-hdpe-pat900', 'Engines', 'Twin Mercury SeaPro 200HP Outboards', '', 1);
    insertSpec.run('sp-hp9-6', 'prod-hdpe-pat900', 'Top Speed', '40', 'Knots', 1);

    // 12. EO Lifesaving TEMPSC Enclosed Lifeboat 7.50M
    insertProd.run(
      'prod-eo-tempsc75',
      'cat-lifesaving',
      'EO-TEMPSC-750',
      'EO Lifesaving TEMPSC Enclosed Lifeboat 7.50M (45 Persons)',
      'SOLAS / IMO LSA Code totally enclosed motor propelled survival craft with deluge water spray and air breathing.',
      'EO Lifesaving Equipment division certified lifeboat. Fire-protected version capable of passing through 300-meter burning oil slicks with continuous compressed air breathing system (10 minutes) and external water deluge pump. Self-righting hull in fully laden condition with certified release hooks.',
      82000.0,
      3,
      30,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'SOLAS 74/96,IMO LSA Code,MED Wheelmark,DNV-GL'
    );
    insertSpec.run('sp-tmp-1', 'prod-eo-tempsc75', 'Length Overall (LOA)', '7.50', 'Meters', 1);
    insertSpec.run('sp-tmp-2', 'prod-eo-tempsc75', 'Beam Overall (BOA)', '2.70', 'Meters', 1);
    insertSpec.run('sp-tmp-3', 'prod-eo-tempsc75', 'Certified Capacity', '45', 'Persons', 1);
    insertSpec.run('sp-tmp-4', 'prod-eo-tempsc75', 'Certification', 'SOLAS / MED Wheelmark / IMO LSA Code', '', 1);
    insertSpec.run('sp-tmp-5', 'prod-eo-tempsc75', 'Fire Protection', 'Deluge Spray Skid + 3x 50L Air Cylinders', '', 1);
    insertSpec.run('sp-tmp-6', 'prod-eo-tempsc75', 'Engine', 'Bukh / Yanmar 29HP Inboard Marine Diesel', '', 1);

    // 13. EO Lifesaving Freefall Lifeboat FF 600
    insertProd.run(
      'prod-eo-ff600',
      'cat-lifesaving',
      'EO-FF-600',
      'EO Freefall Lifeboat FF 600 (Max Drop Height 25M)',
      'Freefall launch survival craft for cargo ships, bulk carriers, and offshore oil platforms. Capacity 32 persons.',
      'Engineered for instant emergency evacuation from high freeboard vessels. Deep hydrodynamic entry keel ensures positive forward momentum away from the sinking mothership upon water entry. Fitted with certified 4-point harness racing-style seats and hydraulic secondary release.',
      115000.0,
      2,
      45,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'SOLAS,MED Wheelmark,RINA,BV'
    );
    insertSpec.run('sp-ff-1', 'prod-eo-ff600', 'Length Overall (LOA)', '6.05', 'Meters', 1);
    insertSpec.run('sp-ff-2', 'prod-eo-ff600', 'Maximum Drop Height', '25', 'Meters', 1);
    insertSpec.run('sp-ff-3', 'prod-eo-ff600', 'Person Capacity', '32', 'Persons', 1);
    insertSpec.run('sp-ff-4', 'prod-eo-ff600', 'Engine', 'Steyr / Bukh Marine Diesel 28HP', '', 1);
    insertSpec.run('sp-ff-5', 'prod-eo-ff600', 'Class Approval', 'SOLAS / MED / IACS Class Certified', '', 1);

    // 14. EO Fast Rescue Boat FRB 650 Jet
    insertProd.run(
      'prod-eo-frb650',
      'cat-lifesaving',
      'EO-FRB-650-JET',
      'EO Fast Rescue Boat FRB 650 with Castoldi Jet & Single-Point Hook',
      'SOLAS-compliant fast rescue craft (FRB) with self-righting roll bar, Steyr inboard diesel, and Castoldi waterjet.',
      'Rapid man-overboard rescue and marshalling craft. Waterjet propulsion guarantees safety for swimmers in the water with zero exposed propellers. Single-point SWL certified off-load release hook for rapid davit launching in Sea State 6.',
      94000.0,
      2,
      35,
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
      'SOLAS 74/96,MED Wheelmark,DNV-GL,IMO MSC/Circ.809'
    );
    insertSpec.run('sp-frb-1', 'prod-eo-frb650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-frb-2', 'prod-eo-frb650', 'Beam Overall (BOA)', '2.50', 'Meters', 1);
    insertSpec.run('sp-frb-3', 'prod-eo-frb650', 'Engine & Jet', 'Steyr SE166E28 (163HP) + Castoldi Jet 05', '', 1);
    insertSpec.run('sp-frb-4', 'prod-eo-frb650', 'Max Speed', '35', 'Knots', 1);
    insertSpec.run('sp-frb-5', 'prod-eo-frb650', 'Lifting Hook', 'Henriksen Single-Point Off-Load Hook', '', 1);
    insertSpec.run('sp-frb-6', 'prod-eo-frb650', 'Self-Righting', 'Automatic CO2 Airbag Roll-Bar System', '', 1);

    // 15. EO Slewing Davit Launching System SWL 25kN
    insertProd.run(
      'prod-eo-davit25',
      'cat-lifesaving',
      'EO-DAVIT-SWL25',
      'EO Slewing Davit Launching System (SWL 25kN)',
      'Hydraulic slewing arm davit system for fast rescue craft and workboat launch in harsh sea conditions.',
      'Compliant with latest SOLAS and MED requirements. Features electro-hydraulic power pack, stainless steel hydraulic cylinders, gravity lowering valve for dead-ship power failure, and wave-motion compensation winch with quick painter line release.',
      64000.0,
      3,
      40,
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
      'SOLAS 74/96,MED Wheelmark,DNV-GL,Bureau Veritas'
    );
    insertSpec.run('sp-dav-1', 'prod-eo-davit25', 'Safe Working Load (SWL)', '25', 'kN (2,550 kg)', 1);
    insertSpec.run('sp-dav-2', 'prod-eo-davit25', 'Max Lowering Speed', '45', 'm/min', 1);
    insertSpec.run('sp-dav-3', 'prod-eo-davit25', 'Max Slewing Angle', '330', 'Degrees', 1);
    insertSpec.run('sp-dav-4', 'prod-eo-davit25', 'Hydraulic System', 'Integrated HPU with 15kW Motor + Hand Pump', '', 1);
    insertSpec.run('sp-dav-5', 'prod-eo-davit25', 'Emergency Operation', 'Full Gravity Lowering Without Power', '', 0);

    // 16. AquaCat 13.60M Modular Tourist Catamaran
    insertProd.run(
      'prod-aqua-1360',
      'cat-aquacat',
      'AQUA-CAT-1360',
      'AquaCat 13.60M Modular Tourist & Sailing Catamaran',
      '13.60m modular catamaran with AQ Lego containerized kit design for cost-effective global 40ft container shipping.',
      'AquaCat Holland joint venture innovation. Engineered with proprietary AQ Lego modular assembly so that both hulls, bridge deck, and salon fit into standard 40-foot sea freight shipping containers, drastically slashing international delivery costs. Available in Tourist day charter (30 Pax) or Family Liveaboard configurations.',
      360000.0,
      1,
      120,
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'CE Category A Ocean,ISO 9001:2015,Dutch Maritime Standard'
    );
    insertSpec.run('sp-aq-1', 'prod-aqua-1360', 'Length Overall (LOA)', '13.60', 'Meters', 1);
    insertSpec.run('sp-aq-2', 'prod-aqua-1360', 'Beam Overall (BOA)', '6.20', 'Meters', 1);
    insertSpec.run('sp-aq-3', 'prod-aqua-1360', 'Transport System', 'Modular AQ Lego System (Fits in 40ft Containers)', '', 1);
    insertSpec.run('sp-aq-4', 'prod-aqua-1360', 'Propulsion', 'Twin 50HP Saildrive / Electric Hybrid', '', 1);
    insertSpec.run('sp-aq-5', 'prod-aqua-1360', 'Passenger Capacity', '30 Day Guests / 8 Berths', '', 1);
    insertSpec.run('sp-aq-6', 'prod-aqua-1360', 'Ocean Rating', 'CE Category A (Ocean Unrestricted)', '', 1);

    // 17. Multi-Role Fast Attack Patrol 2380 (Military Flagship from Military Brochure)
    insertProd.run(
      'prod-mil-fp2380',
      'cat-military',
      'MIL-PATROL-2380',
      'Multi-Role Fast Attack Patrol 2380 (23.8M Flagship)',
      '23.8m offshore naval attack and littoral interdiction vessel powered by twin 1400 HP MAN Rollo diesels (42 knots).',
      'From the official HPT-EO Governmental Support Line brochure. 23.80m length, 5.20m beam, 1.25m draft. Armored Level III wheelhouse, stabilized remote weapon station (RWS) mounts, 360° thermal tracking camera, radar with ARPA, and aft stern launch ramp for rapid deployment of an onboard 5.50m boarding RHIB.',
      1850000.0,
      1,
      240,
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=800',
      'Naval Military Standard,IACS,ISO 9001:2015'
    );
    insertSpec.run('sp-mp-1', 'prod-mil-fp2380', 'Length Overall (LOA)', '23.80', 'Meters', 1);
    insertSpec.run('sp-mp-2', 'prod-mil-fp2380', 'Beam Overall (BOA)', '5.20', 'Meters', 1);
    insertSpec.run('sp-mp-3', 'prod-mil-fp2380', 'Draft', '1.25', 'Meters', 1);
    insertSpec.run('sp-mp-4', 'prod-mil-fp2380', 'Main Engines', 'Twin MAN V12-1400 HP Rollo Marine Diesels', '', 1);
    insertSpec.run('sp-mp-5', 'prod-mil-fp2380', 'Maximum Speed', '42', 'Knots', 1);
    insertSpec.run('sp-mp-6', 'prod-mil-fp2380', 'Range @ 25 Knots', '650', 'Nautical Miles', 1);
    insertSpec.run('sp-mp-7', 'prod-mil-fp2380', 'Crew Accommodation', '8 Naval Crew + 6 Boarding Troops', '', 1);
    insertSpec.run('sp-mp-8', 'prod-mil-fp2380', 'Stern Ramp Launch', 'Interlocking Slipway for 5.50m Interceptor', '', 0);

    // 18. GRP Unmanned Surface Vehicle USV Patrol 5.60 JET (Autonomous USV from Military Brochure)
    insertProd.run(
      'prod-mil-usv560',
      'cat-military',
      'MIL-USV-560-JET',
      'GRP Unmanned Surface Vehicle USV Patrol 5.60 JET',
      'Autonomous USV drone boat with Castoldi Jet, Simrad Halo20+ radar, triple-sensor PTZ thermal turret, and Starlink BLOS.',
      'Covered in the HPT-EO Military Brochure 2026. Designed for perimeter defense, harbor reconnaissance, mine countermeasure support, and unmanned border patrol. Features HamiltonJet / Castoldi waterjet, autonomous GPS waypoint routing, obstacle collision avoidance, and beyond-line-of-sight satellite datalink.',
      185000.0,
      2,
      75,
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800',
      'Naval Autonomous Standard,ISO 9001:2015,CE'
    );
    insertSpec.run('sp-usv-1', 'prod-mil-usv560', 'Length Overall (LOA)', '5.60', 'Meters', 1);
    insertSpec.run('sp-usv-2', 'prod-mil-usv560', 'Beam Overall (BOA)', '2.10', 'Meters', 1);
    insertSpec.run('sp-usv-3', 'prod-mil-usv560', 'Propulsion', 'Castoldi Marine Jet 05 Drive', '', 1);
    insertSpec.run('sp-usv-4', 'prod-mil-usv560', 'Top Speed', '38', 'Knots', 1);
    insertSpec.run('sp-usv-5', 'prod-mil-usv560', 'Sensors Suite', 'Simrad Halo20+ Radar + Triple PTZ Thermal/Day Turret', '', 1);
    insertSpec.run('sp-usv-6', 'prod-mil-usv560', 'Communications', 'Starlink BLOS Satellite + Encrypted COFDM Mesh', '', 1);
    insertSpec.run('sp-usv-7', 'prod-mil-usv560', 'Autonomous Modes', 'Waypoint Navigation, Target Tracking, Geofence Patrol', '', 0);

    // 19. Economical Fast Response Inland Patrol Vessel Type 8.7 Multirole
    insertProd.run(
      'prod-mil-type87',
      'cat-military',
      'MIL-TYPE-8.7-INLAND',
      'Economical Fast Response Inland Patrol Vessel Type 8.7',
      '8.70m shallow draft aluminium riverine & estuary fast interdiction craft with ballistic glass and push knees.',
      'Featured in the Military Brochure Governmental Line. Engineered specifically for riverine patrols, shallow canal borders, and narcotics interdiction. Shallow draft of only 0.45m allows maneuvering in tidal shallows. Fitted with twin 200HP Yamaha engines, reinforced bow push knees, and heavy rubber fendering.',
      112000.0,
      3,
      55,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      'CE Category C,ISO 9001:2015,Defense Grade'
    );
    insertSpec.run('sp-t87-1', 'prod-mil-type87', 'Length Overall (LOA)', '8.70', 'Meters', 1);
    insertSpec.run('sp-t87-2', 'prod-mil-type87', 'Beam Overall (BOA)', '2.80', 'Meters', 1);
    insertSpec.run('sp-t87-3', 'prod-mil-type87', 'Shallow Draft', '0.45', 'Meters', 1);
    insertSpec.run('sp-t87-4', 'prod-mil-type87', 'Engines', 'Twin 200HP Marine Outboards', '', 1);
    insertSpec.run('sp-t87-5', 'prod-mil-type87', 'Top Speed', '40', 'Knots', 1);
    insertSpec.run('sp-t87-6', 'prod-mil-type87', 'Bow Features', 'Heavy-Duty Push Knees with Towing Bit', '', 0);

    db.exec(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES ('SEED', 'SYSTEM', 'INIT_MARINE', 'Database migrated to full HPT & Euro Offshore Joint Venture marine workboats and lifesaving catalog (19 vessel classes).')
    `);

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}


/**
 * Get all products with attached specifications and category details
 */
export function getAllProducts(filters?: {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params: (string | number)[] = [];

  if (filters?.categorySlug && filters.categorySlug !== 'all') {
    sql += ` AND c.slug = ?`;
    params.push(filters.categorySlug);
  }

  if (filters?.search) {
    sql += ` AND (p.title LIKE ? OR p.sku LIKE ? OR p.short_desc LIKE ?)`;
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }

  if (filters?.minPrice !== undefined) {
    sql += ` AND p.price_usd >= ?`;
    params.push(filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    sql += ` AND p.price_usd <= ?`;
    params.push(filters.maxPrice);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const products = db.prepare(sql).all(...params) as any[];

  // Attach specifications
  const specStmt = db.prepare(`
    SELECT spec_key as key, spec_value as value, unit, is_highlight as highlight
    FROM product_specifications
    WHERE product_id = ?
    ORDER BY is_highlight DESC, spec_key ASC
  `);

  return products.map((prod) => {
    const specs = specStmt.all(prod.id) as any[];
    return {
      ...prod,
      certifications: prod.certifications ? prod.certifications.split(',') : [],
      specifications: specs.map((s) => ({
        key: s.key,
        value: s.value,
        unit: s.unit || '',
        highlight: !!s.highlight,
      })),
    };
  });
}

/**
 * Get single product by ID or SKU
 */
export function getProductById(idOrSku: string) {
  const prod = db
    .prepare(
      `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? OR p.sku = ?
  `
    )
    .get(idOrSku, idOrSku) as any;

  if (!prod) return null;

  const specs = db
    .prepare(
      `
    SELECT spec_key as key, spec_value as value, unit, is_highlight as highlight
    FROM product_specifications
    WHERE product_id = ?
    ORDER BY is_highlight DESC, spec_key ASC
  `
    )
    .all(prod.id) as any[];

  return {
    ...prod,
    certifications: prod.certifications ? prod.certifications.split(',') : [],
    specifications: specs.map((s) => ({
      key: s.key,
      value: s.value,
      unit: s.unit || '',
      highlight: !!s.highlight,
    })),
  };
}

/**
 * Insert new product with specifications
 */
export function createProduct(
  data: {
    category_id: string;
    sku: string;
    title: string;
    short_desc?: string;
    description?: string;
    price_usd: number;
    stock_quantity: number;
    min_order_quantity?: number;
    lead_time_days?: number;
    image_url?: string;
    certifications?: string[];
  },
  specifications: { key: string; value: string; unit?: string; highlight?: boolean }[] = []
) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const certString = (data.certifications || ['ISO 9001:2015', 'CE']).join(',');

    db.prepare(`
      INSERT INTO products (
        id, category_id, sku, title, short_desc, description,
        price_usd, stock_quantity, min_order_quantity, lead_time_days,
        image_url, certifications, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      data.category_id,
      data.sku.toUpperCase(),
      data.title,
      data.short_desc || '',
      data.description || data.short_desc || '',
      data.price_usd || 0,
      data.stock_quantity || 0,
      data.min_order_quantity || 1,
      data.lead_time_days || 7,
      data.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
      certString
    );

    const insertSpec = db.prepare(`
      INSERT INTO product_specifications (id, product_id, spec_key, spec_value, unit, is_highlight)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    specifications.forEach((spec, idx) => {
      insertSpec.run(
        `sp_${id}_${idx}`,
        id,
        spec.key,
        spec.value,
        spec.unit || '',
        spec.highlight ? 1 : 0
      );
    });

    db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES ('CREATE_PRODUCT', 'PRODUCT', ?, ?)
    `).run(id, `Created product SKU ${data.sku} with ${specifications.length} specifications.`);

    db.exec('COMMIT;');
    return getProductById(id);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Update product
 */
export function updateProduct(
  idOrSku: string,
  data: Partial<{
    title: string;
    price_usd: number;
    stock_quantity: number;
    lead_time_days: number;
    short_desc: string;
    description: string;
    category_id: string;
    image_url: string;
  }>,
  specifications?: { key: string; value: string; unit?: string; highlight?: boolean }[]
) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const existing = db
      .prepare('SELECT id, sku FROM products WHERE id = ? OR sku = ?')
      .get(idOrSku, idOrSku) as { id: string; sku: string };
    if (!existing) {
      throw new Error(`Product not found: ${idOrSku}`);
    }

    const targetId = existing.id;
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(String(data.title));
    }
    if (data.price_usd !== undefined && !isNaN(Number(data.price_usd))) {
      updates.push('price_usd = ?');
      params.push(Number(data.price_usd));
    }
    if (data.stock_quantity !== undefined && !isNaN(Number(data.stock_quantity))) {
      updates.push('stock_quantity = ?');
      params.push(Math.round(Number(data.stock_quantity)));
    }
    if (data.lead_time_days !== undefined && !isNaN(Number(data.lead_time_days))) {
      updates.push('lead_time_days = ?');
      params.push(Math.round(Number(data.lead_time_days)));
    }
    if (data.short_desc !== undefined) {
      updates.push('short_desc = ?');
      params.push(String(data.short_desc));
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(String(data.description));
    }
    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(String(data.category_id));
    }
    if (data.image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(String(data.image_url));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 0) {
      params.push(targetId);
      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    if (specifications && Array.isArray(specifications)) {
      db.prepare('DELETE FROM product_specifications WHERE product_id = ?').run(targetId);
      const insertSpec = db.prepare(`
        INSERT INTO product_specifications (id, product_id, spec_key, spec_value, unit, is_highlight)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      specifications.forEach((spec, idx) => {
        insertSpec.run(`sp_${targetId}_${idx}`, targetId, spec.key, spec.value, spec.unit || '', spec.highlight ? 1 : 0);
      });
    }

    db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES ('UPDATE_PRODUCT', 'PRODUCT', ?, ?)
    `).run(targetId, `Updated product SKU ${existing.sku}`);

    db.exec('COMMIT;');
    return getProductById(targetId);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Delete product
 */
export function deleteProduct(id: string) {
  const existing = db.prepare('SELECT id, sku FROM products WHERE id = ?').get(id) as { id: string; sku: string };
  if (!existing) return false;

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM product_specifications WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES ('DELETE_PRODUCT', 'PRODUCT', ?, ?)
    `).run(id, `Deleted product SKU ${existing.sku}`);
    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Get all categories
 */
export function getAllCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
}

/**
 * RFQ (Request For Quotation) operations
 */
export function createQuotationRequest(data: {
  product_id?: string;
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  quantity_requested?: number;
  custom_specs?: string;
  reference_no?: string;
}) {
  const id = 'rfq_' + Date.now();
  const refNo = data.reference_no || generateQuotationRefNumber(id);

  db.prepare(`
    INSERT INTO quotation_requests (
      id, reference_no, product_id, customer_name, company_name, email, phone,
      quantity_requested, custom_specs, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    id,
    refNo,
    data.product_id || null,
    data.customer_name,
    data.company_name || '',
    data.email,
    data.phone || '',
    data.quantity_requested || 1,
    data.custom_specs || ''
  );

  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES ('CREATE_RFQ', 'RFQ', ?, ?)
  `).run(id, `Quotation request created with Ref ${refNo} by ${data.customer_name} (${data.company_name})`);

  return db.prepare('SELECT * FROM quotation_requests WHERE id = ?').get(id);
}

export function getAllQuotationRequests() {
  return db.prepare(`
    SELECT q.*, p.sku as product_sku, p.title as product_title
    FROM quotation_requests q
    LEFT JOIN products p ON q.product_id = p.id
    ORDER BY q.created_at DESC
  `).all();
}

export function updateQuotationStatus(id: string, status: string) {
  db.prepare('UPDATE quotation_requests SET status = ? WHERE id = ?').run(status, id);
  return db.prepare('SELECT * FROM quotation_requests WHERE id = ?').get(id);
}

/**
 * Raw query execution for Admin SQL Explorer
 */
export function executeRawQuery(sql: string, params: any[] = []) {
  const trimmed = sql.trim();
  if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
    const rows = db.prepare(trimmed).all(...params);
    return { type: 'SELECT', rows, count: rows.length };
  } else {
    db.exec(trimmed);
    return { type: 'EXEC', message: 'Executed query successfully' };
  }
}

/**
 * Get system statistics
 */
export function getSystemStats() {
  const productsCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any)?.c || 0;
  const categoriesCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any)?.c || 0;
  const rfqsCount = (db.prepare('SELECT COUNT(*) as c FROM quotation_requests').get() as any)?.c || 0;
  const lowStockCount = (db.prepare('SELECT COUNT(*) as c FROM products WHERE stock_quantity <= 5').get() as any)?.c || 0;
  const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10').all();

  return {
    productsCount,
    categoriesCount,
    rfqsCount,
    lowStockCount,
    recentLogs,
  };
}

// Automatically initialize on import
initializeDatabase();
