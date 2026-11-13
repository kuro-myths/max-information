import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDatabaseConfigured = Boolean(url && key);
export const supabase = isDatabaseConfigured
  ? createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Application-Name": "max-information" } }
    })
  : null;