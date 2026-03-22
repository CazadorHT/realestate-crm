import { describe, it, expect } from 'vitest';
import { assertAdmin, assertStaff, assertAuthenticated, AuthzError } from './authz';
import { UserRole } from './auth-shared';

describe('Authorization Logic (RBAC)', () => {
  describe('assertAuthenticated', () => {
    it('should not throw if userId is provided', () => {
      expect(() => assertAuthenticated({ userId: 'user-1', role: 'USER' })).not.toThrow();
    });

    it('should throw AuthzError if userId is missing', () => {
      expect(() => assertAuthenticated({ userId: '', role: 'USER' as any })).toThrow(AuthzError);
    });
  });

  describe('assertStaff', () => {
    const staffRoles: UserRole[] = ['ADMIN', 'AGENT', 'MANAGER'];
    const nonStaffRoles: UserRole[] = ['USER'];

    it.each(staffRoles)('should allow %s role', (role) => {
      expect(() => assertStaff(role)).not.toThrow();
    });

    it.each(nonStaffRoles)('should deny %s role', (role) => {
      expect(() => assertStaff(role)).toThrow(AuthzError);
    });
  });

  describe('assertAdmin', () => {
    it('should allow ADMIN role', () => {
      expect(() => assertAdmin('ADMIN')).not.toThrow();
    });

    it.each(['AGENT', 'MANAGER', 'USER'] as UserRole[])('should deny %s role', (role) => {
      expect(() => assertAdmin(role)).toThrow(AuthzError);
    });
  });
});
