import { describe, it, expect } from 'vitest';
import { calculateOrderPrice, PRICING_POLICY } from '../../src/config/pricing.js';

describe('Pricing Engine & Server Calculation', () => {
  it('correctly calculates price for Color A4 print', () => {
    const quote = calculateOrderPrice({
      pageCount: 10,
      copies: 2,
      colorMode: 'Color',
      paperSize: 'A4',
    });

    // 10 * 2 * 0.35 * 1.0 = 7.00 subtotal, 7.00 * 0.08 = 0.56 tax, total = 7.56
    expect(quote.subtotal).toBe(7.0);
    expect(quote.tax).toBe(0.56);
    expect(quote.totalAmount).toBe(7.56);
    expect(quote.currency).toBe('USD');
  });

  it('correctly calculates price for Monochrome A4 print', () => {
    const quote = calculateOrderPrice({
      pageCount: 20,
      copies: 1,
      colorMode: 'Monochrome',
      paperSize: 'A4',
    });

    // 20 * 1 * 0.08 * 1.0 = 1.60 subtotal, 1.60 * 0.08 = 0.13 tax, total = 1.73
    expect(quote.subtotal).toBe(1.6);
    expect(quote.tax).toBe(0.13);
    expect(quote.totalAmount).toBe(1.73);
  });

  it('applies 1.5x paper multiplier for A3 sheets', () => {
    const quote = calculateOrderPrice({
      pageCount: 10,
      copies: 1,
      colorMode: 'Color',
      paperSize: 'A3',
    });

    // 10 * 1 * 0.35 * 1.5 = 5.25 subtotal, 5.25 * 0.08 = 0.42 tax, total = 5.67
    expect(quote.paperMultiplier).toBe(1.5);
    expect(quote.subtotal).toBe(5.25);
    expect(quote.tax).toBe(0.42);
    expect(quote.totalAmount).toBe(5.67);
  });

  it('rejects invalid page counts and copy numbers', () => {
    expect(() =>
      calculateOrderPrice({
        pageCount: 0,
        copies: 1,
        colorMode: 'Color',
        paperSize: 'A4',
      })
    ).toThrow('Page count and copy count must be at least 1');

    expect(() =>
      calculateOrderPrice({
        pageCount: 5,
        copies: -1,
        colorMode: 'Color',
        paperSize: 'A4',
      })
    ).toThrow('Page count and copy count must be at least 1');
  });
});

