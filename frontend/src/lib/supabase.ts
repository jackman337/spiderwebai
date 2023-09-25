import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { CookieKeys } from './storage';

// Client side client
export const supabase = createClient(
  String(import.meta.env.PUBLIC_SUPABASE_URL),
  String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  }
);

// Server side admin client
export function createSupabaseAdminClient() {
  return createClient(
    String(import.meta.env.PUBLIC_SUPABASE_URL),
    String(import.meta.env.SUPABASE_SERVICE_ROLE),
    {
      auth: { persistSession: false, autoRefreshToken: typeof window !== 'undefined' },
    }
  );
}

// Service side user client
export async function authenticateSupabaseClientFromRequest(req?: AstroCookies, headers?: Headers) {
  const access_token =
    req?.get(CookieKeys.ACCESS_TOKEN)?.value ?? headers?.get('authorization') ?? '';
  const refresh_token =
    req?.get(CookieKeys.REFRESH_TOKEN)?.value ?? headers?.get('refresh-token') ?? '';

  if (!access_token || !refresh_token) return;

  try {
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    return supabase;
  } catch (_) {
    // silent unauth error
  }
}
