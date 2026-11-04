import { supabase } from "./supabase";

export interface AdminSessionStatus {
  ok: boolean;
  email?: string;
  error?: string;
}

/**
 * Verifica de forma activa y fiable que exista una sesión autenticada válida.
 * Si el token JWT ha expirado, intenta refrescarlo automáticamente contra el servidor de Supabase.
 */
export async function ensureAdminSession(): Promise<AdminSessionStatus> {
  try {
    // 1. Obtener usuario verificado directamente desde Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData?.user) {
      return { ok: true, email: userData.user.email ?? undefined };
    }

    // 2. Si getUser falló o el token expiró, intentar refrescar la sesión explícitamente
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (!refreshError && refreshData?.session?.user) {
      return { ok: true, email: refreshData.session.user.email ?? undefined };
    }

    return {
      ok: false,
      error: "Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al verificar la sesión de administrador.",
    };
  }
}
