import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ToggleLeft, ToggleRight, Upload, X, Save, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PopupRow } from "@/types/database";

export const Route = createFileRoute("/admin/popup")({
  head: () => ({ meta: [{ title: "Popup | Admin Florería Miraflores" }] }),
  component: PopupPage,
});

// --- Constantes ---

const BUCKET = "popup";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface FormState {
  imagen_url: string;
  texto: string;
  activo: boolean;
  fecha_expiracion: string;
}

const EMPTY_FORM: FormState = {
  imagen_url: "",
  texto: "",
  activo: false,
  fecha_expiracion: "",
};

// --- Helpers de Storage ---

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
    const match = url.match(/\/storage\/v1\/object\/public\/popup\/(.+)/);
    if (!match) return;
    await supabase.storage.from(BUCKET).remove([match[1]]);
  } catch {
    // silencioso
  }
}

// --- Skeleton Formulario ---

function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-[#F5EFE6] rounded" />
      <div className="w-full aspect-[4/3] bg-[#F5EFE6] rounded" />
      <div className="h-4 w-48 bg-[#F5EFE6] rounded" />
      <div className="h-24 bg-[#F5EFE6] rounded" />
      <div className="h-10 w-40 bg-[#F5EFE6] rounded" />
    </div>
  );
}

// --- Componente de Página ---

function PopupPage() {
  const [popupId, setPopupId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Carga inicial ---
  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("popup").select("*").maybeSingle();

        if (error) throw error;

        if (data) {
          const popup = data as PopupRow;
          setPopupId(popup.id);
          setForm({
            imagen_url: popup.imagen_url ?? "",
            texto: popup.texto ?? "",
            activo: popup.activo ?? false,
            fecha_expiracion: popup.fecha_expiracion ?? "",
          });
        }
      } catch (err) {
        console.error("Error al cargar popup:", err);
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  // --- Helpers de formulario ---

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
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
      // Si ya existe imagen, borrarla de Storage primero
      if (form.imagen_url) {
        void eliminarImagenStorage(form.imagen_url);
      }
      const url = await subirImagen(file);
      setField("imagen_url", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemoveImagen() {
    const url = form.imagen_url;
    setField("imagen_url", "");
    if (url) void eliminarImagenStorage(url);
  }

  // --- Guardar (upsert) ---

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        imagen_url: form.imagen_url || null,
        texto: form.texto.trim() || null,
        activo: form.activo,
        fecha_expiracion: form.fecha_expiracion || null,
      };

      if (popupId) {
        // UPDATE
        const { error } = await supabase.from("popup").update(payload).eq("id", popupId);
        if (error) throw error;
      } else {
        // INSERT — primera vez
        const { data, error } = await supabase.from("popup").insert(payload).select("id").single();
        if (error) throw error;
        setPopupId(data.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el popup. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  // --- Render ---

  return (
    <div className="p-8 md:p-10 max-w-2xl">
      {/* Encabezado */}
      <div className="mb-8">
        <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
        <h1 className="font-display text-3xl md:text-4xl text-[#2C2420] mb-2">Popup Promocional</h1>
        <p className="font-body text-sm text-[#8A7A6E]">
          Configura la ventana emergente que aparece al visitar la tienda. Puedes usarla para
          cupones, campañas o avisos especiales.
        </p>
      </div>

      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="space-y-7">
          {/* Toggle Activo */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E8DDD0]">
            <div>
              <p className="font-body text-sm font-medium text-[#2C2420]">
                Mostrar popup en la tienda
              </p>
              <p className="font-body text-xs text-[#8A7A6E] mt-0.5">
                {form.activo
                  ? "El popup está activo y visible para los visitantes."
                  : "El popup está desactivado y no se mostrará."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setField("activo", !form.activo)}
              className="ml-4 flex-shrink-0 transition-colors"
            >
              {form.activo ? (
                <ToggleRight className="h-8 w-8 text-[#C4956A]" strokeWidth={1.5} />
              ) : (
                <ToggleLeft className="h-8 w-8 text-[#8A7A6E]" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Imagen del Popup */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
              Imagen Promocional
            </label>

            {form.imagen_url ? (
              <div className="relative group w-full max-w-sm">
                <img
                  src={form.imagen_url}
                  alt="Vista previa del popup"
                  className="w-full h-auto block border border-[#E8DDD0]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImagen}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 font-body text-xs tracking-widest uppercase flex items-center gap-2"
                  >
                    <X className="h-3.5 w-3.5" />
                    Eliminar imagen
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-sm aspect-square border-2 border-dashed border-[#E8DDD0] hover:border-[#C4956A] bg-[#FDFAF6] cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-[#C4956A] animate-spin" strokeWidth={1.5} />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#8A7A6E] mb-2" strokeWidth={1.5} />
                    <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                      Subir imagen
                    </span>
                    <span className="font-body text-[10px] text-[#C4956A] mt-1">
                      Recomendado: 600×600 px o 800×600 px
                    </span>
                    <span className="font-body text-[9px] text-[#8A7A6E] mt-0.5">
                      JPG, PNG, WebP · máx. 5 MB
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

            {uploadError && (
              <p className="mt-2 font-body text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                {uploadError}
              </p>
            )}

            <p className="mt-2 font-body text-[10px] text-[#8A7A6E]">
              Opcional — puedes tener solo texto sin imagen o solo imagen sin texto.
            </p>
          </div>

          {/* Texto Promocional */}
          <div>
            <label
              htmlFor="popup-texto"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2"
            >
              Texto del Popup
            </label>
            <textarea
              id="popup-texto"
              rows={4}
              value={form.texto}
              onChange={(e) => setField("texto", e.target.value)}
              placeholder="Ej: ¡Usa el código FLORES10 y obtén 10% de descuento en tu primer pedido!"
              className="w-full p-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors resize-none"
            />
            <p className="mt-1 font-body text-[10px] text-[#8A7A6E]">
              Puedes incluir mensajes de cupones, anuncios de temporada o información importante.
            </p>
          </div>

          {/* Fecha de Expiración */}
          <div>
            <label
              htmlFor="popup-expiracion"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2"
            >
              Fecha de Expiración (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="popup-expiracion"
                type="date"
                value={form.fecha_expiracion}
                onChange={(e) => setField("fecha_expiracion", e.target.value)}
                className="h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
              {form.fecha_expiracion && (
                <button
                  type="button"
                  onClick={() => setField("fecha_expiracion", "")}
                  className="text-[#8A7A6E] hover:text-red-500 transition-colors"
                  title="Limpiar fecha"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1 font-body text-[10px] text-[#8A7A6E]">
              Si defines una fecha, el popup se desactivará automáticamente en la tienda al llegar a
              ese día.
            </p>
          </div>

          {/* Botón Guardar */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex items-center gap-2 h-11 px-8 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-50 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.5} />
              )}
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>

            {saved && (
              <span className="font-body text-sm text-emerald-600 animate-fade-in flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                ¡Guardado exitosamente!
              </span>
            )}
          </div>

          {/* Previsualización del popup en la tienda */}
          {(form.imagen_url || form.texto) && (
            <div className="mt-8 pt-6 border-t border-[#E8DDD0]">
              <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
                Vista previa del popup
              </p>
              <div className="bg-black/30 rounded p-4 flex items-center justify-center">
                <div className="bg-white shadow-2xl max-w-xs w-full overflow-hidden">
                  {form.imagen_url ? (
                    <img
                      src={form.imagen_url}
                      alt="Popup preview"
                      className="w-full h-auto block"
                    />
                  ) : (
                    <div className="w-full h-32 bg-[#F5EFE6] flex items-center justify-center">
                      <ImageOff className="h-8 w-8 text-[#E8DDD0]" />
                    </div>
                  )}
                  {form.texto && (
                    <div className="px-5 py-4">
                      <p className="font-body text-sm text-[#2C2420] text-center leading-relaxed">
                        {form.texto}
                      </p>
                    </div>
                  )}
                  <div className="px-5 pb-4 text-center">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center px-6 h-9 bg-[#2C2420] text-white font-body text-[10px] tracking-widest uppercase opacity-80"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-2 font-body text-[10px] text-[#8A7A6E] text-center">
                Vista referencial — el diseño real puede variar levemente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
