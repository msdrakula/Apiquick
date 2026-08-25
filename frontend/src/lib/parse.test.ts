import { describe, it, expect } from 'vitest';
import { parseMaybe, methodColor } from './parse';
import { get } from '../utils/bql';
import { getSuitableLenses } from '../components/lenses/registry';

describe('parseMaybe', () => {
  it('parses JSON strings', () => {
    expect(parseMaybe('{"a":1}', {})).toEqual({ a: 1 });
  });
  it('returns fallback on invalid JSON', () => {
    expect(parseMaybe('{', [])).toEqual([]);
  });
  it('passes objects through', () => {
    expect(parseMaybe({ a: 1 }, {})).toEqual({ a: 1 });
  });
});

describe('methodColor', () => {
  it('maps known methods', () => {
    expect(methodColor('GET')).toContain('emerald');
    expect(methodColor('POST')).toContain('amber');
    expect(methodColor('DELETE')).toContain('rose');
  });
});

describe('BQL get', () => {
  const data = { customer: { orders: [{ amount: 10 }, { amount: 30 }] } };
  it('reads nested paths', () => {
    expect(get(data, 'customer.orders[0].amount')).toBe(10);
  });
});

describe('lenses', () => {
  it('prefers JSON over raw', () => {
    const lenses = getSuitableLenses('application/json', '{}');
    expect(lenses[0].id).toBe('json');
    expect(lenses.some(l => l.id === 'raw')).toBe(true);
  });
  it('detects html and images', () => {
    expect(getSuitableLenses('text/html', '').some(l => l.id === 'html')).toBe(true);
    expect(getSuitableLenses('image/png', '').some(l => l.id === 'image')).toBe(true);
  });
});
