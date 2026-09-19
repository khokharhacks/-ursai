import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/modules/health/health.service';

describe('HealthService', () => {
  it('returns a healthy service contract', () => {
    const response = new HealthService().getHealth();

    expect(response.service).toBe('ursai-api');
    expect(response.status).toBe('ok');
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
  });
});
