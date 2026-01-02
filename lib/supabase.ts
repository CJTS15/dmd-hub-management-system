import { createBrowserClient } from '@supabase/ssr';

// This client is for use in Client Components (pages, forms, etc.)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);