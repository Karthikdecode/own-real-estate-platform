import { describe, expect, it } from 'vitest';
import { PASSWORD_POLICY, loginRequestSchema, registerRequestSchema } from '../src/index.js';

const validRegistration = {
  fullName: 'Priya Raman',
  email: 'priya@example.com',
  password: 'correct horse battery staple',
};

describe('registerRequestSchema', () => {
  it('normalises the email address', () => {
    const body = registerRequestSchema.parse({
      ...validRegistration,
      email: '  Priya@Example.COM ',
    });

    expect(body.email).toBe('priya@example.com');
  });

  it('enforces the minimum password length', () => {
    const shortPassword = 'x'.repeat(PASSWORD_POLICY.minLength - 1);

    expect(
      registerRequestSchema.safeParse({ ...validRegistration, password: shortPassword }).success,
    ).toBe(false);
  });

  it('rejects mass-assignment of privileged fields', () => {
    expect(registerRequestSchema.safeParse({ ...validRegistration, role: 'admin' }).success).toBe(
      false,
    );
  });

  it('validates the optional mobile number format', () => {
    expect(
      registerRequestSchema.safeParse({ ...validRegistration, mobileNumber: '+919876543210' })
        .success,
    ).toBe(true);
    expect(
      registerRequestSchema.safeParse({ ...validRegistration, mobileNumber: '9876543210' }).success,
    ).toBe(false);
  });
});

describe('loginRequestSchema', () => {
  it('does not apply the registration password policy', () => {
    expect(
      loginRequestSchema.safeParse({ email: 'priya@example.com', password: 'short' }).success,
    ).toBe(true);
  });
});
