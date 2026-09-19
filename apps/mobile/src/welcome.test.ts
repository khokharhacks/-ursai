import { describe, expect, it } from 'vitest';
import { mobileWelcomeMessage } from './welcome';

describe('mobile welcome copy', () => {
  it('is present for the foundation screen', () => {
    expect(mobileWelcomeMessage.length).toBeGreaterThan(0);
  });
});
