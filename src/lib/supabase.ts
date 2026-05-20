import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "") as string;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "") as string;

/**
 * Cliente singleton de Supabase.
 * Tipado con la interfaz Database para autocompletado en el IDE.
 * Las funciones en queries.ts tienen return types explícitos para seguridad adicional.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<Database>(supabaseUrl, supabaseKey) as any;
