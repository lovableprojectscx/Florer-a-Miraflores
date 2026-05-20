import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login | Florería Miraflores" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);

  // Si ya hay sesión activa → ir al dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        navigate({ to: "/admin/dashboard" });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      return;
    }

    navigate({ to: "/admin/dashboard" });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-display italic font-bold text-4xl text-[#2C2420]">Miraflores</span>
          <p className="mt-1 text-[9px] tracking-widest uppercase font-body font-light text-[#8A7A6E]">
            panel de administración
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E8DDD0] p-8">
          <h1 className="font-display text-2xl text-[#2C2420] mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label htmlFor="email" className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@floreriamiraflores.com"
                className="w-full h-11 px-4 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/50 outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/50 outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>

            {error && (
              <p className="font-body text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-50 text-white text-[11px] tracking-widest uppercase font-body font-medium transition-colors"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>

          </form>
        </div>

        <p className="text-center mt-6 font-body text-xs text-[#8A7A6E]">
          <a href="/" className="hover:text-[#C4956A] transition-colors underline underline-offset-2">
            ← Volver a la tienda
          </a>
        </p>

      </div>
    </div>
  );
}
