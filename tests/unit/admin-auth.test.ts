import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthResponse, UserResponse } from "@supabase/supabase-js";
import { ensureAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      refreshSession: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe("admin-auth / ensureAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna ok: true cuando el usuario tiene una sesión activa verificada por getUser", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: "test-admin-id", email: "pedidos@floreriamiraflores.com" } },
      error: null,
    } as unknown as UserResponse);

    const status = await ensureAdminSession();
    expect(status.ok).toBe(true);
    expect(status.email).toBe("pedidos@floreriamiraflores.com");
    expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
  });

  it("intenta refrescar la sesión si getUser falla y tiene éxito si el refresco funciona", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("JWT expired"),
    } as unknown as UserResponse);
    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({
      data: {
        session: { user: { id: "test-admin-id", email: "pedidos@floreriamiraflores.com" } },
        user: { id: "test-admin-id", email: "pedidos@floreriamiraflores.com" },
      },
      error: null,
    } as unknown as AuthResponse);

    const status = await ensureAdminSession();
    expect(status.ok).toBe(true);
    expect(status.email).toBe("pedidos@floreriamiraflores.com");
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("retorna ok: false con mensaje claro si tanto getUser como refreshSession fallan (sesión expirada)", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: new Error("JWT expired"),
    } as unknown as UserResponse);
    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new Error("Invalid refresh token"),
    } as unknown as AuthResponse);

    const status = await ensureAdminSession();
    expect(status.ok).toBe(false);
    expect(status.error).toContain("Tu sesión ha expirado");
  });
});
