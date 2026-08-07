import { describe, it, expect } from 'vitest';
import { generateMockToken, verifyMockToken } from '../src/server/auth';

describe('Authentication & Authorization Security Layer', () => {
  it('should generate a valid mock Bearer token for given role', () => {
    const token = generateMockToken('Teacher', 'usr-teacher-01', 'Prof. Vance');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('should correctly verify and decode a valid mock token', () => {
    const token = generateMockToken('Parent', 'usr-parent-99', 'Parent User');
    const decoded = verifyMockToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.role).toBe('Parent');
    expect(decoded?.id).toBe('usr-parent-99');
    expect(decoded?.name).toBe('Parent User');
  });

  it('should return null for malformed or invalid tokens', () => {
    const invalidToken = 'invalid.bearer.token.123';
    const decoded = verifyMockToken(invalidToken);
    expect(decoded).toBeNull();
  });
});
