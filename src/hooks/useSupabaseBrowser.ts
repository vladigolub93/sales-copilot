'use client';

import { useMemo } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@types/database';

export function useSupabaseBrowser() {
  return useMemo(() => createBrowserSupabaseClient<Database>(), []);
}
