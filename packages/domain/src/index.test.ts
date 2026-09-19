import { describe, expect, it } from 'vitest';
import { asTenantId } from './index';

describe('tenant identifiers', () => {
  it('rejects an empty identifier', () => {
    expect(() => asTenantId('')).toThrow('Tenant ID cannot be empty');
  });
});
