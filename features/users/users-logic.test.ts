import { describe, it, expect } from 'vitest';
import { validateRoleUpdate } from './utils';

describe('Users Logic - Role Updates', () => {
  it('should allow an ADMIN to update another user role', () => {
    const result = validateRoleUpdate('self-id', 'other-id', 'ADMIN');
    expect(result.success).toBe(true);
  });

  it('should fail if the current user is not an ADMIN', () => {
    const result = validateRoleUpdate('self-id', 'other-id', 'AGENT');
    expect(result.success).toBe(false);
    expect(result.message).toBe('ไม่มีสิทธิ์ในการดำเนินการนี้');
  });

  it('should fail if trying to update self-role', () => {
    const result = validateRoleUpdate('self-id', 'self-id', 'ADMIN');
    expect(result.success).toBe(false);
    expect(result.message).toBe('ไม่สามารถเปลี่ยนบทบาทของตัวเองได้');
  });
});
