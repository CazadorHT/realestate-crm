import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// Re-defining schemas here for testing or import if they were exported
const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  honeypot: z.string().max(0).optional(),
});

describe('Auth Validation Schemas', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('กรุณากรอกอีเมลให้ถูกต้อง');
    }
  });

  it('accepts technically valid but fake-looking emails', () => {
    // This confirms what happens if someone puts dsdad@asdasda.com
    const result = loginSchema.safeParse({
      email: 'dsdad@asdasda.com',
      password: 'password123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '12345'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }
  });

  it('detects bot via honeypot (if honeypot has value, it should fail)', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      honeypot: 'i am a bot'
    });
    // zod .max(0) will fail if string length > 0
    expect(result.success).toBe(false);
  });
});
