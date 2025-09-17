'use client';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@types';

let client = createBrowserSupabaseClient<Database>();

export function getSupabaseBrowserClient() {
  return client;
}
