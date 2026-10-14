import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Star,
  ExternalLink,
  AlertTriangle,
  Save,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { TestimonioRow, TestimonioFuente, ConfigRow } from "@/types/database";
import { validateTestimonioForm, formatRating } from "@/lib/resenas-utils";
import { subirImagenConMiniaturas, eliminarImagenConMiniaturas } from "@/lib/image-optimizer";

export const Route = createFileRoute("/admin/testimonios")({
  head: () => ({ meta: [{ title: "Testimonios | Admin Florería Miraflores" }] }),
  component: TestimoniosAdminPage,
});

// --- Constantes ---

const BUCKET = "testimonios";
const FUENTES: { value: TestimonioFuente; label: string }[] = [
  { value: "google", label: "Google Reviews" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "directo", label: "Directo / Cliente Verificado" },
];

interface FormState {
  nombre: string;
  texto: string;
  estrellas: number;
  fecha: string;
  fuente: TestimonioFuente;
  enlace_original: string;
  imagen_url: string;
  destacado: boolean;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  texto: "",
  estrellas: 5,
  fecha: new Date().toISOString().split("T")[0],
  fuente: "google",
  enlace_original: "",
  imagen_url: "",
  destacado: false,
  activo: true,
};

// --- Componente Selector de Estrellas ---

function StarRatingSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div
      className="flex items-center gap-1.5"
      role="radiogroup"
      aria-label="Calificación en estrellas"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              (hover !== null ? star <= hover : star <= value)
                ? "fill-[#E0A96D] text-[#E0A96D]"
                : "fill-transparent text-[#E8DDD0]"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="font-body text-xs font-medium text-[#2C2420] ml-2">
        {value} de 5 estrellas
      </span>
    </div>
  );
}

// --- Modal de Formulario ---

function TestimonioModal({
  testimonio,
  onClose,
  onSave,
  saving,
}: {
  testimonio: TestimonioRow | null;
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!testimonio) return EMPTY_FORM;
    return {
      nombre: testimonio.nombre,
      texto: testimonio.texto,
      estrellas: testimonio.estrellas,
      fecha: testimonio.fecha ?? "",
      fuente: testimonio.fuente,
      enlace_original: testimonio.enlace_original ?? "",
      imagen_url: testimonio.imagen_url ?? "",
      destacado: testimonio.destacado,
      activo: testimonio.activo,
    };
  });

  const [uploading, setUploading] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }

    try {
      setUploading(true);
      const url = await subirImagenConMiniaturas(file, BUCKET, 1600);
      setForm((prev) => ({ ...prev, imagen_url: url }));
      toast.success("Foto subida correctamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la imagen a Storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (form.imagen_url) {
      void eliminarImagenConMiniaturas(form.imagen_url, BUCKET);
    }
    setForm((prev) => ({ ...prev, imagen_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTestimonioForm({
      nombre: form.nombre,
      texto: form.texto,
      estrellas: form.estrellas,
      fuente: form.fuente,
    });

    if (!validation.valid) {
      setErrores(validation.errors);
      toast.error("Por favor corrige los errores del formulario.");
      return;
    }

    setErrores({});
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden border border-[#E8DDD0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0] bg-[#FDFAF6]">
          <h2 className="font-display text-xl text-[#2C2420]">
            {testimonio ? "Editar Testimonio" : "Nuevo Testimonio"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Aviso fijo obligatorio según Prompt 07 §5 */}
          <div className="bg-[#FFF8E7] border border-[#E0A96D]/60 p-3.5 rounded flex items-start gap-2.5 text-xs text-[#8A5A1B] leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#E0A96D] mt-0.5" />
            <div>
              <p className="font-medium text-[#6B4611]">Regla de autenticidad:</p>
              <p>Copia la reseña tal cual aparece en Google. No la edites ni inventes reseñas.</p>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              Nombre del cliente *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: María P. o Carlos Gómez"
              className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A] transition-colors"
            />
            {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
          </div>

          {/* Calificación en estrellas */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5">
              Calificación (1 a 5 estrellas) *
            </label>
            <StarRatingSelector
              value={form.estrellas}
              onChange={(val) => setForm({ ...form, estrellas: val })}
            />
            {errores.estrellas && <p className="text-red-500 text-xs mt-1">{errores.estrellas}</p>}
          </div>

          {/* Texto de la reseña */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              Texto de la reseña (mínimo 10 caracteres) *
            </label>
            <textarea
              rows={4}
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="Copia aquí el texto exacto tal cual fue publicado en Google..."
              className="w-full p-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A] transition-colors resize-none leading-relaxed"
            />
            {errores.texto && <p className="text-red-500 text-xs mt-1">{errores.texto}</p>}
          </div>

          {/* Fuente y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
                Fuente *
              </label>
              <select
                value={form.fuente}
                onChange={(e) => setForm({ ...form, fuente: e.target.value as TestimonioFuente })}
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] bg-white outline-none focus:border-[#C4848A] transition-colors"
              >
                {FUENTES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
                Fecha de la reseña
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A] transition-colors"
              />
            </div>
          </div>

          {/* Enlace original */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              Enlace original de la reseña (opcional)
            </label>
            <input
              type="url"
              value={form.enlace_original}
              onChange={(e) => setForm({ ...form, enlace_original: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A] transition-colors"
            />
          </div>

          {/* Foto opcional del arreglo entregado */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5">
              Foto del arreglo entregado (opcional)
            </label>
            {form.imagen_url ? (
              <div className="flex items-center gap-3 p-3 border border-[#E8DDD0] rounded bg-[#FDFAF6]">
                <img
                  src={form.imagen_url}
                  alt="Foto arreglo"
                  className="w-14 h-14 object-cover rounded border border-[#E8DDD0]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-[#2C2420] truncate">Foto cargada</p>
                  <button
                    type="button"
                    onClick={handleEliminarFoto}
                    className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Eliminar foto
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSubirFoto}
                  disabled={uploading}
                  className="hidden"
                  id="subir-foto-testimonio"
                />
                <label
                  htmlFor="subir-foto-testimonio"
                  className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-[#E8DDD0] hover:border-[#C4848A] bg-[#FDFAF6] rounded cursor-pointer transition-colors text-xs font-body tracking-wider uppercase text-[#8A7A6E]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C4848A]" />
                      <span>Subiendo y optimizando WebP...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Subir foto del arreglo</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Toggles: Destacado y Activo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E8DDD0]/50">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded border border-[#E8DDD0]/50">
              <div>
                <p className="font-body text-xs font-medium text-[#2C2420]">Destacar testimonio</p>
                <p className="font-body text-[11px] text-[#8A7A6E]">
                  Aparecerá primero y en el Home
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, destacado: !form.destacado })}
                className="cursor-pointer"
                aria-label="Toggle destacar"
              >
                {form.destacado ? (
                  <ToggleRight className="w-7 h-7 text-[#C4848A]" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-[#8A7A6E]" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded border border-[#E8DDD0]/50">
              <div>
                <p className="font-body text-xs font-medium text-[#2C2420]">Activo / Visible</p>
                <p className="font-body text-[11px] text-[#8A7A6E]">Se muestra en la web pública</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, activo: !form.activo })}
                className="cursor-pointer"
                aria-label="Toggle activo"
              >
                {form.activo ? (
                  <ToggleRight className="w-7 h-7 text-[#C4848A]" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-[#8A7A6E]" />
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0] bg-[#FDFAF6]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
            className="px-4 py-2 text-xs font-body tracking-wider uppercase text-[#8A7A6E] hover:text-[#2C2420]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2C2420] hover:bg-[#2C2420]/85 text-white text-xs font-body tracking-wider uppercase font-medium rounded transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Testimonio</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Página Principal del Admin de Testimonios ---

function TestimoniosAdminPage() {
  const [testimonios, setTestimonios] = useState<TestimonioRow[]>([]);
  const [config, setConfig] = useState<ConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Estados del modal y edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<TestimonioRow | null>(null);
  const [eliminando, setEliminando] = useState<TestimonioRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados de configuración de Google
  const [googleUrl, setGoogleUrl] = useState("");
  const [googleRating, setGoogleRating] = useState("");
  const [googleReviewsCount, setGoogleReviewsCount] = useState("");
  const [mostrarHome, setMostrarHome] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setTableMissing(false);

    try {
      // 1. Cargar Config
      const { data: configData, error: configError } = await supabase
        .from("config")
        .select("*")
        .maybeSingle();

      if (!configError && configData) {
        setConfig(configData);
        setGoogleUrl(configData.google_reviews_url ?? "");
        setGoogleRating(
          configData.google_rating !== null && configData.google_rating !== undefined
            ? String(configData.google_rating)
            : "",
        );
        setGoogleReviewsCount(
          configData.google_reviews_count !== null && configData.google_reviews_count !== undefined
            ? String(configData.google_reviews_count)
            : "",
        );
        setMostrarHome(Boolean(configData.mostrar_resenas_home));
      }

      // 2. Cargar Testimonios
      const { data: testimoniosData, error: testError } = await supabase
        .from("testimonios")
        .select("*")
        .order("destacado", { ascending: false })
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false });

      if (testError) {
        if (
          testError.code === "42P01" ||
          testError.code === "PGRST205" ||
          testError.message?.includes("testimonios")
        ) {
          setTableMissing(true);
          setTestimonios([]);
        } else {
          toast.error(`Error al cargar testimonios: ${testError.message}`);
        }
      } else {
        setTestimonios(testimoniosData ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos del panel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Guardar configuración de Google
  const handleGuardarConfigGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);

    try {
      const parsedRating = googleRating.trim() ? parseFloat(googleRating.replace(",", ".")) : null;
      const parsedCount = googleReviewsCount.trim() ? parseInt(googleReviewsCount, 10) : null;

      const payload: Partial<ConfigRow> = {
        google_reviews_url: googleUrl.trim() || null,
        google_rating: parsedRating,
        google_reviews_count: parsedCount,
        mostrar_resenas_home: mostrarHome,
      };

      if (config?.id) {
        const { error } = await supabase.from("config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("config").insert(payload);
        if (error) throw error;
      }

      toast.success("Configuración de Google Reviews actualizada correctamente.");
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "error desconocido";
      toast.error(`Error al guardar configuración: ${msg}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Crear / Editar Testimonio
  const handleSaveTestimonio = async (form: FormState) => {
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        texto: form.texto.trim(),
        estrellas: form.estrellas,
        fecha: form.fecha || null,
        fuente: form.fuente,
        enlace_original: form.enlace_original.trim() || null,
        imagen_url: form.imagen_url || null,
        destacado: form.destacado,
        activo: form.activo,
      };

      if (editando) {
        const { error } = await supabase.from("testimonios").update(payload).eq("id", editando.id);
        if (error) throw error;
        toast.success("Testimonio actualizado con éxito.");
      } else {
        const { error } = await supabase
          .from("testimonios")
          .insert({ ...payload, orden: testimonios.length });
        if (error) throw error;
        toast.success("Testimonio registrado con éxito.");
      }

      setModalOpen(false);
      setEditando(null);
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "intente nuevamente";
      toast.error(`Error al guardar el testimonio: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Activo
  const handleToggleActivo = async (item: TestimonioRow) => {
    try {
      const { error } = await supabase
        .from("testimonios")
        .update({ activo: !item.activo })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(item.activo ? "Testimonio desactivado" : "Testimonio activado");
      await cargarDatos();
    } catch {
      toast.error("No se pudo cambiar el estado activo.");
    }
  };

  // Toggle Destacado
  const handleToggleDestacado = async (item: TestimonioRow) => {
    try {
      const { error } = await supabase
        .from("testimonios")
        .update({ destacado: !item.destacado })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(item.destacado ? "Removido de destacados" : "Marcado como destacado");
      await cargarDatos();
    } catch {
      toast.error("No se pudo cambiar el estado destacado.");
    }
  };

  // Reordenar ↑ / ↓
  const handleMoverOrden = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonios.length) return;

    const itemA = testimonios[index];
    const itemB = testimonios[targetIndex];

    try {
      await Promise.all([
        supabase.from("testimonios").update({ orden: itemB.orden }).eq("id", itemA.id),
        supabase.from("testimonios").update({ orden: itemA.orden }).eq("id", itemB.id),
      ]);
      toast.success("Orden actualizado.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cambiar el orden.");
    }
  };

  // Eliminar Testimonio
  const handleConfirmarEliminar = async () => {
    if (!eliminando) return;
    try {
      const { error } = await supabase.from("testimonios").delete().eq("id", eliminando.id);
      if (error) throw error;

      if (eliminando.imagen_url) {
        void eliminarImagenConMiniaturas(eliminando.imagen_url, BUCKET);
      }

      toast.success("Testimonio eliminado correctamente.");
      setEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar testimonio.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[#2C2420]">
            Gestión de Testimonios y Reseñas
          </h1>
          <p className="font-body text-sm text-[#8A7A6E] mt-1">
            Administra las opiniones reales copiadas de Google y la configuración de visibilidad en
            el Home.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setModalOpen(true);
          }}
          disabled={tableMissing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] hover:bg-[#2C2420]/85 text-white font-body text-xs tracking-wider uppercase font-medium rounded shadow-xs transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Testimonio</span>
        </button>
      </div>

      {/* Alerta de tabla pendiente según Prompt 07 §5 */}
      {tableMissing && (
        <div
          className="bg-amber-50 border-2 border-amber-300 p-5 rounded-lg flex items-start gap-4 text-amber-900"
          data-testid="sql-007-warning"
        >
          <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium text-base text-amber-950">Falta correr el SQL 007</h3>
            <p className="text-sm leading-relaxed">
              La tabla{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
                public.testimonios
              </code>{" "}
              aún no existe en la base de datos de producción. Una vez que el revisor apruebe y se
              ejecute la migración{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
                docs/sql/007-testimonios.sql
              </code>
              , el panel se activará automáticamente sin requerir cambios de código.
            </p>
          </div>
        </div>
      )}

      {/* Bloque: Resumen de Google & Configuración del Home */}
      <div className="bg-white border border-[#E8DDD0] rounded-lg p-6 shadow-xs space-y-4">
        <div className="border-b border-[#E8DDD0]/60 pb-3">
          <h2 className="font-display text-lg text-[#2C2420]">
            Configuración de Google Reviews & Franja del Home
          </h2>
          <p className="font-body text-xs text-[#8A7A6E]">
            Estos valores alimentan el resumen «★ {googleRating || "4,9"} ·{" "}
            {googleReviewsCount || "120"} reseñas» y el botón externo.
          </p>
        </div>

        <form
          onSubmit={handleGuardarConfigGoogle}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* URL de Google Reviews */}
          <div className="lg:col-span-2">
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              URL del Perfil de Google Reviews
            </label>
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A]"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              Puntuación Google (Rating)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={googleRating}
              onChange={(e) => setGoogleRating(e.target.value)}
              placeholder="4.9"
              className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A]"
            />
          </div>

          {/* Total Reseñas */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1">
              Total de Reseñas Google
            </label>
            <input
              type="number"
              min="0"
              value={googleReviewsCount}
              onChange={(e) => setGoogleReviewsCount(e.target.value)}
              placeholder="120"
              className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4848A]"
            />
          </div>

          {/* Toggle Franja del Home */}
          <div className="lg:col-span-3 flex items-center justify-between p-3 bg-[#FAF8F5] rounded border border-[#E8DDD0]/60">
            <div>
              <p className="font-body text-xs font-medium text-[#2C2420]">
                Mostrar franja de reseñas en la página de inicio (Home)
              </p>
              <p className="font-body text-[11px] text-[#8A7A6E]">
                Nota técnica: solo aparecerá si este switch está encendido Y existen al menos 3
                testimonios activos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarHome(!mostrarHome)}
              className="cursor-pointer"
              aria-label="Toggle mostrar en home"
            >
              {mostrarHome ? (
                <ToggleRight className="w-8 h-8 text-[#C4848A]" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-[#8A7A6E]" />
              )}
            </button>
          </div>

          {/* Botón Guardar Config */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2C2420] hover:bg-[#2C2420]/85 text-white font-body text-xs tracking-wider uppercase font-medium rounded transition-colors disabled:opacity-50"
            >
              {savingConfig ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Testimonios */}
      <div className="bg-white border border-[#E8DDD0] rounded-lg overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-[#E8DDD0] flex items-center justify-between">
          <h2 className="font-display text-lg text-[#2C2420]">
            Listado de Testimonios ({testimonios.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#8A7A6E]">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="font-body text-xs">Cargando testimonios...</p>
          </div>
        ) : testimonios.length === 0 ? (
          <div className="py-16 text-center text-[#8A7A6E] px-4">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#E8DDD0]" />
            <p className="font-body text-sm font-medium text-[#2C2420]">
              {tableMissing ? "Tabla pendiente de creación" : "No hay testimonios registrados"}
            </p>
            <p className="font-body text-xs text-[#8A7A6E] mt-1 max-w-sm mx-auto">
              {tableMissing
                ? "Ejecuta la migración 007 en Supabase para comenzar a añadir reseñas."
                : "Haz clic en «Nuevo Testimonio» para registrar una reseña real de Google."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6] text-[11px] font-body tracking-wider uppercase text-[#8A7A6E]">
                  <th className="py-3 px-4 w-12 text-center">Orden</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Calificación</th>
                  <th className="py-3 px-4">Reseña</th>
                  <th className="py-3 px-4">Fuente</th>
                  <th className="py-3 px-4 text-center">Destacado</th>
                  <th className="py-3 px-4 text-center">Activo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]/60 font-body text-sm">
                {testimonios.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                    {/* Reordenar */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => handleMoverOrden(index, "up")}
                          disabled={index === 0}
                          className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-20 p-0.5"
                          title="Subir orden"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-[#8A7A6E] font-mono">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoverOrden(index, "down")}
                          disabled={index === testimonios.length - 1}
                          className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-20 p-0.5"
                          title="Bajar orden"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.imagen_url && (
                          <img
                            src={item.imagen_url}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-[#E8DDD0] shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-medium text-[#2C2420]">{item.nombre}</p>
                          {item.fecha && <p className="text-[11px] text-[#8A7A6E]">{item.fecha}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Estrellas */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.estrellas
                                ? "fill-[#E0A96D] text-[#E0A96D]"
                                : "text-[#E8DDD0]"
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Texto Reseña */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="line-clamp-2 text-xs text-[#2C2420]/80">{item.texto}</p>
                    </td>

                    {/* Fuente */}
                    <td className="py-3 px-4 capitalize text-xs text-[#8A7A6E]">
                      {item.enlace_original ? (
                        <a
                          href={item.enlace_original}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{item.fuente}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        item.fuente
                      )}
                    </td>

                    {/* Destacado */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDestacado(item)}
                        className="cursor-pointer"
                        title={
                          item.destacado
                            ? "Destacado (clic para quitar)"
                            : "No destacado (clic para destacar)"
                        }
                      >
                        {item.destacado ? (
                          <Star className="w-5 h-5 fill-[#E0A96D] text-[#E0A96D] mx-auto" />
                        ) : (
                          <Star className="w-5 h-5 text-[#E8DDD0] hover:text-[#8A7A6E] mx-auto" />
                        )}
                      </button>
                    </td>

                    {/* Activo */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActivo(item)}
                        className="cursor-pointer"
                        title={
                          item.activo ? "Activo (clic para ocultar)" : "Oculto (clic para publicar)"
                        }
                      >
                        {item.activo ? (
                          <ToggleRight className="w-7 h-7 text-[#C4848A] mx-auto" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-[#8A7A6E] mx-auto" />
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(item);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] transition-colors rounded hover:bg-[#FAF8F5]"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEliminando(item)}
                          className="p-1.5 text-red-500 hover:text-red-700 transition-colors rounded hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {modalOpen && (
        <TestimonioModal
          testimonio={editando}
          onClose={() => {
            setModalOpen(false);
            setEditando(null);
          }}
          onSave={handleSaveTestimonio}
          saving={saving}
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setEliminando(null)}
          />
          <div className="relative bg-white w-full max-w-md p-6 rounded-lg shadow-xl border border-[#E8DDD0]">
            <h3 className="font-display text-lg text-[#2C2420] mb-2">¿Eliminar testimonio?</h3>
            <p className="font-body text-sm text-[#8A7A6E] mb-6 leading-relaxed">
              Esta acción eliminará permanentemente la reseña de «{eliminando.nombre}». No se puede
              deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEliminando(null)}
                className="px-4 py-2 text-xs font-body tracking-wider uppercase text-[#8A7A6E] hover:text-[#2C2420]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-body tracking-wider uppercase font-medium rounded transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
