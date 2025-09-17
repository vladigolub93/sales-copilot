'use client';

import { useMemo } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@types';

export function useSupabaseBrowser() {
  return useMemo(() => createBrowserSupabaseClient<Database>(), []);
}
