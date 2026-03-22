import { describe, it, expect } from 'vitest';
import { generateContractNumber } from './utils';

describe('Rental Contracts Logic', () => {
  it('should generate a contract number in correct format', () => {
    const num = generateContractNumber();
    expect(num).toMatch(/^RC-\d{4}-[A-Z0-9]{6}$/);
  });

  it('should generate unique numbers (mostly)', () => {
    const num1 = generateContractNumber();
    const num2 = generateContractNumber();
    expect(num1).not.toBe(num2);
  });
});
