// Runtime configuration sourced from Vite env vars.

import { DEFAULT_VERIFY_THRESHOLD } from "./verification";

/**
 * Strip a leading UTF-8 BOM (U+FEFF) and surrounding whitespace. Env vars set from
 * a BOM-encoded source (e.g. PowerShell's default UTF-16) otherwise carry an invisible
 * BOM that crashes supabase-js: HTTP header values must be bytes 0-255, and U+FEFF
 * (65279) throws "Cannot convert argument to ByteString".
 */
function clean(v: string | undefined): string | undefined {
  if (v == null) return v;
  const stripped = v.charCodeAt(0) === 0xfeff ? v.slice(1) : v;
  return stripped.trim();
}

export const SUPABASE_URL = clean(import.meta.env.VITE_SUPABASE_URL as string | undefined);
export const SUPABASE_ANON_KEY = clean(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const VERIFY_THRESHOLD =
  Number(import.meta.env.VITE_VERIFY_THRESHOLD) || DEFAULT_VERIFY_THRESHOLD;

/** True when real Supabase credentials are present; otherwise the app runs in demo mode. */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
