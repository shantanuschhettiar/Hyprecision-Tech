export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

export interface ProductItem {
  id: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  sku: string;
  title: string;
  short_desc: string;
  description?: string;
  price_usd: number;
  stock_quantity: number;
  min_order_quantity?: number;
  lead_time_days: number;
  image_url: string;
  certifications?: string[];
  is_active?: number | boolean;
  specifications: ProductSpecification[];
  created_at?: string;
  updated_at?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface QuotationRequestItem {
  id: string;
  product_id?: string;
  product_sku?: string;
  product_title?: string;
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  quantity_requested: number;
  custom_specs?: string;
  selected_options?: string[];
  status: 'PENDING' | 'QUOTED' | 'APPROVED' | 'ARCHIVED';
  reference_no?: string;
  created_at?: string;
}

export interface TechnicalSpecMatrixRow {
  itemNumber: number;
  parameter: string;
  requirement: string;
  included: boolean;
  comments: string;
}

export interface FormalQuotationOffer {
  referenceNo: string;
  date: string;
  customerReference: string;
  projectTitle: string;
  client: {
    company: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
  };
  jointVenture: {
    companyName: string;
    partnerName: string;
    indiaOffice: string;
    indiaPhone: string;
    indiaEmail: string;
    indiaRegdOffice: string;
    netherlandsOffice: string;
    isoStandard: string;
  };
  customizationConfirmation: string;
  vesselOverview: {
    modelName: string;
    intendedUse: string;
    basePlatform: string;
    loa: string;
    boa: string;
    draft: string;
    lightDisplacement: string;
    fullLoadDisplacement: string;
    maxSpeed: string;
    cruisingSpeed: string;
    fuelCapacity: string;
    range: string;
    crewPassengerCapacity: string;
    hullMaterial: string;
    classCertification: string;
  };
  technicalMatrix: TechnicalSpecMatrixRow[];
  commercialOffer: {
    baseVesselPrice: number;
    options: Array<{ description: string; price: number; included: boolean }>;
    sparesPackagePrice: number;
    cradleAndPackingPrice: number;
    totalExWorks: number;
    currency: string;
  };
  commercialTerms: {
    deliveryTerms: string;
    deliveryTimeWeeks: string;
    paymentMilestones: Array<{ milestone: string; percentage: number; description: string }>;
    warranty: string;
    classApproval: string;
    siteServices: {
      standardDailyRateEur: number;
      weekendDailyRateEur: number;
      travelRatePercent: number;
      logisticsTerms: string;
    };
    validityDays: number;
  };
  signatures: {
    preparedBy: string;
    preparedTitle: string;
    approvedBy: string;
    approvedTitle: string;
  };
}

export interface SystemStats {
  productsCount: number;
  categoriesCount: number;
  rfqsCount: number;
  lowStockCount: number;
  recentLogs: Array<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: string;
    details: string;
    created_at: string;
  }>;
}

export interface AiComparisonResult {
  summary: string;
  matrix: Array<{
    criteria: string;
    values: Record<string, string>;
    winnerSku?: string | null;
  }>;
  recommendations: Array<{
    sku: string;
    bestFor: string;
    pros: string[];
    cons: string[];
  }>;
}

