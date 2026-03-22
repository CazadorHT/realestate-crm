import { describe, it, expect } from 'vitest';
import { calculateAiCost } from './actions';

describe('AI Monitor - Cost Calculation', () => {
  const exchangeRate = 32;

  it('should calculate cost correctly for gemini-1.5-flash', async () => {
    const model = 'gemini-1.5-flash';
    const promptTokens = 1000000; // 1M
    const completionTokens = 1000000; // 1M
    
    // Rate: 0.1 input, 0.4 output per 1M
    const expectedUsd = (1 * 0.1) + (1 * 0.4); // 0.5 USD
    const expectedThb = expectedUsd * exchangeRate; // 16 THB
    
    expect(await calculateAiCost(model, promptTokens, completionTokens)).toBe(expectedThb);
  });

  it('should calculate cost correctly for gemini-1.5-pro', async () => {
    const model = 'gemini-1.5-pro';
    const promptTokens = 1000000; 
    const completionTokens = 1000000;
    
    // Rate: 1.25 input, 5.0 output per 1M
    const expectedUsd = (1 * 1.25) + (1 * 5.0); // 6.25 USD
    const expectedThb = expectedUsd * exchangeRate; // 200 THB
    
    expect(await calculateAiCost(model, promptTokens, completionTokens)).toBe(expectedThb);
  });

  it('should fallback to flash rate for unknown models', async () => {
    const model = 'unknown-model';
    const promptTokens = 1000000;
    const completionTokens = 1000000;
    
    const expectedUsd = (1 * 0.1) + (1 * 0.4);
    const expectedThb = expectedUsd * exchangeRate;
    
    expect(await calculateAiCost(model, promptTokens, completionTokens)).toBe(expectedThb);
  });

  it('should handle small token counts', async () => {
    const model = 'gemini-1.5-flash';
    const promptTokens = 1000;
    const completionTokens = 1000;
    
    const expectedUsd = (0.001 * 0.1) + (0.001 * 0.4); // 0.0001 + 0.0004 = 0.0005 USD
    const expectedThb = expectedUsd * exchangeRate; // 0.016 THB
    
    expect(await calculateAiCost(model, promptTokens, completionTokens)).toBe(expectedThb);
  });
});
