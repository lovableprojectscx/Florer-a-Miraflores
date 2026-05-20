import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  ImageOff,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { BannerRow } from "@/types/database";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({ meta: [{ title: "Banners | Admin Florería Miraflores" }] }),
  component: BannersPage,
});

// --- Constantes ---

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const BUCKET = "banners";

interface FormState {
  titulo: string;
  subtexto: string;
  cta_texto: string;
  cta_link: string;
  imagen_url: string;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  titulo: "",
  subtexto: "",
  cta_texto: "",
  cta_link: "",
  imagen_url: "",
  activo: true,
};

// --- Helpers ---

async function subirImagen(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw new Error(`Upload: ${uploadError.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function eliminarImagenStorage(url: string) {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/banners\/(.+)/);
    if (!match) return;
    await supabase.storage.from(BUCKET).remove([match[1]]);
  } catch {
    // silencioso
  }
}

// --- Skeleton ---

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-4 w-44">
            <div className="aspect-[21/9] bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-32 bg-[#F5EFE6] rounded mb-1" />
            <div className="h-3 w-48 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-24 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-12 bg-[#F5EFE6] rounded mx-auto" />
          </td>
          <td className="px-4 py-4">
            <div className="h-6 w-10 bg-[#F5EFE6] rounded-full mx-auto" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-16 bg-[#F5EFE6] rounded ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

// --- Formulario Modal ---

interface BannerFormProps {
  initial: FormState;
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  titulo: string;
}

function BannerForm({ initial, saving, onClose, onSave, titulo }: BannerFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Solo se aceptan imágenes JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("El archivo supera el límite de 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await subirImagen(file);
      setForm((prev) => ({ ...prev, imagen_url: url }));
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Error al subir la imagen. Verifica que exista el bucket 'banners'.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveImagen() {
    const url = form.imagen_url;
    setForm((prev) => ({ ...prev, imagen_url: "" }));
    if (url) void eliminarImagenStorage(url);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.imagen_url) errs.imagen_url = "Debes subir una imagen para el banner.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    void onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD0] flex-shrink-0">
          <h2 className="font-display text-2xl text-[#2C2420]">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Imagen Banner */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
              Imagen del Banner *
            </label>
            {form.imagen_url ? (
              <div className="relative group w-full aspect-[21/9] bg-[#F5EFE6] overflow-hidden border border-[#E8DDD0]">
                <img src={form.imagen_url} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImagen}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 font-body text-xs tracking-widest uppercase"
                  >
                    Eliminar imagen
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[21/9] border-2 border-dashed border-[#E8DDD0] hover:border-[#C4956A] bg-[#FDFAF6] cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-[#C4956A] animate-spin" strokeWidth={1.5} />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#8A7A6E] mb-1.5" strokeWidth={1.5} />
                    <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] text-center px-4">
                      Subir imagen de Banner
                    </span>
                    <span className="font-body text-[10px] text-[#C4956A] mt-1 text-center px-4">
                      Medida recomendada: 1920x800 px (o proporción similar, ej. 1600x660).
                    </span>
                    <span className="font-body text-[9px] text-[#8A7A6E] mt-0.5 text-center px-4 leading-normal">
                      Sube la imagen con el diseño y texto ya incorporados. En móviles y PC se
                      adaptará automáticamente a pantalla completa sin recortarse ni estirarse.
                    </span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
            )}
            {errors.imagen_url && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.imagen_url}</p>
            )}
            {uploadError && (
              <p className="mt-2 font-body text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                {uploadError}
              </p>
            )}
          </div>

          {/* Título */}
          <div>
            <label
              htmlFor="titulo"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Título (Opcional)
            </label>
            <input
              id="titulo"
              type="text"
              value={form.titulo}
              onChange={(e) => setField("titulo", e.target.value)}
              placeholder="Ej: Rosas Premium de Estación"
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
          </div>

          {/* Subtexto */}
          <div>
            <label
              htmlFor="subtexto"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Subtexto / Descripción (Opcional)
            </label>
            <textarea
              id="subtexto"
              rows={2}
              value={form.subtexto}
              onChange={(e) => setField("subtexto", e.target.value)}
              placeholder="Ej: Sorprende con los arreglos más finos y elegantes de Miraflores."
              className="w-full p-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors resize-none"
            />
          </div>

          {/* CTA Botón */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cta_texto"
                className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
              >
                Texto del botón (Opcional)
              </label>
              <input
                id="cta_texto"
                type="text"
                value={form.cta_texto}
                onChange={(e) => setField("cta_texto", e.target.value)}
                placeholder="Ej: Ver catálogo"
                className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="cta_link"
                className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
              >
                Enlace de destino (Opcional)
              </label>
              <input
                id="cta_link"
                type="text"
                value={form.cta_link}
                onChange={(e) => setField("cta_link", e.target.value)}
                placeholder="Ej: /categoria/rosas"
                className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between pt-1">
            <label className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
              Mostrar en la página de inicio
            </label>
            <button
              type="button"
              onClick={() => setField("activo", !form.activo)}
              className="transition-colors"
            >
              {form.activo ? (
                <ToggleRight className="h-7 w-7 text-[#C4956A]" strokeWidth={1.5} />
              ) : (
                <ToggleLeft className="h-7 w-7 text-[#8A7A6E]" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
            className="h-10 px-5 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="h-10 px-6 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-50 text-white text-[11px] tracking-widest uppercase font-body font-medium transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Confirmación de eliminación ---

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm p-6 shadow-xl">
        <h3 className="font-display text-xl text-[#2C2420] mb-2">¿Eliminar banner?</h3>
        <p className="font-body text-sm text-[#8A7A6E] mb-6">
          Vas a eliminar este banner permanentemente. Dejará de mostrarse en la portada de la tienda
          inmediatamente.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="h-10 px-5 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-body text-xs tracking-widest uppercase transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Componente de página ---

function BannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando] = useState<BannerRow | null>(null);
  const [eliminando, setEliminando] = useState<BannerRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("orden", { ascending: true });

      if (error) throw error;
      setBanners((data ?? []) as BannerRow[]);
    } catch (err) {
      console.error("Error al cargar banners:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function handleCreate(form: FormState) {
    setSaving(true);
    try {
      const maxOrden = banners.reduce((max, b) => Math.max(max, b.orden), 0);

      const { error } = await supabase.from("banners").insert({
        titulo: form.titulo.trim() || null,
        subtexto: form.subtexto.trim() || null,
        cta_texto: form.cta_texto.trim() || null,
        cta_link: form.cta_link.trim() || null,
        imagen_url: form.imagen_url,
        activo: form.activo,
        orden: maxOrden + 1,
      });

      if (error) throw error;
      setShowCreate(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al registrar el banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: FormState) {
    if (!editando) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("banners")
        .update({
          titulo: form.titulo.trim() || null,
          subtexto: form.subtexto.trim() || null,
          cta_texto: form.cta_texto.trim() || null,
          cta_link: form.cta_link.trim() || null,
          imagen_url: form.imagen_url,
          activo: form.activo,
        })
        .eq("id", editando.id);

      if (error) throw error;
      setEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eliminando) return;
    try {
      const { error } = await supabase.from("banners").delete().eq("id", eliminando.id);
      if (error) throw error;

      // Borrar de storage
      if (eliminando.imagen_url) {
        void eliminarImagenStorage(eliminando.imagen_url);
      }

      setEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el banner.");
    }
  }

  async function handleToggleActivo(ban: BannerRow) {
    setTogglingId(ban.id);
    try {
      const { error } = await supabase
        .from("banners")
        .update({ activo: !ban.activo })
        .eq("id", ban.id);

      if (error) throw error;
      setBanners((prev) => prev.map((b) => (b.id === ban.id ? { ...b, activo: !b.activo } : b)));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleReorder(ban: BannerRow, direction: "up" | "down") {
    const index = banners.findIndex((b) => b.id === ban.id);

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === banners.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const targetBan = banners[targetIndex];

    try {
      const { error: error1 } = await supabase
        .from("banners")
        .update({ orden: targetBan.orden })
        .eq("id", ban.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("banners")
        .update({ orden: ban.orden })
        .eq("id", targetBan.id);

      if (error2) throw error2;

      await cargarDatos();
    } catch (err) {
      console.error("Error al reordenar:", err);
    }
  }

  return (
    <div className="p-8 md:p-10">
      {/* Encabezado */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Banners de Portada</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nuevo banner
        </button>
      </div>

      {!loading && (
        <p className="font-body text-xs text-[#8A7A6E] mb-4">
          {banners.length} {banners.length === 1 ? "banner registrado" : "banners registrados"}
        </p>
      )}

      {/* Tabla */}
      <div className="bg-white border border-[#E8DDD0] overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6]">
              <th className="px-4 py-3 text-left w-52 font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Vista previa
              </th>
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Contenido
              </th>
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Botón de Acción
              </th>
              <th className="px-4 py-3 text-center font-body text-xs tracking-widest uppercase text-[#8A7A6E] w-24">
                Prioridad
              </th>
              <th className="px-4 py-3 text-center font-body text-xs tracking-widest uppercase text-[#8A7A6E] w-28">
                Activo
              </th>
              <th className="px-4 py-3 text-right font-body text-xs tracking-widest uppercase text-[#8A7A6E] w-28">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]">
                  No hay banners cargados. Agrega uno con el botón superior.
                </td>
              </tr>
            ) : (
              banners.map((ban, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === banners.length - 1;

                return (
                  <tr
                    key={ban.id}
                    className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6]/50 transition-colors"
                  >
                    {/* Vista Previa */}
                    <td className="px-4 py-4 w-52">
                      <div className="w-48 aspect-[21/9] bg-[#F5EFE6] overflow-hidden border border-[#E8DDD0]/50 rounded-sm">
                        {ban.imagen_url ? (
                          <img
                            src={ban.imagen_url}
                            alt="Banner Preview"
                            className="w-full h-full object-cover animate-fade-in"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-[#E8DDD0]" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Contenido (Título + Subtexto) */}
                    <td className="px-4 py-4">
                      <p className="font-body text-sm font-semibold text-[#2C2420] mb-0.5">
                        {ban.titulo ?? (
                          <span className="font-normal italic text-[#8A7A6E]">Sin título</span>
                        )}
                      </p>
                      <p className="font-body text-xs text-[#8A7A6E] line-clamp-2">
                        {ban.subtexto ?? (
                          <span className="italic text-[#8A7A6E]/70">Sin descripción</span>
                        )}
                      </p>
                    </td>

                    {/* Botón Acción (CTA Texto + Link) */}
                    <td className="px-4 py-4">
                      {ban.cta_texto ? (
                        <div className="space-y-1">
                          <span className="inline-flex px-2 py-0.5 font-body text-[10px] tracking-widest uppercase border border-[#2C2420]/30 text-[#2C2420] bg-[#FDFAF6]">
                            {ban.cta_texto}
                          </span>
                          {ban.cta_link && (
                            <p className="flex items-center gap-1 font-body text-[10px] text-[#C4956A]">
                              <LinkIcon className="h-3 w-3" />
                              {ban.cta_link}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="font-body text-xs text-[#8A7A6E]/50 italic">Ninguno</span>
                      )}
                    </td>

                    {/* Orden (↑↓) */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReorder(ban, "up")}
                          disabled={isFirst}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(ban, "down")}
                          disabled={isLast}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Activo (Toggle) */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleActivo(ban)}
                        disabled={togglingId === ban.id}
                        className="transition-colors disabled:opacity-50"
                        title={ban.activo ? "Ocultar" : "Mostrar"}
                      >
                        {togglingId === ban.id ? (
                          <Loader2
                            className="h-5 w-5 text-[#C4956A] animate-spin mx-auto"
                            strokeWidth={1.5}
                          />
                        ) : ban.activo ? (
                          <ToggleRight className="h-6 w-6 text-[#C4956A]" strokeWidth={1.5} />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-[#8A7A6E]" strokeWidth={1.5} />
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditando(ban)}
                          className="p-1.5 text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setEliminando(ban)}
                          className="p-1.5 text-[#8A7A6E] hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {showCreate && (
        <BannerForm
          titulo="Nuevo Banner"
          initial={EMPTY_FORM}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {editando && (
        <BannerForm
          titulo="Editar Banner"
          initial={{
            titulo: editando.titulo ?? "",
            subtexto: editando.subtexto ?? "",
            cta_texto: editando.cta_texto ?? "",
            cta_link: editando.cta_link ?? "",
            imagen_url: editando.imagen_url,
            activo: editando.activo,
          }}
          saving={saving}
          onClose={() => setEditando(null)}
          onSave={handleEdit}
        />
      )}

      {eliminando && (
        <ConfirmDelete onConfirm={handleDelete} onCancel={() => setEliminando(null)} />
      )}
    </div>
  );
}
