export interface PricingPolicy {
  colorPerPage: number;
  monochromePerPage: number;
  paperMultipliers: {
    A4: number;
    A3: number;
    Letter: number;
  };
  taxRate: number; // 0.08 (8%)
}

export const PRICING_POLICY: PricingPolicy = {
  colorPerPage: 0.35,
  monochromePerPage: 0.08,
  paperMultipliers: {
    A4: 1.0,
    Letter: 1.0,
    A3: 1.5,
  },
  taxRate: 0.08,
};

export interface PriceCalculationParams {
  pageCount: number;
  copies: number;
  colorMode: 'Color' | 'Monochrome';
  paperSize: 'A4' | 'A3' | 'Letter';
  duplex?: boolean;
}

export interface CalculatedPrice {
  pageCount: number;
  copies: number;
  perPageRate: number;
  paperMultiplier: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  currency: string;
}

export function calculateOrderPrice(params: PriceCalculationParams): CalculatedPrice {
  const { pageCount, copies, colorMode, paperSize } = params;

  if (pageCount < 1 || copies < 1) {
    throw new Error('Page count and copy count must be at least 1');
  }

  const perPageRate = colorMode === 'Color' ? PRICING_POLICY.colorPerPage : PRICING_POLICY.monochromePerPage;
  const paperMultiplier = PRICING_POLICY.paperMultipliers[paperSize] || 1.0;

  const rawSubtotal = pageCount * copies * perPageRate * paperMultiplier;
  const subtotal = Number(rawSubtotal.toFixed(2));
  const tax = Number((subtotal * PRICING_POLICY.taxRate).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));

  return {
    pageCount,
    copies,
    perPageRate,
    paperMultiplier,
    subtotal,
    tax,
    totalAmount,
    currency: 'USD',
  };
}

