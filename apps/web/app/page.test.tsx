import { describe, expect, it } from 'vitest';
import { dashboardTitle } from '../src/dashboard';

describe('dashboard copy', () => {
  it('identifies the active project view', () => {
    expect(dashboardTitle).toBe('Active projects');
  });
});
