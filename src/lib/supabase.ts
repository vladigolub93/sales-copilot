import { createClient } from '@supabase/supabase-js';
import type { Database } from '@types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
}

if (!anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
}

export const supabase = createClient<Database>(url, anonKey);
