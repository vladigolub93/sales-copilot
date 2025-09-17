import type { RetellClient } from '@retell/sdk';

let retellClient: RetellClient | null = null;

export async function getRetellClient() {
  if (retellClient) {
    return retellClient;
  }

  if (!process.env.RETELL_API_KEY) {
    throw new Error('RETELL_API_KEY is not set.');
  }

  const { Retell } = await import('@retell/sdk');
  retellClient = new Retell({ apiKey: process.env.RETELL_API_KEY });
  return retellClient;
}
