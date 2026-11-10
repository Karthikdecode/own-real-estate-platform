import type { HelmetOptions } from 'helmet';
import type { NodeEnv } from './env.schema.js';

export function createHelmetOptions(nodeEnv: NodeEnv): HelmetOptions {
  return {
    contentSecurityPolicy: {
      directives: {
        // Swagger UI is served over plain http://localhost outside production.
        upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
      },
    },
  };
}
