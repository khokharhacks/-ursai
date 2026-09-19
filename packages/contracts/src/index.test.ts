import { describe, expect, it } from 'vitest';
import { API_VERSION, isHealthResponse } from './index';

describe('foundation contracts', () => {
  it('publishes the initial API version', () => {
    expect(API_VERSION).toBe('v1');
  });

  it('validates the health response shape', () => {
    expect(
      isHealthResponse({ service: 'ursai-api', status: 'ok', timestamp: '2026-09-19T00:00:00Z' }),
    ).toBe(true);
    expect(isHealthResponse({ status: 'ok' })).toBe(false);
  });
});
