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

  // Seed data if products count is low or if local images are missing
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const hasStormTug = db.prepare("SELECT COUNT(*) as count FROM products WHERE sku = 'ST-80-TUG'").get() as { count: number };
  if (!countRow || countRow.count < 40 || !hasStormTug || hasStormTug.count === 0) {
    seedDatabase();
  }
}

export function seedDatabase() {
  db.exec('BEGIN TRANSACTION;');
  try {
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

    // 1. Alunautic WB 5.50
    insertProd.run(
      'prod-wb-550',
      'cat-alunautic',
      'ALU-WB-550',
      'Alunautic WB 5.50 Monohull Aluminium Workboat',
      'Heavy-duty 5.50m marine grade 5083 aluminium multirole workboat with self-bailing deck and heavy D-fendering.',
      'The Alunautic WB 5.50 is the battle-tested base platform specified in official offer HPT/256/10/26 R0. Built with certified marine grade 5083-H111 aluminium, polyurethane closed-cell positive buoyancy foam, ergonomic center steering console, and heavy-duty towing Samson posts. Compliant with ISO 9001:2015 and CE Category C standards.',
      48500.0,
      4,
      45,
      '/images/products/prod_alu_wb_550.png',
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
      'Engineered specifically for naval boarding, special forces support, and rapid port interception. Deep V Hull with beaching capacity. Reinforced transom accommodates single or twin outboards up to 100HP. Features non-slide floor, 4x2 foldable troop benches, dual offshore flush hoses, and certified lifting slings.',
      72000.0,
      3,
      60,
      '/images/products/prod_alu_ms_650.png',
      'ISO 9001:2015,CE Category C,Naval Defense Standard'
    );
    insertSpec.run('sp-ms-1', 'prod-alu-ms650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-ms-2', 'prod-alu-ms650', 'Beam Overall (BOA)', '2.40', 'Meters', 1);
    insertSpec.run('sp-ms-3', 'prod-alu-ms650', 'Weight (Lightship)', '500', 'kg', 1);
    insertSpec.run('sp-ms-4', 'prod-alu-ms650', 'Hull Material', 'Marine Grade Aluminium 5083', '', 1);
    insertSpec.run('sp-ms-5', 'prod-alu-ms650', 'Troop Capacity', '4x2 Foldable Benches (12 Seated)', 'Persons', 1);
    insertSpec.run('sp-ms-6', 'prod-alu-ms650', 'Engines Max', 'Outboard 100 HP Max', '', 1);
    insertSpec.run('sp-ms-7', 'prod-alu-ms650', 'Beaching Capacity', 'Extra Aluminium V Protection on Keel', '', 0);

    // 3. Alunautic Windmill 14M / 16M Offshore Cabin Patrol
    insertProd.run(
      'prod-alu-wm14',
      'cat-alunautic',
      'ALU-WM-1400',
      'Alunautic Windmill 14M Enclosed Offshore Cabin Patrol',
      '14-meter all-weather offshore windfarm and coastal patrol vessel with climate-controlled cabin and shock seating.',
      'Designed for severe offshore conditions (Sea State 5+). Equipped with twin Scania or Volvo Penta 650HP marine diesels driving HamiltonJet waterjets or sterndrives. Enclosed wheelhouse seats 12 technicians plus 2 crew with Ullman suspension seats, thermal night vision, and boarding bow fender.',
      480000.0,
      1,
      120,
      '/images/products/prod_alu_wm_1400.png',
      'RINA,IACS,CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-wm-1', 'prod-alu-wm14', 'Length Overall (LOA)', '14.20', 'Meters', 1);
    insertSpec.run('sp-wm-2', 'prod-alu-wm14', 'Beam Overall (BOA)', '4.60', 'Meters', 1);
    insertSpec.run('sp-wm-3', 'prod-alu-wm14', 'Draft', '0.85', 'Meters', 1);
    insertSpec.run('sp-wm-4', 'prod-alu-wm14', 'Main Engines', 'Twin Scania DI13 650HP Marine Diesels', '', 1);
    insertSpec.run('sp-wm-5', 'prod-alu-wm14', 'Max Speed', '36', 'Knots', 1);
    insertSpec.run('sp-wm-6', 'prod-alu-wm14', 'Passenger Capacity', '12 Pax + 2 Crew', '', 1);
    insertSpec.run('sp-wm-7', 'prod-alu-wm14', 'Fuel Capacity', '1,800', 'Liters', 0);

    // 4. Alunautic Windmill 12M Cabin Patrol
    insertProd.run(
      'prod-alu-wm12',
      'cat-alunautic',
      'ALU-WM-1200',
      'Alunautic Windmill 12M Heavy Duty Patrol Launch',
      '12-meter proven patrol concept used worldwide for border control, ambulance services, and general military duties.',
      'Powered by twin inboard diesel with Sterndrives, Surface drives or Waterjets from twin 350HP up to 650HP per engine. Outboard configurations possible with twin or triple engines. Class approved design with rapid delivery capability.',
      385000.0,
      2,
      90,
      '/images/products/prod_alu_wm_1400.png',
      'CE Category B,ISO 9001:2015,Class Approved'
    );
    insertSpec.run('sp-wm12-1', 'prod-alu-wm12', 'Length Overall (LOA)', '12.00', 'Meters', 1);
    insertSpec.run('sp-wm12-2', 'prod-alu-wm12', 'Inside Width', '4.30', 'Meters', 1);
    insertSpec.run('sp-wm12-3', 'prod-alu-wm12', 'Tank Capacity', '3,000', 'Liters', 1);
    insertSpec.run('sp-wm12-4', 'prod-alu-wm12', 'Cargo Capacity', '4,000', 'kg', 1);
    insertSpec.run('sp-wm12-5', 'prod-alu-wm12', 'Max Power', '1,500', 'CV', 1);

    // 5. Alunautic LC 850 Landing Craft
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
      '/images/products/prod_alu_lc_850.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-lc-1', 'prod-alu-lc850', 'Length Overall (LOA)', '8.50', 'Meters', 1);
    insertSpec.run('sp-lc-2', 'prod-alu-lc850', 'Beam Overall (BOA)', '2.80', 'Meters', 1);
    insertSpec.run('sp-lc-3', 'prod-alu-lc850', 'Bow Ramp Width', '1.60', 'Meters', 1);
    insertSpec.run('sp-lc-4', 'prod-alu-lc850', 'Payload Deck Cargo', '2,500', 'kg', 1);
    insertSpec.run('sp-lc-5', 'prod-alu-lc850', 'Power Options', 'Twin 150HP Outboard Engines', '', 1);

    // 6. Alunautic LC 1050 with Deck Crane
    insertProd.run(
      'prod-alu-lc-crane',
      'cat-alunautic',
      'ALU-LC-1050-CRANE',
      'Alunautic LC 1050 Landing Craft with Deck Crane',
      '10.50m multirole aluminium landing craft equipped with hydraulic knuckle-boom crane and aft wheelhouse.',
      'Features heavy deck cargo loading capacity, hydraulic bow ramp for vehicular boarding, high-output auxiliary generator, and dedicated knuckle-boom crane for offshore buoy handling and container logistics.',
      165000.0,
      1,
      90,
      '/images/products/prod_alu_lc_crane.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-lcc-1', 'prod-alu-lc-crane', 'Length Overall (LOA)', '10.50', 'Meters', 1);
    insertSpec.run('sp-lcc-2', 'prod-alu-lc-crane', 'Beam Overall (BOA)', '3.20', 'Meters', 1);
    insertSpec.run('sp-lcc-3', 'prod-alu-lc-crane', 'Deck Equipment', 'Hydraulic Knuckle Crane + Bow Ramp', '', 1);
    insertSpec.run('sp-lcc-4', 'prod-alu-lc-crane', 'Deck Cargo Capacity', '3,500', 'kg', 1);

    // 7. Alunautic Patrol 7M Aluminium
    insertProd.run(
      'prod-alu-patrol-7m',
      'cat-alunautic',
      'ALU-PAT-700',
      'Alunautic Patrol 7M Multirole Aluminium Vessel',
      '7.00m length, 3.30m inside width, 500L fuel capacity, 1200 kg cargo capacity, 500 CV max power.',
      'From the official Aluminium Patrol Line 7m-12m. Constructed from 4 to 6 mm marine quality aluminium plates with hand-made longitudinal and transversal framing. Standard foam buoyancy system, 2 bollards, anchor compartment with hatch.',
      78000.0,
      3,
      45,
      '/images/products/prod_alu_patrol_7m.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-p7-1', 'prod-alu-patrol-7m', 'Length', '7.00', 'Meters', 1);
    insertSpec.run('sp-p7-2', 'prod-alu-patrol-7m', 'Inside Width', '3.30', 'Meters', 1);
    insertSpec.run('sp-p7-3', 'prod-alu-patrol-7m', 'Tank Capacity', '500', 'Liters', 1);
    insertSpec.run('sp-p7-4', 'prod-alu-patrol-7m', 'Cargo Capacity', '1,200', 'kg', 1);
    insertSpec.run('sp-p7-5', 'prod-alu-patrol-7m', 'Max Power', '500', 'CV', 1);
    insertSpec.run('sp-p7-6', 'prod-alu-patrol-7m', 'Bare Hull Weight', '900', 'kg', 0);

    // 8. Alunautic SAR 950 Orange All-Weather Cabin
    insertProd.run(
      'prod-alu-sar-orange',
      'cat-alunautic',
      'ALU-SAR-950',
      'Alunautic SAR 950 All-Weather Rescue & Pilot Cabin',
      '9.50m high-visibility orange SAR and pilot boat with insulated wheelhouse and heavy perimeter D-fendering.',
      'Engineered for search and rescue operations in zero-visibility conditions. Features heated cabin glass, Simrad radar, searchlights, survivor recovery platform, and twin marine diesel sterndrives.',
      185000.0,
      2,
      65,
      '/images/products/prod_alu_patrol_orange.png',
      'CE Category B,MED,ISO 9001:2015'
    );
    insertSpec.run('sp-sar-1', 'prod-alu-sar-orange', 'Length Overall', '9.50', 'Meters', 1);
    insertSpec.run('sp-sar-2', 'prod-alu-sar-orange', 'Beam Overall', '3.10', 'Meters', 1);
    insertSpec.run('sp-sar-3', 'prod-alu-sar-orange', 'Visibility Livery', 'High-Vis Maritime SAR Orange', '', 1);

    // 9. Blue Spirit Patrol RHIB 650 Open
    insertProd.run(
      'prod-bs-650',
      'cat-bluespirit',
      'BS-RIB-650',
      'Blue Spirit Patrol RHIB 650 Professional Interceptor',
      '6.50m professional GRP deep-V rigid inflatable with heavy Orca Hypalon 1670 dtex 5-chamber tubes.',
      'Blue Spirit boats division high-performance interceptor. Deep-V composite hull delivers unmatched wave-cutting capabilities in open sea chop. Features stainless steel A-frame with LED navigation lights, radar arch, jockey console, and SOLAS rescue equipment brackets. Transport capacity 10 pax, 150 CV max power.',
      59000.0,
      5,
      40,
      '/images/products/prod_bs_650_profile.png',
      'SOLAS,CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-bs-1', 'prod-bs-650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-bs-2', 'prod-bs-650', 'Beam Overall (BOA)', '2.52', 'Meters', 1);
    insertSpec.run('sp-bs-3', 'prod-bs-650', 'Inside Width', '2.40', 'Meters', 1);
    insertSpec.run('sp-bs-4', 'prod-bs-650', 'Tube Diameter', '0.55', 'Meters', 1);
    insertSpec.run('sp-bs-5', 'prod-bs-650', 'Tube Fabric', 'Orca Hypalon 1670 dtex (5 Chambers)', '', 1);
    insertSpec.run('sp-bs-6', 'prod-bs-650', 'Transport Capacity', '10', 'Persons', 1);
    insertSpec.run('sp-bs-7', 'prod-bs-650', 'Max Power', '150', 'CV', 1);
    insertSpec.run('sp-bs-8', 'prod-bs-650', 'Cargo Capacity', '2,450', 'kg', 0);

    // 10. Blue Spirit Patrol RHIB 820 Cabin
    insertProd.run(
      'prod-bs-820c',
      'cat-bluespirit',
      'BS-RIB-820C',
      'Blue Spirit Patrol RHIB 820 Enclosed Wheelhouse',
      '8.20m GRP rigid inflatable with enclosed pilot cabin, climate control, 600L fuel tank, and 2x175 CV power.',
      'Combines the stability and buoyancy of an offshore RHIB with an insulated, weatherproof cabin. Transport capacity 20 pax, 2800 kg cargo capacity. Fitted with twin Yamaha or Mercury engines. Designed for 24/7 port security, coast guard surveillance, and SAR patrol in cold or torrential climates.',
      145000.0,
      2,
      70,
      '/images/products/prod_bs_rib_820c.png',
      'CE Category B,RINA,ISO 9001:2015'
    );
    insertSpec.run('sp-bsc-1', 'prod-bs-820c', 'Length Overall (LOA)', '8.20', 'Meters', 1);
    insertSpec.run('sp-bsc-2', 'prod-bs-820c', 'Beam Overall (BOA)', '2.85', 'Meters', 1);
    insertSpec.run('sp-bsc-3', 'prod-bs-820c', 'Inside Width', '2.20', 'Meters', 1);
    insertSpec.run('sp-bsc-4', 'prod-bs-820c', 'Tube Diameter', '0.55', 'Meters', 1);
    insertSpec.run('sp-bsc-5', 'prod-bs-820c', 'Tank Capacity', '600', 'Liters', 0);
    insertSpec.run('sp-bsc-6', 'prod-bs-820c', 'Transport Capacity', '20', 'Persons', 1);
    insertSpec.run('sp-bsc-7', 'prod-bs-820c', 'Max Power', '2 x 175', 'CV', 1);
    insertSpec.run('sp-bsc-8', 'prod-bs-820c', 'Cargo Capacity', '2,800', 'kg', 0);

    // 11. Blue Spirit 1120 Interceptor RHIB
    insertProd.run(
      'prod-bs-1120',
      'cat-bluespirit',
      'BS-RIB-1120',
      'Blue Spirit 1120 High-Speed Tactical Interceptor RHIB',
      '11.20m naval interceptor powered by triple 350HP outboard engines, reaching 55+ knots with 10 shock-absorbing seats.',
      'The pinnacle of rapid response marine interdiction. Features stepped high-speed GRP monohull, military-spec Hypalon collar with internal polyurethane foam inserts, tactical command console, ballistic protection panels, and heavy-duty towing bollards. Transport capacity 36 pax, 3600 kg cargo capacity.',
      295000.0,
      1,
      90,
      '/images/products/prod_bs_rib_1120.png',
      'CE Category B,IACS,Naval Tactical Code'
    );
    insertSpec.run('sp-bs11-1', 'prod-bs-1120', 'Length Overall (LOA)', '11.20', 'Meters', 1);
    insertSpec.run('sp-bs11-2', 'prod-bs-1120', 'Beam Overall (BOA)', '3.40', 'Meters', 1);
    insertSpec.run('sp-bs11-3', 'prod-bs-1120', 'Inside Width', '2.80', 'Meters', 1);
    insertSpec.run('sp-bs11-4', 'prod-bs-1120', 'Tube Diameter', '0.65', 'Meters', 1);
    insertSpec.run('sp-bs11-5', 'prod-bs-1120', 'Tank Capacity', '600', 'Liters', 0);
    insertSpec.run('sp-bs11-6', 'prod-bs-1120', 'Transport Capacity', '36', 'Persons', 1);
    insertSpec.run('sp-bs11-7', 'prod-bs-1120', 'Max Power', '2 x 350 (or Triple 350HP)', 'CV', 1);
    insertSpec.run('sp-bs11-8', 'prod-bs-1120', 'Top Speed', '55+', 'Knots', 1);
    insertSpec.run('sp-bs11-9', 'prod-bs-1120', 'Cargo Capacity', '3,600', 'kg', 0);

    // 12. GRP Wide Body Boat 10.5M - 14M
    insertProd.run(
      'prod-bs-widebody',
      'cat-bluespirit',
      'BS-WB-1400',
      'GRP Wide Body Vessel 10.5M - 14M Commercial Platform',
      'Heavy beam wide-body GRP workboat available from 10.5 to 14 meters in open or enclosed cabin configurations.',
      'From page 11 of the Military Brochure. Offers exceptional internal deck volume and load capacity. Single or twin diesel inboard or single/twin outboard power options. Ideal for dive operations, oil spill response, and heavy commercial logistics.',
      265000.0,
      1,
      100,
      '/images/products/prod_bs_widebody.png',
      'CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-wb-b-1', 'prod-bs-widebody', 'Length Options', '10.50 to 14.00', 'Meters', 1);
    insertSpec.run('sp-wb-b-2', 'prod-bs-widebody', 'Hull Architecture', 'GRP Wide Body Monohull', '', 1);

    // 13. Blue Spirit Stealth Tactical RHIB
    insertProd.run(
      'prod-bs-stealth',
      'cat-bluespirit',
      'BS-STEALTH-900',
      'Blue Spirit Stealth All-Black Tactical RHIB 9.00M',
      '9.00m matte black tactical boarding RHIB with low visual and thermal infrared signature.',
      'Equipped with black Orca Hypalon collar, black anodized T-top, night vision thermal turret, and multi-point weapon mount pintles for naval boarding teams and special maritime units.',
      175000.0,
      2,
      60,
      '/images/products/prod_bs_rib_stealth.png',
      'Naval Defense Code,ISO 9001:2015'
    );
    insertSpec.run('sp-stl-1', 'prod-bs-stealth', 'Length Overall', '9.00', 'Meters', 1);
    insertSpec.run('sp-stl-2', 'prod-bs-stealth', 'Livery & Signature', 'Matte Black Low-IR Reflection', '', 1);

    // 14. Fibre Shark Pilot 1050 GRP Workboat
    insertProd.run(
      'prod-fs-pilot1050',
      'cat-fibreshark',
      'FS-PILOT-1050',
      'Fibre Shark Pilot 1050 Heavy Duty GRP Pilot Launch',
      '10.50m heavy glass-reinforced composite pilot boat engineered for 24/7 port duty and pilot transfer.',
      'Fibre Shark Boats division flagship pilot vessel (KIM LONG Pilots). Features thick solid laminate GRP hull with vinylester resin barrier, perimeter bonded elastomeric fender, heated wheelhouse windows, Yanmar 450HP diesel with V-drive or sterndrive, and non-slip boarding platform.',
      245000.0,
      2,
      90,
      '/images/products/prod_fs_pilot_1050.png',
      'CE Category B,Bureau Veritas / RINA,ISO 9001:2015'
    );
    insertSpec.run('sp-fsp-1', 'prod-fs-pilot1050', 'Length Overall (LOA)', '10.50', 'Meters', 1);
    insertSpec.run('sp-fsp-2', 'prod-fs-pilot1050', 'Beam Overall (BOA)', '3.40', 'Meters', 1);
    insertSpec.run('sp-fsp-3', 'prod-fs-pilot1050', 'Draft', '0.90', 'Meters', 1);
    insertSpec.run('sp-fsp-4', 'prod-fs-pilot1050', 'Engine', 'Single Yanmar 6CX-GTYE 450HP Diesel', '', 1);
    insertSpec.run('sp-fsp-5', 'prod-fs-pilot1050', 'Service Speed', '26', 'Knots', 1);
    insertSpec.run('sp-fsp-6', 'prod-fs-pilot1050', 'Fendering', 'Solid Elastomer Continuous D-Section', '', 0);

    // 15. Fibre Shark Fast Passenger Catamaran 1400
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
      '/images/products/prod_fs_cat_1400.png',
      'RINA Passenger Class,CE Category B,IACS'
    );
    insertSpec.run('sp-fsc-1', 'prod-fs-cat1400', 'Length Overall (LOA)', '14.20', 'Meters', 1);
    insertSpec.run('sp-fsc-2', 'prod-fs-cat1400', 'Beam Overall (BOA)', '5.40', 'Meters', 1);
    insertSpec.run('sp-fsc-3', 'prod-fs-cat1400', 'Engines', 'Twin Volvo Penta D8-550HP Marine Diesels', '', 1);
    insertSpec.run('sp-fsc-4', 'prod-fs-cat1400', 'Cruise Speed', '28', 'Knots', 1);
    insertSpec.run('sp-fsc-5', 'prod-fs-cat1400', 'Passenger Capacity', '48 Passengers + 2 Crew', '', 1);
    insertSpec.run('sp-fsc-6', 'prod-fs-cat1400', 'Fuel Capacity', '2 x 800', 'Liters', 0);

    // 16. Fibre Shark 900 Multirole GRP Workboat
    insertProd.run(
      'prod-fs-wb900',
      'cat-fibreshark',
      'FS-WB-900',
      'Fibre Shark 900 Multirole GRP Center Console Workboat',
      '9.00m robust composite workboat with rigid T-top, center console, and open self-bailing deck.',
      'Built with marine grade isophtalic GRP resin. Features side diving ladder, towing samson post, forward storage hold, and capacity for single or twin outboards up to 300HP.',
      89000.0,
      3,
      50,
      '/images/products/prod_fs_wb_900.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-fs9-1', 'prod-fs-wb900', 'Length Overall', '9.00', 'Meters', 1);
    insertSpec.run('sp-fs9-2', 'prod-fs-wb900', 'Beam Overall', '3.00', 'Meters', 1);

    // 17. Fibre Shark Police Port Authority Launch
    insertProd.run(
      'prod-fs-police',
      'cat-fibreshark',
      'FS-POLICE-950',
      'Fibre Shark 950 Port Police & Law Enforcement Launch',
      '9.50m enclosed composite patrol vessel for harbor masters, border police, and customs operations.',
      'Reinforced rub-rail fendering, blue law enforcement flashers, high-output marine diesel, wheelhouse climate control, and encrypted marine VHF/AIS transponder system.',
      195000.0,
      2,
      75,
      '/images/products/prod_fs_police.png',
      'CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-pol-1', 'prod-fs-police', 'Length Overall', '9.50', 'Meters', 1);
    insertSpec.run('sp-pol-2', 'prod-fs-police', 'Mission Suite', 'Harbor Law Enforcement & Boarding', '', 1);

    // 18. Fibre Shark VIP Enclosed Water Taxi
    insertProd.run(
      'prod-fs-watertaxi',
      'cat-fibreshark',
      'FS-WATER-TAXI',
      'Fibre Shark Enclosed VIP Water Taxi & Limousine Tender',
      '10.00m luxury enclosed passenger transport with panoramic salon windows, leather seating, and sound insulation.',
      'Engineered for premium harbor guest transit, resort shuttle services, and yacht tender logistics. Accommodates 16 seated passengers in climate-controlled luxury with quiet inboard diesel propulsion.',
      225000.0,
      1,
      80,
      '/images/products/prod_fs_watertaxi.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-wt-1', 'prod-fs-watertaxi', 'Length Overall', '10.00', 'Meters', 1);
    insertSpec.run('sp-wt-2', 'prod-fs-watertaxi', 'Passenger Capacity', '16 Seated Luxury Pax', '', 1);

    // 19. HDPE 800 Indestructible Landing Craft
    insertProd.run(
      'prod-hdpe-lc800',
      'cat-hdpe',
      'HDPE-LC-800',
      'HDPE 800 Indestructible Landing Craft Workboat',
      '8.00m High-Density Polyethylene indestructible landing craft. 100% recyclable, zero corrosion, 5-year hull warranty.',
      'HDPE Workboats division craft. The hull is completely impervious to corrosion, osmosis, and marine fouling. Needs no anti-fouling paint or anodes. The elasticity of HDPE absorbs violent rock and pier impacts without cracking or denting. Bullet proof: small caliber rounds are absorbed in HDPE plates. Bow ramp opens for loading quads and supplies.',
      88000.0,
      3,
      50,
      '/images/products/prod_hdpe_lc_800.png',
      'CE Category C,ISO 9001:2015,5-Year Warranty'
    );
    insertSpec.run('sp-hdp-1', 'prod-hdpe-lc800', 'Length Overall (LOA)', '8.00', 'Meters', 1);
    insertSpec.run('sp-hdp-2', 'prod-hdpe-lc800', 'Beam Overall (BOA)', '2.70', 'Meters', 1);
    insertSpec.run('sp-hdp-3', 'prod-hdpe-lc800', 'Material', 'High-Density Polyethylene PE100', '', 1);
    insertSpec.run('sp-hdp-4', 'prod-hdpe-lc800', 'Hull Maintenance', 'Zero Painting / Zero Anodes Required', '', 1);
    insertSpec.run('sp-hdp-5', 'prod-hdpe-lc800', 'Engines', 'Twin 150HP Marine Outboards', '', 1);
    insertSpec.run('sp-hdp-6', 'prod-hdpe-lc800', 'Max Speed', '36', 'Knots', 1);
    insertSpec.run('sp-hdp-7', 'prod-hdpe-lc800', 'Hull Warranty', '5', 'Years', 1);

    // 20. HDPE Patrol RHIB 900 Solid D-Fender
    insertProd.run(
      'prod-hdpe-pat900',
      'cat-hdpe',
      'HDPE-PAT-900',
      'HDPE Patrol 900 with Solid Foam Polyurea D-Fender',
      '9.00m HDPE heavy patrol craft with bullet-absorbent hull properties and puncture-proof solid polyurea D-fenders.',
      'Built for extreme duty operations. High-molecular weight HDPE absorbs ballistic shrapnel better than aluminum or GRP. Features center walk-around console with enclosed cabin option, twin Mercury SeaPro 200HP outboards, stainless steel crash rails, and shock-cushioned helm.',
      138000.0,
      2,
      65,
      '/images/products/prod_hdpe_pat_900.png',
      'CE Category B,ISO 9001:2015,5-Year Hull Warranty'
    );
    insertSpec.run('sp-hp9-1', 'prod-hdpe-pat900', 'Length Overall (LOA)', '9.00', 'Meters', 1);
    insertSpec.run('sp-hp9-2', 'prod-hdpe-pat900', 'Beam Overall (BOA)', '3.00', 'Meters', 1);
    insertSpec.run('sp-hp9-3', 'prod-hdpe-pat900', 'Fender System', '100% Solid Foam Filled Polyurea D-Fender', '', 1);
    insertSpec.run('sp-hp9-4', 'prod-hdpe-pat900', 'Ballistic Absorption', 'High Impact Energy Dissipation', '', 1);
    insertSpec.run('sp-hp9-5', 'prod-hdpe-pat900', 'Engines', 'Twin Mercury SeaPro 200HP Outboards', '', 1);
    insertSpec.run('sp-hp9-6', 'prod-hdpe-pat900', 'Top Speed', '40', 'Knots', 1);

    // 21. HDPE Surf Tactical Fast Interceptor
    insertProd.run(
      'prod-hdpe-surf',
      'cat-hdpe',
      'HDPE-SURF-750',
      'HDPE Surf Tactical 750 Extreme Impact Interceptor',
      '7.50m indestructible HDPE hull designed for violent surf beach landings, river rapids, and high-abrasion duties.',
      'Impervious to rocky groundings, oyster beds, and pier impacts. High-tensile HDPE welding with multiple buoyancy chambers. 5-year plate material factory warranty.',
      79000.0,
      4,
      40,
      '/images/products/prod_hdpe_surf.png',
      'CE Category C,5-Year Warranty,ISO 9001:2015'
    );
    insertSpec.run('sp-srf-1', 'prod-hdpe-surf', 'Length Overall', '7.50', 'Meters', 1);
    insertSpec.run('sp-srf-2', 'prod-hdpe-surf', 'Material Property', 'Impact & Ballistic Shrapnel Absorption', '', 1);

    // 22. EO Lifesaving TEMPSC Enclosed Lifeboat 7.50M
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
      '/images/products/prod_eo_tempsc_750.png',
      'SOLAS 74/96,IMO LSA Code,MED Wheelmark,DNV-GL'
    );
    insertSpec.run('sp-tmp-1', 'prod-eo-tempsc75', 'Length Overall (LOA)', '7.50', 'Meters', 1);
    insertSpec.run('sp-tmp-2', 'prod-eo-tempsc75', 'Beam Overall (BOA)', '2.70', 'Meters', 1);
    insertSpec.run('sp-tmp-3', 'prod-eo-tempsc75', 'Certified Capacity', '45', 'Persons', 1);
    insertSpec.run('sp-tmp-4', 'prod-eo-tempsc75', 'Certification', 'SOLAS / MED Wheelmark / IMO LSA Code', '', 1);
    insertSpec.run('sp-tmp-5', 'prod-eo-tempsc75', 'Fire Protection', 'Deluge Spray Skid + 3x 50L Air Cylinders', '', 1);
    insertSpec.run('sp-tmp-6', 'prod-eo-tempsc75', 'Engine', 'Bukh / Yanmar 29HP Inboard Marine Diesel', '', 1);

    // 23. EO Lifesaving Freefall Lifeboat FF 600
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
      '/images/products/prod_eo_ff_600.png',
      'SOLAS,MED Wheelmark,RINA,BV'
    );
    insertSpec.run('sp-ff-1', 'prod-eo-ff600', 'Length Overall (LOA)', '6.05', 'Meters', 1);
    insertSpec.run('sp-ff-2', 'prod-eo-ff600', 'Maximum Drop Height', '25', 'Meters', 1);
    insertSpec.run('sp-ff-3', 'prod-eo-ff600', 'Person Capacity', '32', 'Persons', 1);
    insertSpec.run('sp-ff-4', 'prod-eo-ff600', 'Engine', 'Steyr / Bukh Marine Diesel 28HP', '', 1);
    insertSpec.run('sp-ff-5', 'prod-eo-ff600', 'Class Approval', 'SOLAS / MED / IACS Class Certified', '', 1);

    // 24. EO Fast Rescue Boat FRB 650 Jet
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
      '/images/products/prod_eo_frb_650.png',
      'SOLAS 74/96,MED Wheelmark,DNV-GL,IMO MSC/Circ.809'
    );
    insertSpec.run('sp-frb-1', 'prod-eo-frb650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-frb-2', 'prod-eo-frb650', 'Beam Overall (BOA)', '2.50', 'Meters', 1);
    insertSpec.run('sp-frb-3', 'prod-eo-frb650', 'Engine & Jet', 'Steyr SE166E28 (163HP) + Castoldi Jet 05', '', 1);
    insertSpec.run('sp-frb-4', 'prod-eo-frb650', 'Max Speed', '35', 'Knots', 1);
    insertSpec.run('sp-frb-5', 'prod-eo-frb650', 'Lifting Hook', 'Henriksen Single-Point Off-Load Hook', '', 1);
    insertSpec.run('sp-frb-6', 'prod-eo-frb650', 'Self-Righting', 'Automatic CO2 Airbag Roll-Bar System', '', 1);

    // 25. EO Slewing Davit Launching System SWL 25kN
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
      '/images/products/prod_eo_davit_25.png',
      'SOLAS 74/96,MED Wheelmark,DNV-GL,Bureau Veritas'
    );
    insertSpec.run('sp-dav-1', 'prod-eo-davit25', 'Safe Working Load (SWL)', '25', 'kN (2,550 kg)', 1);
    insertSpec.run('sp-dav-2', 'prod-eo-davit25', 'Max Lowering Speed', '45', 'm/min', 1);
    insertSpec.run('sp-dav-3', 'prod-eo-davit25', 'Max Slewing Angle', '330', 'Degrees', 1);
    insertSpec.run('sp-dav-4', 'prod-eo-davit25', 'Hydraulic System', 'Integrated HPU with 15kW Motor + Hand Pump', '', 1);
    insertSpec.run('sp-dav-5', 'prod-eo-davit25', 'Emergency Operation', 'Full Gravity Lowering Without Power', '', 0);

    // 26. AquaCat 13.60M Modular Tourist Catamaran
    insertProd.run(
      'prod-aqua-1360',
      'cat-aquacat',
      'AQUA-CAT-1360',
      'AquaCat 13.60M Modular Tourist & Motor Catamaran with Flybridge',
      '13.60m modular catamaran with AQ Lego containerized kit design for cost-effective global 40ft container shipping.',
      'AquaCat Holland joint venture innovation. Engineered with proprietary AQ Lego modular assembly so that both hulls, bridge deck, and salon fit into standard 40-foot sea freight shipping containers, drastically slashing international delivery costs. Available in Tourist day charter (30 Pax) or Family Liveaboard configurations.',
      360000.0,
      1,
      120,
      '/images/products/prod_aqua_cat_1360.png',
      'CE Category A Ocean,ISO 9001:2015,Dutch Maritime Standard'
    );
    insertSpec.run('sp-aq-1', 'prod-aqua-1360', 'Length Overall (LOA)', '13.60', 'Meters', 1);
    insertSpec.run('sp-aq-2', 'prod-aqua-1360', 'Beam Overall (BOA)', '6.20', 'Meters', 1);
    insertSpec.run('sp-aq-3', 'prod-aqua-1360', 'Transport System', 'Modular AQ Lego System (Fits in 40ft Containers)', '', 1);
    insertSpec.run('sp-aq-4', 'prod-aqua-1360', 'Propulsion', 'Twin 50HP Saildrive / Electric Hybrid', '', 1);
    insertSpec.run('sp-aq-5', 'prod-aqua-1360', 'Passenger Capacity', '30 Day Guests / 8 Berths', '', 1);
    insertSpec.run('sp-aq-6', 'prod-aqua-1360', 'Ocean Rating', 'CE Category A (Ocean Unrestricted)', '', 1);

    // 27. AquaCat 12.50M Modular Sailing Catamaran
    insertProd.run(
      'prod-aqua-sail',
      'cat-aquacat',
      'AQUA-CAT-1250-SAIL',
      'AquaCat 12.50M Modular Sailing Catamaran (Containerized)',
      '12.50m performance sailing catamaran with dual stepped hulls, high aspect rig, and AQ Lego container shipping.',
      'Designed for blue-water ocean cruising and charter. Both hulls and bridge deck detach and pack directly into two standard 40-foot ISO containers. Assembled on-site by certified factory engineers at client slipway.',
      310000.0,
      1,
      110,
      '/images/products/prod_aqua_cat_sail.png',
      'CE Category A Ocean,ISO 9001:2015'
    );
    insertSpec.run('sp-aqs-1', 'prod-aqua-sail', 'Length Overall', '12.50', 'Meters', 1);
    insertSpec.run('sp-aqs-2', 'prod-aqua-sail', 'Beam Overall', '5.80', 'Meters', 1);

    // 28. Multi-Role Fast Attack Patrol 2380 (Military Flagship)
    insertProd.run(
      'prod-mil-fp2380',
      'cat-military',
      'MIL-PATROL-2380',
      'Multi-Role Fast Attack Patrol 2380 (23.8M Flagship)',
      '23.8m offshore naval attack and littoral interdiction vessel powered by twin 1400 HP MAN Rollo diesels (38-42 knots).',
      'From the official HPT-EO Governmental Support Line brochure (pages 7 and 13). 23.80m length, 5.20m beam. Fuel capacity 18 tons. Armored Level III wheelhouse, stabilized remote weapon station (RWS) mounts, 360° thermal tracking camera, radar with ARPA, and aft stern launch ramp for rapid deployment of an onboard 5.50m boarding RHIB.',
      1850000.0,
      1,
      240,
      '/images/products/prod_mil_patrol_2380.png',
      'Naval Military Standard,IACS,ISO 9001:2015'
    );
    insertSpec.run('sp-mp-1', 'prod-mil-fp2380', 'Length Overall (LOA)', '23.80', 'Meters', 1);
    insertSpec.run('sp-mp-2', 'prod-mil-fp2380', 'Beam Overall (BOA)', '5.20', 'Meters', 1);
    insertSpec.run('sp-mp-3', 'prod-mil-fp2380', 'Draft', '1.25', 'Meters', 1);
    insertSpec.run('sp-mp-4', 'prod-mil-fp2380', 'Main Engines', 'Twin MAN V12-1400 HP Rollo Marine Diesels', '', 1);
    insertSpec.run('sp-mp-5', 'prod-mil-fp2380', 'Maximum Speed', '38-42', 'Knots', 1);
    insertSpec.run('sp-mp-6', 'prod-mil-fp2380', 'Fuel Capacity', '18', 'Tons (18,000 kg)', 1);
    insertSpec.run('sp-mp-7', 'prod-mil-fp2380', 'Range @ 25 Knots', '650', 'Nautical Miles', 1);
    insertSpec.run('sp-mp-8', 'prod-mil-fp2380', 'Crew Accommodation', '8 Naval Crew + 6 Boarding Troops', '', 1);
    insertSpec.run('sp-mp-9', 'prod-mil-fp2380', 'Stern Ramp Launch', 'Interlocking Slipway for 5.50m Interceptor', '', 0);

    // 29. GRP Unmanned Surface Vehicle USV Patrol 5.60 JET
    insertProd.run(
      'prod-mil-usv560',
      'cat-military',
      'MIL-USV-560-JET',
      'GRP Unmanned Surface Vehicle USV Patrol 5.60 JET',
      'Autonomous USV drone boat with Castoldi Jet, Simrad Halo20+ radar, triple-sensor PTZ thermal turret, and Starlink BLOS.',
      'Covered in the HPT-EO Military Brochure 2026 (pages 8 and 14-15). Multirole patrol and attack 5.6m single inboard 250HP gasoline coupled to a waterjet. 200L fuel capacity, 250kg cargo capacity. Autonomous navigation with waypoint planning, geofencing, failsafe return-to-base protocols, real-time telemetry, and encrypted Starlink Beyond-Line-of-Sight connectivity. Ground control station (GCS) in rugged case.',
      185000.0,
      2,
      75,
      '/images/products/prod_mil_usv_560.png',
      'Naval Autonomous Standard,ISO 9001:2015,CE'
    );
    insertSpec.run('sp-usv-1', 'prod-mil-usv560', 'Length Overall (LOA)', '5.60', 'Meters', 1);
    insertSpec.run('sp-usv-2', 'prod-mil-usv560', 'Beam Overall (BOA)', '2.10', 'Meters', 1);
    insertSpec.run('sp-usv-3', 'prod-mil-usv560', 'Propulsion', 'Inboard 250HP Gasoline + Waterjet', '', 1);
    insertSpec.run('sp-usv-4', 'prod-mil-usv560', 'Fuel Capacity', '200', 'Liters', 1);
    insertSpec.run('sp-usv-5', 'prod-mil-usv560', 'Cargo Capacity', '250', 'kg', 1);
    insertSpec.run('sp-usv-6', 'prod-mil-usv560', 'Sensors Suite', 'Simrad Halo20+ Radar + Triple PTZ Thermal/Day Turret', '', 1);
    insertSpec.run('sp-usv-7', 'prod-mil-usv560', 'Communications', 'Starlink BLOS Satellite + Encrypted Telemetry', '', 1);
    insertSpec.run('sp-usv-8', 'prod-mil-usv560', 'Autonomous Modes', 'Waypoint Navigation, Target Tracking, Geofence Patrol', '', 0);

    // 30. Economical Fast Response Inland Patrol Vessel Type 8.7 Multirole
    insertProd.run(
      'prod-mil-type87',
      'cat-military',
      'MIL-TYPE-8.7-INLAND',
      'Economical Fast Response Inland Patrol Vessel Type 8.7',
      '8.70m shallow draft aluminium riverine & estuary fast interdiction craft with 360° cabin windows and push knees.',
      'Featured in the Military Brochure Governmental Line (pages 9 and 16). 8.70m LOA, 2.50m beam, shallow draft of only 0.45m keel-waterline. Depth 1.54m, fuel 2x150L (300L). Minimum 27 knots with twin 75HP outboards (up to twin 200HP). 2 seats + 1 captain seat (10 pax + 3 crew). Fixed aft bimini behind cabin.',
      112000.0,
      3,
      55,
      '/images/products/prod_mil_inland_87.png',
      'CE Category C,ISO 9001:2015,Defense Grade'
    );
    insertSpec.run('sp-t87-1', 'prod-mil-type87', 'Length Overall (LOA)', '8.70', 'Meters', 1);
    insertSpec.run('sp-t87-2', 'prod-mil-type87', 'Beam Overall (BOA)', '2.50', 'Meters', 1);
    insertSpec.run('sp-t87-3', 'prod-mil-type87', 'Shallow Draft', '0.45', 'Meters (Waterline)', 1);
    insertSpec.run('sp-t87-4', 'prod-mil-type87', 'Depth', '1.54', 'Meters', 0);
    insertSpec.run('sp-t87-5', 'prod-mil-type87', 'Fuel Capacity', '2 x 150 (300 L)', 'Liters', 1);
    insertSpec.run('sp-t87-6', 'prod-mil-type87', 'Capacity', '1,400', 'kg', 1);
    insertSpec.run('sp-t87-7', 'prod-mil-type87', 'Crew / Passenger', '2 seats + 1 captain (10 pax + 3 crew)', '', 1);
    insertSpec.run('sp-t87-8', 'prod-mil-type87', 'Engines', 'Twin Outboard: Min recommended twin 75 HP', '', 1);
    insertSpec.run('sp-t87-9', 'prod-mil-type87', 'Speed', 'Min 27 Knots with twin 75 HP', '', 1);
    insertSpec.run('sp-t87-10', 'prod-mil-type87', 'Features', 'Cabin 360 windows, 2 entrances, mast, aft bimini, push knees', '', 0);

    // 31. Professional Offshore Military Jockeyseats
    insertProd.run(
      'prod-mil-jockey',
      'cat-military',
      'MIL-ACC-SEATS',
      'Professional Offshore Military Jockeyseats & Helm Console',
      'Ullman progressive suspension jockey seats, leaning posts, heavy steering consoles, and T-top rollbars.',
      'Featured on page 10 of the Military Brochure. State of the art offshore accessories proven by intensive testing across Blue Spirit, Alunautic, and FibreShark brands. Reduces wave-slamming G-forces by up to 75%.',
      4500.0,
      12,
      15,
      '/images/products/prod_mil_jockey_seats.png',
      'ISO 9001:2015,Naval Ergonomic Standard'
    );
    insertSpec.run('sp-jock-1', 'prod-mil-jockey', 'Suspension System', 'Ullman Progressive Spring & Shock Mitigator', '', 1);
    insertSpec.run('sp-jock-2', 'prod-mil-jockey', 'G-Force Mitigation', 'Up to 75% wave impact damping', '', 1);
    insertSpec.run('sp-jock-3', 'prod-mil-jockey', 'Console Materials', 'Marine grade aluminium / GRP T-Top', '', 1);
    insertSpec.run('sp-jock-4', 'prod-mil-jockey', 'Tested On', 'Blue Spirit, Alunautic, FibreShark', '', 1);

    // 32. Fibre Shark 12M Passenger Catamaran with Upper Observation Canopy
    insertProd.run(
      'prod-fs-cat-canopy',
      'cat-fibreshark',
      'FS-CAT-CANOPY-120',
      'Fibre Shark 12M Catamaran Tour Cruiser with Upper Observation Canopy',
      '12.50m composite passenger catamaran featuring full-length shaded observation upper deck and lounge.',
      'Featured on slide 6 of the Joint Venture catalog. High-stability dual asymmetrical GRP hulls with deep-vee entry. Features open-air top deck with safety handrails and bimini sun awning, main enclosed passenger salon, 35 person passenger capacity, and twin low-emission outboards or inboard diesels.',
      385000.0,
      1,
      110,
      '/images/products/prod_fs_cat_canopy.png',
      'CE Category B,ISO 9001:2015,Passenger Code'
    );
    insertSpec.run('sp-fsc-1', 'prod-fs-cat-canopy', 'Length Overall (LOA)', '12.50', 'Meters', 1);
    insertSpec.run('sp-fsc-2', 'prod-fs-cat-canopy', 'Beam Overall (BOA)', '5.20', 'Meters', 1);
    insertSpec.run('sp-fsc-3', 'prod-fs-cat-canopy', 'Deck Configuration', 'Dual-Level: Lower Salon + Upper Shaded Canopy Deck', '', 1);
    insertSpec.run('sp-fsc-4', 'prod-fs-cat-canopy', 'Passenger Capacity', '35 Passengers + 3 Crew', '', 1);
    insertSpec.run('sp-fsc-5', 'prod-fs-cat-canopy', 'Propulsion', 'Twin Yamaha 200HP 4-Stroke Outboards or Inboard Diesels', '', 1);

    // 33. Alunautic 12M Heavy Duty Green Landing Craft with Bow Ramp
    insertProd.run(
      'prod-alu-lc-green',
      'cat-alunautic',
      'ALU-LC-GREEN-1200',
      'Alunautic 12M Heavy Aluminium Landing Craft with Bow Ramp',
      '12.00m heavy-duty commercial landing craft with hydraulic bow ramp and elevated aft wheelhouse.',
      'Featured on slide 12 of the Alunautic catalog. Fabricated from certified marine grade 5083-H111 aluminium with thick bottom plating and double longitudinal stringers. Wide cargo deck handles trucks, heavy pallets, IBC chemical containers, and construction machinery up to 6,000 kg payload.',
      215000.0,
      2,
      90,
      '/images/products/prod_alu_passenger_lc.png',
      'CE Category C,ISO 9001:2015,Dutch Maritime Standard'
    );
    insertSpec.run('sp-lcg-1', 'prod-alu-lc-green', 'Length Overall (LOA)', '12.00', 'Meters', 1);
    insertSpec.run('sp-lcg-2', 'prod-alu-lc-green', 'Beam Overall (BOA)', '3.80', 'Meters', 1);
    insertSpec.run('sp-lcg-3', 'prod-alu-lc-green', 'Bow Ramp System', 'Hydraulic Heavy Vehicle / Equipment Door', '', 1);
    insertSpec.run('sp-lcg-4', 'prod-alu-lc-green', 'Cargo Payload Capacity', '6,000', 'kg', 1);
    insertSpec.run('sp-lcg-5', 'prod-alu-lc-green', 'Main Engines', 'Twin Inboard Marine Diesel 300HP with Shaft or Waterjet', '', 1);

    // 34. Alunautic Ashdod 750 Center Console Fast Workboat
    insertProd.run(
      'prod-alu-ashdod',
      'cat-alunautic',
      'ALU-ASHDOD-CONSOLE',
      'Alunautic Ashdod 750 Fast Center Console Workboat',
      '7.50m aluminium high-speed harbor security and mooring launch with reinforced T-top and tow bitt.',
      'Featured on slide 15 of the catalog (Ashdod-Blue Marina operations). Features center steering console with wrap-around safety grab rails, marine navigation lights, forward anchor locker, self-bailing deck, and heavy perimeter D-fender for ship assistance and pilot transfer.',
      64000.0,
      3,
      45,
      '/images/products/prod_alu_ashdod.png',
      'CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-ash-1', 'prod-alu-ashdod', 'Length Overall (LOA)', '7.50', 'Meters', 1);
    insertSpec.run('sp-ash-2', 'prod-alu-ashdod', 'Beam Overall (BOA)', '2.60', 'Meters', 1);
    insertSpec.run('sp-ash-3', 'prod-alu-ashdod', 'Hull Construction', 'Marine Grade Aluminium 5083-H111', '', 1);
    insertSpec.run('sp-ash-4', 'prod-alu-ashdod', 'Max Speed', '42', 'Knots', 1);
    insertSpec.run('sp-ash-5', 'prod-alu-ashdod', 'Towing Equipment', 'Heavy Transom Samson Post + Forward Bollard', '', 0);

    // 35. Alunautic 8.50M Blue Police & Harbor Security Cabin Launch
    insertProd.run(
      'prod-alu-pat-blue',
      'cat-alunautic',
      'ALU-PAT-BLUE-850',
      'Alunautic 8.50M Blue Police & Harbor Security Cabin Launch',
      '8.50m all-weather aluminum security launch with enclosed 360-degree glass wheelhouse and searchlights.',
      'Featured on slide 14 of the catalog. Built for continuous harbor policing, port state control, and customs patrol. Includes forward push-knees for tender positioning, blue emergency strobe beacons, twin Yamaha 200HP outboards, and heated defroster windows.',
      142000.0,
      2,
      60,
      '/images/products/prod_alu_patrol_blue.png',
      'CE Category B,ISO 9001:2015,Port Security Code'
    );
    insertSpec.run('sp-pbl-1', 'prod-alu-pat-blue', 'Length Overall (LOA)', '8.50', 'Meters', 1);
    insertSpec.run('sp-pbl-2', 'prod-alu-pat-blue', 'Beam Overall (BOA)', '2.90', 'Meters', 1);
    insertSpec.run('sp-pbl-3', 'prod-alu-pat-blue', 'Wheelhouse Vision', '360° Tempered Glass with Defrosters', '', 1);
    insertSpec.run('sp-pbl-4', 'prod-alu-pat-blue', 'Engines', 'Twin Outboard 200 HP with Hydraulic Steering', '', 1);
    insertSpec.run('sp-pbl-5', 'prod-alu-pat-blue', 'Push-Knees', 'Heavy Bow Rubber D-Fender for Ship Boarding', '', 0);

    // 36. Gamme Patrol Aluminium 10M Tactical Interceptor (Government & Defense)
    insertProd.run(
      'prod-mil-alu-pat10',
      'cat-military',
      'MIL-ALU-PAT-1000',
      'Gamme Patrol Aluminium 10M Tactical Naval Interceptor',
      '10.00m military patrol vessel with 1,500L fuel tank, 2,500 kg cargo capacity, and 700 CV max power.',
      'From page 6 of the HPT-EO Military Brochure 2026. Constructed with 5-6mm marine aluminium 5083-H111 plating with longitudinal and transversal framing. Inside width 3.30m, bare hull weight 1,500 kg. Features forward gun pintle mount, tactical communications mast, and self-draining deck.',
      198000.0,
      2,
      70,
      '/images/products/prod_alu_patrol_7m.png',
      'Naval Military Standard,CE Category B,ISO 9001:2015'
    );
    insertSpec.run('sp-mp10-1', 'prod-mil-alu-pat10', 'Length Overall (LOA)', '10.00', 'Meters', 1);
    insertSpec.run('sp-mp10-2', 'prod-mil-alu-pat10', 'Inside Width', '3.30', 'Meters', 1);
    insertSpec.run('sp-mp10-3', 'prod-mil-alu-pat10', 'Fuel Tank Capacity', '1,500', 'Liters', 1);
    insertSpec.run('sp-mp10-4', 'prod-mil-alu-pat10', 'Cargo Capacity', '2,500', 'kg', 1);
    insertSpec.run('sp-mp10-5', 'prod-mil-alu-pat10', 'Maximum Power', '700', 'CV', 1);
    insertSpec.run('sp-mp10-6', 'prod-mil-alu-pat10', 'Bare Hull Weight', '1,500', 'kg', 0);

    // 37. Gamme Patrol Semi-Rigide 10.20M RIHB (Government & Defense)
    insertProd.run(
      'prod-mil-bs-pat1020',
      'cat-military',
      'MIL-BS-PAT-1020',
      'Gamme Patrol Semi-Rigide 10.20M Heavy Duty Tactical RIHB',
      '10.20m naval interceptor with Orca 1670 Decitex tubes, 600L fuel, 25 persons transport, and 2x300 CV power.',
      'From page 10 of the Military Brochure 2026. Inside width 2.60m, tube diameter 0.60m, bare hull weight 1,450 kg, cargo capacity 3,200 kg. Bolted removable tubes filled with closed-cell foam or pneumatic chambers. Available in open deck with shock jockey seats or enclosed armored cabin.',
      225000.0,
      2,
      75,
      '/images/products/prod_bs_patrol_grp.png',
      'Naval Tactical Code,ISO 9001:2015,CE Category B'
    );
    insertSpec.run('sp-mb10-1', 'prod-mil-bs-pat1020', 'Length Overall (LOA)', '10.20', 'Meters', 1);
    insertSpec.run('sp-mb10-2', 'prod-mil-bs-pat1020', 'Inside Width', '2.60', 'Meters', 1);
    insertSpec.run('sp-mb10-3', 'prod-mil-bs-pat1020', 'Tube Diameter', '0.60', 'Meters', 1);
    insertSpec.run('sp-mb10-4', 'prod-mil-bs-pat1020', 'Fuel Tank Capacity', '600', 'Liters', 1);
    insertSpec.run('sp-mb10-5', 'prod-mil-bs-pat1020', 'Transport Capacity', '25', 'Persons', 1);
    insertSpec.run('sp-mb10-6', 'prod-mil-bs-pat1020', 'Maximum Power', '2 x 300', 'CV', 1);
    insertSpec.run('sp-mb10-7', 'prod-mil-bs-pat1020', 'Cargo Capacity', '3,200', 'kg', 0);

    // 38. Alunautic Military Support 650 (Governmental Line)
    insertProd.run(
      'prod-mil-alu-ms650',
      'cat-military',
      'MIL-ALU-MS-650',
      'Alunautic Military Support 650 Fast Rescue Troop Transport',
      '6.50m military troop transport with Deep V hull, beaching capacity, 4x2 foldable benches (10+2 seated).',
      'Featured on pages 8-9 of the Military Brochure. Marine grade reinforced aluminium hull, 500 kg lightship, 40L fuel, outboard 100 HP max. Includes extra aluminium V protection on keel, trailer bow eye, 2 transom towing eyes, 4 certified lifting points and sling, 2 bollards bow/transom, 2 offshore deck flush hoses, and non-slip floor.',
      76000.0,
      3,
      50,
      '/images/products/prod_alu_ms_650.png',
      'Naval Military Standard,CE Category C,ISO 9001:2015'
    );
    insertSpec.run('sp-mms-1', 'prod-mil-alu-ms650', 'Length Overall (LOA)', '6.50', 'Meters', 1);
    insertSpec.run('sp-mms-2', 'prod-mil-alu-ms650', 'Beam Overall (BOA)', '2.40', 'Meters', 1);
    insertSpec.run('sp-mms-3', 'prod-mil-alu-ms650', 'Weight Lightship', '500', 'kg', 1);
    insertSpec.run('sp-mms-4', 'prod-mil-alu-ms650', 'Seating Layout', '4 x 2 Foldable Benches (10+2 Persons Seated)', '', 1);
    insertSpec.run('sp-mms-5', 'prod-mil-alu-ms650', 'Propulsion Max', 'Outboard 100 HP Max', '', 1);
    insertSpec.run('sp-mms-6', 'prod-mil-alu-ms650', 'Auxiliary Equipment', 'Keel V Protection, 4 Lifting Points, Certified Sling, Deck Flush Hoses', '', 0);

    // 39. 12 Meter Cabin Patrol Vessel Windmill Series (Governmental Line)
    insertProd.run(
      'prod-mil-alu-wm12',
      'cat-military',
      'MIL-ALU-WM-1200',
      '12 Meter Cabin Patrol Vessel Windmill Defense Series',
      'Proven 12m-14m-16m patrol concept powered by twin inboard diesels (350-650 HP) or twin/triple outboards.',
      'Featured on page 7 of the Military Brochure. Used for border control, ambulance services, and general military duties worldwide. Available with Sterndrives, Surface drives or Waterjet. 300HP diesel outboards option. Class approved design engineered with an economical price tag and high-volume production output.',
      395000.0,
      2,
      85,
      '/images/products/prod_alu_wm_1400.png',
      'Class Approved,ISO 9001:2015,CE Category B'
    );
    insertSpec.run('sp-mwm-1', 'prod-mil-alu-wm12', 'Length Overall (LOA)', '12.00', 'Meters', 1);
    insertSpec.run('sp-mwm-2', 'prod-mil-alu-wm12', 'Version Variants', 'Available in 12m, 14m, and 16m', '', 1);
    insertSpec.run('sp-mwm-3', 'prod-mil-alu-wm12', 'Propulsion Systems', 'Twin Inboard Diesel (Sterndrives / Surface / Waterjet) 350-650 HP', '', 1);
    insertSpec.run('sp-mwm-4', 'prod-mil-alu-wm12', 'Outboard Options', 'Twin or Triple Outboards (Incl. 300HP Diesel Outboards)', '', 1);
    // 40. StormTug 80 (ST-80) ASD Escort & Towing Tug (Flagship Showcase)
    insertProd.run(
      'prod-stormtug-80',
      'cat-military',
      'ST-80-TUG',
      'StormTug 80 (ST-80)',
      'Escort and towing tug with high bollard pull (80t) and twin ASD azimuth propulsion.',
      'Flagship heavy escort and towing tugboat engineered in joint venture with Northbay Shipyards Norway. Delivers 80 metric tonnes certified continuous bollard pull powered by twin 2,400 kW high-output marine diesels coupled to 360-degree Azimuth Stern Drive (ASD) thrusters. Features full IMO Tier III Selective Catalytic Reduction (SCR) clean emissions compliance, FiFi 1 external firefighting water cannon system, dynamic escort skeg, forward escort winch with auto-tensioning, and state-of-the-art 360-degree all-weather wheelhouse bridge.',
      6800000.0,
      1,
      180,
      '/images/products/flagship_stormtug_80.jpg',
      'IACS Class Approved,IMO Tier III,ISO 9001:2015,SOLAS FiFi 1'
    );
    insertSpec.run('sp-st80-1', 'prod-stormtug-80', 'Bollard Pull (Certified Continuous)', '80', 'Tonnes (t)', 1);
    insertSpec.run('sp-st80-2', 'prod-stormtug-80', 'Peak Engine Power', '2,400', 'kW (Twin High-Output Diesels)', 1);
    insertSpec.run('sp-st80-3', 'prod-stormtug-80', 'Emissions Standard', 'IMO Tier III (SCR Selective Catalytic Reduction)', '', 1);
    insertSpec.run('sp-st80-4', 'prod-stormtug-80', 'Propulsion Type', 'Twin ASD 360° Azimuth Steerable Thrusters', '', 1);
    insertSpec.run('sp-st80-5', 'prod-stormtug-80', 'Length Overall (LOA)', '28.50', 'Meters', 1);
    insertSpec.run('sp-st80-6', 'prod-stormtug-80', 'Beam Overall (BOA)', '11.20', 'Meters', 0);
    insertSpec.run('sp-st80-7', 'prod-stormtug-80', 'Maximum Speed (Ahead)', '13.8', 'Knots', 0);
    insertSpec.run('sp-st80-8', 'prod-stormtug-80', 'External Firefighting (FiFi)', 'FiFi 1 (2,400 m³/hr Water Monitor + Foam)', '', 0);
    insertSpec.run('sp-st80-9', 'prod-stormtug-80', 'Shipyard / Origin', 'Northbay Shipyards · Norway Partner Facility', '', 0);

    db.exec(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES ('SEED', 'SYSTEM', 'INIT_CATALOG', 'Database refreshed with full HPT & Euro Offshore Joint Venture fleet (40 models) including StormTug 80 flagship.')
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
