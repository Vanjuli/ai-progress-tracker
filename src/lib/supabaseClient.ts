// Supabase client — null in demo mode (no credentials configured).

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config";

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null;
