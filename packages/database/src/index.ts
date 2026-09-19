/** Path relative to the package root, resolved by migration tooling. */
export const migrationsDirectory = 'migrations' as const;

export const databaseConventions = Object.freeze({
  idType: 'uuid',
  timestampType: 'timestamptz',
  tenantContextKey: 'app.tenant_id',
});
