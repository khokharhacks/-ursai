import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@ursai/contracts';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      service: 'ursai-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
