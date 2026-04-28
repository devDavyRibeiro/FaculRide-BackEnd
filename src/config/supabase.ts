// src/config/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE ausentes nas variáveis de ambiente.");
}

// Client com privilégios de servidor (usa SERVICE_ROLE) — use somente no back-end.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
