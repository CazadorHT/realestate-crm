import { describe, it, expect } from 'vitest';
import { validateTeamName, validateManagerRole } from './utils';

describe('Teams Logic - Validation', () => {
  it('should validate a correct team name', () => {
    const result = validateTeamName('  Sales Team  ');
    expect(result.valid).toBe(true);
    expect(result.name).toBe('Sales Team');
  });

  it('should fail on empty team name', () => {
    const result = validateTeamName('   ');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('กรุณาระบุชื่อทีม');
  });

  it('should allow ADMIN or MANAGER as team managers', () => {
    expect(validateManagerRole('ADMIN').valid).toBe(true);
    expect(validateManagerRole('MANAGER').valid).toBe(true);
  });

  it('should fail for other roles or null', () => {
    expect(validateManagerRole('AGENT').valid).toBe(false);
    expect(validateManagerRole(null).valid).toBe(false);
  });
});
