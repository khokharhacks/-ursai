import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationPath = fileURLToPath(
  new URL('../migrations/0001_identity_and_tenants.sql', import.meta.url),
);
const migration = readFileSync(migrationPath, 'utf8');

describe('initial database migration', () => {
  it('enables row-level security on tenant-owned membership records', () => {
    expect(migration).toContain('ALTER TABLE memberships ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain("current_setting('app.tenant_id', true)");
  });

  it('uses tenant-inclusive membership uniqueness', () => {
    expect(migration).toContain('UNIQUE (tenant_id, id)');
    expect(migration).toContain('UNIQUE (tenant_id, user_id)');
  });
});
