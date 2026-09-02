import { createClient } from "@supabase/supabase-js";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  IPINFO_TOKEN?: string;

  VIRUSTOTAL_API_KEY?: string;
  ABUSEIPDB_API_KEY?: string;
  URLSCAN_API_KEY?: string;
}

export function getSupabase(env: Env) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}