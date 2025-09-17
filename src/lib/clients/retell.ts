interface RetellCallCreatePayload {
  assistant_id?: string;
  customer_number?: string;
  metadata?: Record<string, unknown>;
  prompt?: string;
}

interface MockRetellCallResponse {
  id: string;
}

interface RetellClient {
  calls: {
    create: (payload: RetellCallCreatePayload) => Promise<MockRetellCallResponse>;
  };
}

let retellClient: RetellClient | null = null;

export async function getRetellClient(): Promise<RetellClient> {
  if (retellClient) {
    return retellClient;
  }

  // Temporary mock client because @retell/sdk is unavailable in npm registry.
  retellClient = {
    calls: {
      async create() {
        return { id: `mock-call-${Date.now()}` };
      }
    }
  };

  return retellClient;
}
