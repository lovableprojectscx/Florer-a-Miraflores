import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ConfigRow } from "@/types/database";

export const Route = createFileRoute("/admin/config")({
  head: () => ({ meta: [{ title: "Configuracion | Admin Floreria Miraflores" }] }),
  component: ConfigPage,
});

// --- Tipos ---

interface FormState {
  whatsapp: string;
  correo: string;
  horario: string;
  anuncio_barra: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  libro_reclamaciones_activo: boolean;
}

const EMPTY: FormState = {
  whatsapp: "",
  correo: "",
  horario: "",
  anuncio_barra: "",
  instagram_url: "",
  tiktok_url: "",
  facebook_url: "",
  libro_reclamaciones_activo: false,
};

function rowToForm(r: ConfigRow): FormState {
  return {
    whatsapp: r.whatsapp ?? "",
    correo: r.correo ?? "",
    horario: r.horario ?? "",
    anuncio_barra: r.anuncio_barra ?? "",
    instagram_url: r.instagram_url ?? "",
    tiktok_url: r.tiktok_url ?? "",
    facebook_url: r.facebook_url ?? "",
    libro_reclamaciones_activo: r.libro_reclamaciones_activo ?? false,
  };
}

// --- Field helper ---

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-[#E8DDD0] bg-white font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
      />
    </div>
  );
}

// --- Pagina ---

function ConfigPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("config").select("*").maybeSingle();
      if (err) throw new Error(err.message);
      if (data) {
        setConfigId(data.id);
        setForm(rowToForm(data));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function set(key: keyof FormState) {
    return (value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const payload = {
      whatsapp: form.whatsapp || null,
      correo: form.correo || null,
      horario: form.horario || null,
      anuncio_barra: form.anuncio_barra || null,
      instagram_url: form.instagram_url || null,
      tiktok_url: form.tiktok_url || null,
      facebook_url: form.facebook_url || null,
      libro_reclamaciones_activo: form.libro_reclamaciones_activo,
    };

    try {
      if (configId) {
        const { error: err } = await supabase.from("config").update(payload).eq("id", configId);
        if (err) throw new Error(err.message);
      } else {
        const { data, error: err } = await supabase
          .from("config")
          .insert(payload)
          .select("id")
          .single();
        if (err) throw new Error(err.message);
        setConfigId(data.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C4956A]" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Titulo */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-[#2C2420]">Configuracion General</h1>
          <p className="font-body text-sm text-[#8A7A6E] mt-1">
            Datos de contacto, redes sociales y ajustes del sitio
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 font-body text-sm text-green-700">
            Configuracion guardada correctamente.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Contacto */}
          <section className="bg-white border border-[#E8DDD0] p-6">
            <h2 className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5">
              Contacto
            </h2>
            <div className="space-y-4">
              <Field
                label="WhatsApp"
                value={form.whatsapp}
                onChange={set("whatsapp")}
                placeholder="+51 999 600 482"
              />
              <Field
                label="Correo"
                value={form.correo}
                onChange={set("correo")}
                placeholder="pedidos@floreriamiraflores.com"
                type="email"
              />
              <Field
                label="Horario"
                value={form.horario}
                onChange={set("horario")}
                placeholder="Lunes a Domingo, 9am a 9pm"
              />
            </div>
          </section>

          {/* Redes sociales */}
          <section className="bg-white border border-[#E8DDD0] p-6">
            <h2 className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5">
              Redes Sociales
            </h2>
            <div className="space-y-4">
              <Field
                label="Instagram URL"
                value={form.instagram_url}
                onChange={set("instagram_url")}
                placeholder="https://www.instagram.com/floreriamirafloreslima"
              />
              <Field
                label="TikTok URL"
                value={form.tiktok_url}
                onChange={set("tiktok_url")}
                placeholder="https://www.tiktok.com/@floreriamirafloreslima"
              />
              <Field
                label="Facebook URL"
                value={form.facebook_url}
                onChange={set("facebook_url")}
                placeholder="https://www.facebook.com/..."
              />
            </div>
          </section>

          {/* Barra de anuncio */}
          <section className="bg-white border border-[#E8DDD0] p-6">
            <h2 className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5">
              Barra de Anuncio
            </h2>
            <Field
              label="Texto del anuncio"
              value={form.anuncio_barra}
              onChange={set("anuncio_barra")}
              placeholder="Ej: Delivery gratuito en pedidos mayores a S/200"
            />
            <p className="mt-2 font-body text-xs text-[#8A7A6E]">
              Se muestra en la barra superior del sitio. Dejalo vacio para ocultarla.
            </p>
          </section>

          {/* Ajustes */}
          <section className="bg-white border border-[#E8DDD0] p-6">
            <h2 className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5">
              Ajustes del Sitio
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => set("libro_reclamaciones_activo")(!form.libro_reclamaciones_activo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.libro_reclamaciones_activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.libro_reclamaciones_activo ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <div>
                <p className="font-body text-sm text-[#2C2420]">Libro de Reclamaciones activo</p>
                <p className="font-body text-xs text-[#8A7A6E]">
                  Muestra el enlace al libro de reclamaciones en el footer
                </p>
              </div>
            </label>
          </section>

          {/* Guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-8 bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.5} />
              )}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
