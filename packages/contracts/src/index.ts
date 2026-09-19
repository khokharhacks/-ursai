export type ServiceStatus = 'ok';

export interface HealthResponse {
  service: 'ursai-api';
  status: ServiceStatus;
  timestamp: string;
}

export const API_VERSION = 'v1' as const;

export function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<HealthResponse>;
  return (
    candidate.service === 'ursai-api' &&
    candidate.status === 'ok' &&
    typeof candidate.timestamp === 'string'
  );
}
