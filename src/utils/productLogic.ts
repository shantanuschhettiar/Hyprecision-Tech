import { ProductItem, ProductSpecification } from '../types.ts';

export type { ProductItem, ProductSpecification };

export interface FilterOptions {
  categorySlug?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'stock' | 'sku' | 'name';
}

/**
 * Filter and sort products according to criteria.
 */
export function filterAndSortProducts(
  products: ProductItem[],
  options: FilterOptions
): ProductItem[] {
  let list = [...products];

  if (options.categorySlug && options.categorySlug !== 'all') {
    list = list.filter(
      (p) => p.category_slug === options.categorySlug || p.category_id === options.categorySlug
    );
  }

  if (options.searchTerm && options.searchTerm.trim()) {
    const q = options.searchTerm.toLowerCase().trim();
    list = list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const descMatch = (p.short_desc || '').toLowerCase().includes(q);
      const specMatch = (p.specifications || []).some(
        (s) =>
          s.key.toLowerCase().includes(q) ||
          s.value.toLowerCase().includes(q) ||
          (s.unit || '').toLowerCase().includes(q)
      );
      return titleMatch || skuMatch || descMatch || specMatch;
    });
  }

  if (options.minPrice !== undefined && options.minPrice !== null) {
    list = list.filter((p) => p.price_usd >= options.minPrice!);
  }

  if (options.maxPrice !== undefined && options.maxPrice !== null) {
    list = list.filter((p) => p.price_usd <= options.maxPrice!);
  }

  if (options.inStockOnly) {
    list = list.filter((p) => p.stock_quantity > 0);
  }

  if (options.sortBy) {
    switch (options.sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'stock':
        list.sort((a, b) => b.stock_quantity - a.stock_quantity);
        break;
      case 'sku':
        list.sort((a, b) => a.sku.localeCompare(b.sku));
        break;
      case 'name':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
  }

  return list;
}

/**
 * Heuristic parsing of natural language query intent for fast local matching
 * or fallback when offline/pre-filtering.
 */
export function parseNaturalLanguageQuery(query: string): {
  maxPrice?: number;
  minPrice?: number;
  lowStockOnly?: boolean;
  keywords: string[];
  suggestedAction: 'SEARCH' | 'DB_COMMAND' | 'COMPARE';
  targetSku?: string;
} {
  const normalized = query.toLowerCase();
  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  let lowStockOnly = false;
  let suggestedAction: 'SEARCH' | 'DB_COMMAND' | 'COMPARE' = 'SEARCH';
  let targetSku: string | undefined;

  // Check for admin DB commands
  if (
    normalized.includes('update') ||
    normalized.includes('set stock') ||
    normalized.includes('change price') ||
    normalized.includes('add product') ||
    normalized.includes('delete')
  ) {
    suggestedAction = 'DB_COMMAND';
  } else if (normalized.includes('compare') || normalized.includes('vs') || normalized.includes('difference')) {
    suggestedAction = 'COMPARE';
  }

  // Detect SKU patterns e.g. HY-SP-40B or HY-FLT-MCB
  const skuMatch = query.match(/HY-[A-Z0-9-]+/i);
  if (skuMatch) {
    targetSku = skuMatch[0].toUpperCase();
  }

  // Detect price under $X / below X
  const underPriceMatch = normalized.match(/(?:under|below|less than|max)\s*\$?(\d+(?:\.\d+)?)/);
  if (underPriceMatch) {
    maxPrice = parseFloat(underPriceMatch[1]);
  }

  // Detect price above $X / over X / min
  const overPriceMatch = normalized.match(/(?:over|above|more than|min)\s*\$?(\d+(?:\.\d+)?)/);
  if (overPriceMatch) {
    minPrice = parseFloat(overPriceMatch[1]);
  }

  // Detect low stock inquiry
  if (normalized.includes('low stock') || normalized.includes('out of stock') || normalized.includes('reorder')) {
    lowStockOnly = true;
  }

  const rawKeywords = normalized
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'with', 'for', 'show', 'find', 'get'].includes(w));

  return {
    maxPrice,
    minPrice,
    lowStockOnly,
    keywords: rawKeywords,
    suggestedAction,
    targetSku,
  };
}

/**
 * Compare specifications between multiple products.
 */
export function buildProductComparisonMatrix(products: ProductItem[]) {
  if (products.length === 0) return { allSpecKeys: [], rows: [] };

  const keySet = new Set<string>();
  products.forEach((p) => {
    (p.specifications || []).forEach((s) => keySet.add(s.key));
  });

  const allSpecKeys = Array.from(keySet);
  const rows = allSpecKeys.map((key) => {
    const values: Record<string, string> = {};
    let isDifferent = false;
    let firstVal: string | null = null;

    products.forEach((p) => {
      const match = (p.specifications || []).find((s) => s.key === key);
      const formatted = match ? `${match.value}${match.unit ? ' ' + match.unit : ''}` : 'N/A';
      values[p.id] = formatted;

      if (firstVal === null) {
        firstVal = formatted;
      } else if (firstVal !== formatted) {
        isDifferent = true;
      }
    });

    return {
      specKey: key,
      values,
      isDifferent,
    };
  });

  return {
    allSpecKeys,
    rows,
  };
}

/**
 * Validate an RFQ submission.
 */
export function validateRfqInput(input: {
  customer_name?: string;
  email?: string;
  company_name?: string;
  quantity_requested?: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.customer_name || input.customer_name.trim().length < 2) {
    errors.customer_name = 'Full name must be at least 2 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.email = 'Please provide a valid business email address.';
  }

  if (
    input.quantity_requested !== undefined &&
    (!Number.isInteger(input.quantity_requested) || input.quantity_requested < 1)
  ) {
    errors.quantity_requested = 'Requested quantity must be at least 1 unit.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate product inventory item.
 */
export function validateProductInput(input: Partial<ProductItem>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.sku || input.sku.trim().length < 3) {
    errors.sku = 'SKU is required and must be at least 3 characters.';
  }

  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'Product title must be at least 3 characters.';
  }

  if (input.price_usd === undefined || input.price_usd < 0) {
    errors.price_usd = 'Price must be a positive number.';
  }

  if (input.stock_quantity === undefined || input.stock_quantity < 0) {
    errors.stock_quantity = 'Stock quantity cannot be negative.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
