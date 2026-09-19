declare const tenantIdBrand: unique symbol;
declare const projectIdBrand: unique symbol;

export type TenantId = string & { readonly [tenantIdBrand]: true };
export type ProjectId = string & { readonly [projectIdBrand]: true };

export function asTenantId(value: string): TenantId {
  if (value.length === 0) throw new Error('Tenant ID cannot be empty');
  return value as TenantId;
}

export function asProjectId(value: string): ProjectId {
  if (value.length === 0) throw new Error('Project ID cannot be empty');
  return value as ProjectId;
}
