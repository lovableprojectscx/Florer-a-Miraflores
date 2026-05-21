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
  Check,
  AlertCircle,
  FileImage,
  Search,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ProductoRow, ProductoTag, CategoriaRow, TagRow } from "@/types/database";
import { convertToWebP } from "@/lib/image-optimizer";

export const Route = createFileRoute("/admin/productos")({
  head: () => ({ meta: [{ title: "Productos | Admin Florería Miraflores" }] }),
  component: ProductosPage,
});

// --- Constantes ---

const MAX_IMAGENES = 2;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const BUCKET = "productos";

// --- Tipos internos ---

type SortField = "nombre" | "precio";
type SortDir = "asc" | "desc";

interface FormState {
  nombre: string;
  precio: string;
  descripcion: string;
  categoria_id: string;
  tags: ProductoTag[];
  activo: boolean;
  imagenes: string[];
}

const EMPTY_FORM: FormState = {
  nombre: "",
  precio: "",
  descripcion: "",
  categoria_id: "",
  tags: [],
  activo: true,
  imagenes: [],
};

// --- Helpers ---

function buildFormFromProducto(p: ProductoRow): FormState {
  return {
    nombre: p.nombre,
    precio: String(p.precio),
    descripcion: p.descripcion ?? "",
    categoria_id: p.categoria_id ?? "",
    tags: p.tags ?? [],
    activo: p.activo,
    imagenes: p.imagenes.slice(0, MAX_IMAGENES),
  };
}

async function subirImagen(file: File): Promise<string> {
  let finalFile = file;
  try {
    finalFile = await convertToWebP(file);
  } catch (err) {
    console.error("Error al optimizar imagen a WebP:", err);
  }

  const ext = finalFile.name.split(".").pop() ?? "webp";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, finalFile, { cacheControl: "31536000", contentType: finalFile.type, upsert: false });
  if (uploadError) throw new Error(`Upload: ${uploadError.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function eliminarImagenStorage(url: string) {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/productos\/(.+)/);
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
      {[1, 2, 3, 4, 5].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-3">
            <div className="w-12 h-12 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-40 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-32 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 bg-[#F5EFE6] rounded-full" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-10 bg-[#F5EFE6] rounded-full" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-[#F5EFE6] rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

// --- Formulario ---

interface ProductoFormProps {
  initial: FormState;
  categorias: CategoriaRow[];
  tags: TagRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  titulo: string;
}

function ProductoForm({ initial, categorias, tags, saving, onClose, onSave, titulo }: ProductoFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef0 = useRef<HTMLInputElement>(null);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef0, fileRef1];

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleTag(tag: ProductoTag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? [] : [tag],
    }));
  }

  async function handleFileChange(idx: number, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Solo se aceptan imagenes JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("El archivo supera el limite de 5 MB.");
      return;
    }
    setUploading(idx);
    try {
      const url = await subirImagen(file);
      setForm((prev) => {
        const imgs = [...prev.imagenes];
        imgs[idx] = url;
        return { ...prev, imagenes: imgs.filter(Boolean) };
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploading(null);
      const ref = fileRefs[idx];
      if (ref?.current) ref.current.value = "";
    }
  }

  async function handleRemoveImagen(idx: number) {
    const url = form.imagenes[idx];
    setForm((prev) => {
      const imgs = prev.imagenes.filter((_, i) => i !== idx);
      return { ...prev, imagenes: imgs };
    });
    if (url) void eliminarImagenStorage(url);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    const precioNum = parseFloat(form.precio);
    if (!form.precio || isNaN(precioNum) || precioNum <= 0)
      errs.precio = "Ingresa un precio valido mayor a 0.";
    if (!form.categoria_id) errs.categoria_id = "Selecciona una categoria.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault();
    if (!validate()) return;
    void onSave(form);
  }

  const slots = Array.from({ length: MAX_IMAGENES }, (_, i) => form.imagenes[i] ?? "");
  const imagenesFull = form.imagenes.filter(Boolean).length >= MAX_IMAGENES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Velvet Box Romantico"
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            {errors.nombre && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Precio */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Precio (S/) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.precio}
              onChange={(e) => setField("precio", e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            {errors.precio && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.precio}</p>
            )}
          </div>

          {/* Descripcion */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Descripcion
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Describe el producto..."
              className="w-full px-3 py-2 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors resize-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Categoria *
            </label>
            <select
              value={form.categoria_id}
              onChange={(e) => setField("categoria_id", e.target.value)}
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            >
              <option value="">Seleccionar categoria...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {errors.categoria_id && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.categoria_id}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = form.tags.includes(tag.clave);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.clave)}
                    className={`px-3 py-1.5 text-[10px] tracking-widest uppercase font-body font-medium transition-colors border ${active ? "bg-[#2C2420] text-white border-[#2C2420]" : "bg-white text-[#8A7A6E] border-[#E8DDD0] hover:border-[#C4956A]"}`}
                  >
                    {tag.nombre}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 font-body text-[10px] text-[#8A7A6E]">
              Selecciona como máximo 1 tag para evitar que el producto se repita en varias secciones de la página de inicio.
            </p>
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between">
            <label className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
              Activo
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

          {/* Imagenes */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
              Imagenes (maximo {MAX_IMAGENES})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {slots.map((url, idx) => (
                <div key={idx}>
                  {url ? (
                    <div className="relative group aspect-square bg-[#F5EFE6] overflow-hidden">
                      <img
                        src={url}
                        alt={`Imagen ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImagen(idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-1.5 rounded"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white font-body text-[9px] tracking-widest uppercase px-1.5 py-0.5">
                          Principal
                        </span>
                      )}
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed transition-colors ${imagenesFull ? "border-[#F0E8DE] bg-[#FDFAF6] opacity-40 cursor-not-allowed" : "border-[#E8DDD0] hover:border-[#C4956A] bg-[#FDFAF6] cursor-pointer"}`}
                    >
                      {uploading === idx ? (
                        <Loader2
                          className="h-6 w-6 text-[#C4956A] animate-spin"
                          strokeWidth={1.5}
                        />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-[#8A7A6E] mb-1.5" strokeWidth={1.5} />
                          <span className="font-body text-[10px] tracking-widest uppercase text-[#8A7A6E] text-center leading-tight px-2">
                            {idx === 0 ? "Imagen principal" : "Imagen 2"}
                          </span>
                          <span className="font-body text-[9px] text-[#C4956A]/70 mt-1">
                            JPG, PNG, WebP, 5MB
                          </span>
                        </>
                      )}
                      <input
                        ref={fileRefs[idx]}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        disabled={imagenesFull || uploading !== null}
                        onChange={(e) => handleFileChange(idx, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            {uploadError && (
              <p className="mt-2 font-body text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                {uploadError}
              </p>
            )}
            <p className="mt-1.5 font-body text-[10px] text-[#8A7A6E]">
              La primera imagen es la principal. Haz hover sobre una imagen para eliminarla.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading !== null}
            className="h-10 px-5 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading !== null}
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

// --- Confirmacion de eliminacion ---

function ConfirmDelete({
  nombre,
  onConfirm,
  onCancel,
}: {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm p-6 shadow-xl">
        <h3 className="font-display text-xl text-[#2C2420] mb-2">Eliminar producto?</h3>
        <p className="font-body text-sm text-[#8A7A6E] mb-6">
          Vas a eliminar <strong className="text-[#2C2420]">"{nombre}"</strong>. Esta accion no se
          puede deshacer.
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

// --- Cabecera de columna ordenable ---

function SortHeader({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={() => onClick(field)}
      className="flex items-center gap-1 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors group"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp
          className={`h-2.5 w-2.5 -mb-0.5 ${active && dir === "asc" ? "text-[#C4956A]" : "text-[#E8DDD0] group-hover:text-[#8A7A6E]"}`}
        />
        <ChevronDown
          className={`h-2.5 w-2.5 ${active && dir === "desc" ? "text-[#C4956A]" : "text-[#E8DDD0] group-hover:text-[#8A7A6E]"}`}
        />
      </span>
    </button>
  );
}

// --- Importador en Lote ---

interface BulkImportModalProps {
  onClose: () => void;
  onImportSuccess: () => Promise<void>;
}

interface BulkFileItem {
  id: string;
  file: File;
  status: "idle" | "optimizing" | "uploading" | "saving" | "completed" | "error";
  errorMsg?: string;
}

function BulkImportModal({ onClose, onImportSuccess }: BulkImportModalProps) {
  const [files, setFiles] = useState<BulkFileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    const newItems: BulkFileItem[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      if (!ACCEPTED_TYPES.includes(f.type)) continue;

      let status: BulkFileItem["status"] = "idle";
      let errorMsg: string | undefined = undefined;
      if (f.size > MAX_SIZE_BYTES) {
        status = "error";
        errorMsg = "El archivo supera el límite de 5 MB.";
      }

      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        file: f,
        status,
        errorMsg,
      });
    }
    setFiles((prev) => [...prev, ...newItems]);
  }

  async function startImport() {
    if (processing) return;
    setProcessing(true);

    const itemsToProcess = files.filter((f) => f.status === "idle");

    for (const item of itemsToProcess) {
      // 1. Optimizing
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "optimizing" } : f))
      );

      let optimizedFile: File;
      try {
        optimizedFile = await convertToWebP(item.file);
      } catch (err) {
        console.error("Error al optimizar imagen:", err);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", errorMsg: "Error al optimizar imagen." }
              : f
          )
        );
        continue;
      }

      // 2. Uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
      );

      let publicUrl = "";
      try {
        publicUrl = await subirImagen(optimizedFile);
      } catch (err) {
        console.error("Error al subir imagen:", err);
        const msg = err instanceof Error ? err.message : "Error al subir la imagen.";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", errorMsg: msg } : f
          )
        );
        continue;
      }

      // 3. Saving
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "saving" } : f))
      );

      try {
        const cleanName =
          item.file.name.substring(0, item.file.name.lastIndexOf(".")) ||
          item.file.name;

        const { error } = await supabase.from("productos").insert({
          nombre: `Borrador - ${cleanName}`,
          precio: 1.00,
          descripcion: null,
          categoria_id: null,
          tags: [],
          activo: false,
          imagenes: [publicUrl],
          orden: 0,
        });

        if (error) throw error;

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "completed" } : f))
        );
      } catch (err) {
        console.error("Error al guardar borrador:", err);
        const msg = err instanceof Error ? err.message : "Error de base de datos.";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", errorMsg: msg } : f
          )
        );
      }
    }

    setProcessing(false);
    await onImportSuccess();
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (processing) return;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (processing) return;
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    if (processing) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearQueue = () => {
    if (processing) return;
    setFiles([]);
  };

  const totalFiles = files.length;
  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const pendingCount = files.filter((f) => f.status === "idle").length;
  const processedCount = completedCount + errorCount;
  const progressPercent =
    totalFiles > 0 ? Math.round((processedCount / totalFiles) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!processing) onClose();
        }}
      />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD0] flex-shrink-0">
          <div>
            <h2 className="font-display text-2xl text-[#2C2420]">Importar imágenes en lote</h2>
            <p className="font-body text-xs text-[#8A7A6E] mt-1">
              Las imágenes se optimizarán a WebP y se crearán como borradores inactivos.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors disabled:opacity-30"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] flex flex-col">
          {totalFiles === 0 ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-all ${
                dragOver
                  ? "border-[#C4956A] bg-[#F5EFE6]"
                  : "border-[#E8DDD0] hover:border-[#C4956A] bg-[#FDFAF6]"
              }`}
            >
              <Upload
                className={`h-12 w-12 mb-4 transition-transform ${
                  dragOver ? "text-[#C4956A] scale-110" : "text-[#8A7A6E]"
                }`}
                strokeWidth={1}
              />
              <p className="font-display text-lg text-[#2C2420] text-center mb-1">
                Arrastra tus imágenes aquí
              </p>
              <p className="font-body text-sm text-[#8A7A6E] text-center mb-4">
                o haz clic para seleccionar desde tu computadora
              </p>
              <span className="font-body text-[10px] tracking-widest uppercase px-3 py-1 bg-[#F5EFE6] text-[#2C2420] rounded-full">
                JPG, PNG, WebP (Máx. 5MB cada una)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            /* Files Queue */
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Progress Summary */}
              {processing && (
                <div className="bg-[#FDFAF6] border border-[#E8DDD0] p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-body tracking-wider uppercase text-[#8A7A6E]">
                    <span>Procesando cola...</span>
                    <span>
                      {processedCount} de {totalFiles} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5EFE6] overflow-hidden rounded-full">
                    <div
                      className="h-full bg-[#C4956A] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Files list */}
              <div className="flex-1 overflow-y-auto max-h-[40vh] border border-[#E8DDD0] divide-y divide-[#E8DDD0] bg-[#FDFAF6]">
                {files.map((item) => {
                  const sizeMB = (item.file.size / (1024 * 1024)).toFixed(2);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white hover:bg-[#FDFAF6] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-[#F5EFE6] overflow-hidden flex-shrink-0 flex items-center justify-center rounded">
                          {item.file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(item.file)}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                              onLoad={(e) => {
                                URL.revokeObjectURL((e.target as HTMLImageElement).src);
                              }}
                            />
                          ) : (
                            <FileImage className="h-5 w-5 text-[#8A7A6E]" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-body text-sm text-[#2C2420] font-medium truncate"
                            title={item.file.name}
                          >
                            {item.file.name}
                          </p>
                          <p className="font-body text-[11px] text-[#8A7A6E]">{sizeMB} MB</p>
                        </div>
                      </div>

                      {/* Status / Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        {item.status === "idle" && (
                          <span className="font-body text-[10px] tracking-wider uppercase text-[#8A7A6E] px-2 py-0.5 bg-[#F5EFE6]">
                            Listo
                          </span>
                        )}
                        {item.status === "optimizing" && (
                          <span className="flex items-center gap-1.5 font-body text-[10px] tracking-wider uppercase text-[#C4956A] font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Optimizando
                          </span>
                        )}
                        {item.status === "uploading" && (
                          <span className="flex items-center gap-1.5 font-body text-[10px] tracking-wider uppercase text-[#C4956A] font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Subiendo
                          </span>
                        )}
                        {item.status === "saving" && (
                          <span className="flex items-center gap-1.5 font-body text-[10px] tracking-wider uppercase text-[#C4956A] font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Guardando
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="flex items-center gap-1 font-body text-[10px] tracking-wider uppercase text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-sm">
                            <Check className="h-3 w-3" />
                            Listo
                          </span>
                        )}
                        {item.status === "error" && (
                          <span
                            className="flex items-center gap-1 font-body text-[10px] tracking-wider uppercase text-red-600 font-medium bg-red-50 px-2 py-0.5 border border-red-100 rounded-sm"
                            title={item.errorMsg}
                          >
                            <AlertCircle className="h-3 w-3" />
                            Error
                          </span>
                        )}

                        {/* Delete button (only when idle or error and not processing) */}
                        {!processing &&
                          (item.status === "idle" || item.status === "error") && (
                            <button
                              type="button"
                              onClick={() => removeFile(item.id)}
                              className="p-1 text-[#8A7A6E] hover:text-red-500 transition-colors"
                              title="Eliminar de la cola"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status footer inside body */}
              <div className="flex justify-between items-center text-xs font-body text-[#8A7A6E] bg-[#FDFAF6] p-3 border border-[#E8DDD0]">
                <div className="space-x-4">
                  <span>
                    Total: <strong>{totalFiles}</strong>
                  </span>
                  {completedCount > 0 && (
                    <span className="text-emerald-700">
                      Completados: <strong>{completedCount}</strong>
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">
                      Errores: <strong>{errorCount}</strong>
                    </span>
                  )}
                </div>
                {!processing && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors underline uppercase tracking-wider text-[10px] font-medium"
                  >
                    Vaciar cola
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0] flex-shrink-0">
          {!processing ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
              >
                {completedCount > 0 ? "Cerrar" : "Cancelar"}
              </button>
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={startImport}
                  className="h-10 px-6 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white text-[11px] tracking-widest uppercase font-body font-medium transition-colors flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                  Comenzar importación ({pendingCount})
                </button>
              )}
            </>
          ) : (
            <div className="w-full text-center py-2">
              <p className="font-body text-xs tracking-wider uppercase text-[#C4956A] animate-pulse flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando imágenes... Por favor, no cierres esta ventana.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Pagina principal ---

interface ProductoConCategoria extends ProductoRow {
  categoria_nombre: string;
}

function ProductosPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando] = useState<ProductoRow | null>(null);
  const [eliminando, setEliminando] = useState<ProductoRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterTag, setFilterTag] = useState("todos");

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cats, error: catsError } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre", { ascending: true });
      if (catsError) throw catsError;
      const todasCats = (cats ?? []) as CategoriaRow[];
      setCategorias(todasCats);

      const { data: dbTags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("orden", { ascending: true });
      if (tagsError) throw tagsError;
      setTags((dbTags ?? []) as TagRow[]);

      const { data: prods, error: prodsError } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });
      if (prodsError) throw prodsError;

      const catMap = new Map(todasCats.map((c) => [c.id, c.nombre]));
      const mapped: ProductoConCategoria[] = (prods ?? []).map((p: ProductoRow) => ({
        ...p,
        categoria_nombre: p.categoria_id
          ? (catMap.get(p.categoria_id) ?? "Sin categoria")
          : "Sin categoria",
      }));
      setProductos(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = productos.filter((producto) => {
    // 1. Buscador por nombre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      // Eliminar acentos para búsqueda flexible
      const nameClean = producto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const qClean = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!nameClean.includes(qClean)) return false;
    }

    // 2. Filtro de Categoría
    if (filterCategoria !== "todos") {
      if (filterCategoria === "sin_categoria") {
        if (producto.categoria_id) return false;
      } else {
        if (producto.categoria_id !== filterCategoria) return false;
      }
    }

    // 3. Filtro de Estado
    if (filterEstado !== "todos") {
      if (filterEstado === "activos" && !producto.activo) return false;
      if (filterEstado === "inactivos" && producto.activo) return false;
    }

    // 4. Filtro de Tags
    if (filterTag !== "todos") {
      if (filterTag === "sin_tags") {
        if (producto.tags && producto.tags.length > 0) return false;
      } else {
        if (!producto.tags || !producto.tags.includes(filterTag as ProductoTag)) return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "nombre") cmp = a.nombre.localeCompare(b.nombre, "es");
    if (sortField === "precio") cmp = a.precio - b.precio;
    return sortDir === "asc" ? cmp : -cmp;
  });

  async function handleCreate(form: FormState) {
    setSaving(true);
    try {
      const { error } = await supabase.from("productos").insert({
        nombre: form.nombre.trim(),
        precio: parseFloat(form.precio),
        descripcion: form.descripcion.trim() || null,
        categoria_id: form.categoria_id || null,
        tags: form.tags,
        activo: form.activo,
        imagenes: form.imagenes.filter(Boolean),
        orden: 0,
      });
      if (error) throw error;
      setShowCreate(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: FormState) {
    if (!editando) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: form.nombre.trim(),
          precio: parseFloat(form.precio),
          descripcion: form.descripcion.trim() || null,
          categoria_id: form.categoria_id || null,
          tags: form.tags,
          activo: form.activo,
          imagenes: form.imagenes.filter(Boolean),
        })
        .eq("id", editando.id);
      if (error) throw error;
      setEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eliminando) return;
    try {
      const { error } = await supabase.from("productos").delete().eq("id", eliminando.id);
      if (error) throw error;
      setEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleActivo(producto: ProductoConCategoria) {
    setTogglingId(producto.id);
    try {
      const { error } = await supabase
        .from("productos")
        .update({ activo: !producto.activo })
        .eq("id", producto.id);
      if (error) throw error;
      setProductos((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, activo: !p.activo } : p)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  const categoriasParaForm = categorias.filter((c) => c.activo);
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterCategoria !== "todos" ||
    filterEstado !== "todos" ||
    filterTag !== "todos";

  return (
    <div className="p-4 sm:p-8 md:p-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Productos</h1>
        </div>
        <div className="flex flex-wrap gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 h-10 px-5 border border-[#2C2420] hover:bg-[#2C2420]/5 text-[#2C2420] font-body text-[11px] tracking-widest uppercase transition-colors"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            Importar imágenes
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      {!loading && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white border border-[#E8DDD0] p-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A6E]" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-10 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Categoría */}
            <div className="flex items-center bg-[#FDFAF6] border border-[#E8DDD0] h-10 px-2.5">
              <span className="font-body text-[10px] text-[#8A7A6E] mr-2 uppercase tracking-wider hidden sm:inline">
                Cat:
              </span>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="bg-transparent font-body text-xs text-[#2C2420] outline-none cursor-pointer pr-4"
              >
                <option value="todos">Categorías (Todas)</option>
                <option value="sin_categoria">Sin Categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="flex items-center bg-[#FDFAF6] border border-[#E8DDD0] h-10 px-2.5">
              <span className="font-body text-[10px] text-[#8A7A6E] mr-2 uppercase tracking-wider hidden sm:inline">
                Estado:
              </span>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="bg-transparent font-body text-xs text-[#2C2420] outline-none cursor-pointer pr-4"
              >
                <option value="todos">Estado (Todos)</option>
                <option value="activos">Publicados</option>
                <option value="inactivos">Borradores</option>
              </select>
            </div>

            {/* Tag */}
            <div className="flex items-center bg-[#FDFAF6] border border-[#E8DDD0] h-10 px-2.5">
              <span className="font-body text-[10px] text-[#8A7A6E] mr-2 uppercase tracking-wider hidden sm:inline">
                Tag:
              </span>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-transparent font-body text-xs text-[#2C2420] outline-none cursor-pointer pr-4"
              >
                <option value="todos">Tags (Todos)</option>
                <option value="sin_tags">Sin Tags</option>
                {tags.map((t) => (
                  <option key={t.clave} value={t.clave}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategoria("todos");
                  setFilterEstado("todos");
                  setFilterTag("todos");
                }}
                className="h-10 px-3 bg-[#F5EFE6] text-[#2C2420] hover:bg-[#E8DDD0] font-body text-xs tracking-wider uppercase transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && (
        <p className="font-body text-xs text-[#8A7A6E] mb-4">
          {hasActiveFilters ? (
            <span>
              Encontrados <strong>{sorted.length}</strong> de <strong>{productos.length}</strong>{" "}
              productos
            </span>
          ) : (
            <span>
              {productos.length} {productos.length === 1 ? "producto" : "productos"} en total
            </span>
          )}
        </p>
      )}

      {/* Tabla (Escritorio) */}
      <div className="hidden md:block bg-white border border-[#E8DDD0] overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6]">
              <th className="px-4 py-3 text-left w-16" />
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Nombre"
                  field="nombre"
                  current={sortField}
                  dir={sortDir}
                  onClick={handleSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Precio"
                  field="precio"
                  current={sortField}
                  dir={sortDir}
                  onClick={handleSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                  Categoria
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                  Tags
                </span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                  Activo
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                  Acciones
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]">
                  {productos.length === 0
                    ? "No hay productos aun. Crea el primero con el boton de arriba."
                    : "No se encontraron productos que coincidan con los filtros aplicados."}
                </td>
              </tr>
            ) : (
              sorted.map((producto) => (
                <tr
                  key={producto.id}
                  className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6] transition-colors"
                >
                  {/* Imagen */}
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-[#F5EFE6] overflow-hidden flex-shrink-0">
                      {producto.imagenes[0] ? (
                        <img
                          src={producto.imagenes[0]}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-[#E8DDD0]" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Nombre */}
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-[#2C2420] font-medium">
                      {producto.nombre}
                    </p>
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-[#2C2420]">
                      S/ {Number(producto.precio).toFixed(2)}
                    </p>
                  </td>

                  {/* Categoria */}
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-[#8A7A6E]">{producto.categoria_nombre}</p>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {producto.tags.length === 0 ? (
                        <span className="font-body text-xs text-[#C4956A]/30">sin tags</span>
                      ) : (
                        producto.tags.map((tag) => {
                          const tagObj = tags.find((t) => t.clave === tag);
                          const label = tagObj ? tagObj.nombre : tag;
                          const color = tagObj ? tagObj.color_badge : "#2C2420";
                          return (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase font-body font-medium rounded-sm text-white"
                              style={{ backgroundColor: color }}
                            >
                              {label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>

                  {/* Toggle activo */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActivo(producto)}
                      disabled={togglingId === producto.id}
                      className="transition-colors disabled:opacity-50"
                      title={producto.activo ? "Desactivar" : "Activar"}
                    >
                      {togglingId === producto.id ? (
                        <Loader2
                          className="h-6 w-6 text-[#C4956A] animate-spin mx-auto"
                          strokeWidth={1.5}
                        />
                      ) : producto.activo ? (
                        <ToggleRight className="h-6 w-6 text-[#C4956A]" strokeWidth={1.5} />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-[#8A7A6E]" strokeWidth={1.5} />
                      )}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditando(producto)}
                        className="p-1.5 text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setEliminando(producto)}
                        className="p-1.5 text-[#8A7A6E] hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-[#E8DDD0] p-4 rounded-lg animate-pulse flex gap-3">
              <div className="w-20 h-20 bg-[#F5EFE6] rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-[#F5EFE6] rounded w-3/4" />
                <div className="h-3 bg-[#F5EFE6] rounded w-1/4" />
                <div className="h-3 bg-[#F5EFE6] rounded w-1/2" />
              </div>
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="bg-white border border-[#E8DDD0] p-8 text-center font-body text-sm text-[#8A7A6E] rounded-lg">
            {productos.length === 0
              ? "No hay productos aun. Crea el primero con el boton de arriba."
              : "No se encontraron productos que coincidan con los filtros aplicados."}
          </div>
        ) : (
          sorted.map((producto) => (
            <div key={producto.id} className="bg-white border border-[#E8DDD0] p-4 rounded-lg flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Imagen */}
                <div className="w-20 h-20 bg-[#F5EFE6] overflow-hidden flex-shrink-0 rounded-md">
                  {producto.imagenes[0] ? (
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-5 w-5 text-[#E8DDD0]" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                {/* Detalles */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-body text-sm text-[#2C2420] font-semibold truncate">
                      {producto.nombre}
                    </h3>
                    <p className="font-body text-xs text-[#8A7A6E] mt-0.5">{producto.categoria_nombre}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="font-body text-sm text-[#2C2420] font-bold">
                      S/ {Number(producto.precio).toFixed(2)}
                    </p>
                    {producto.tags.map((tag) => {
                      const tagObj = tags.find((t) => t.clave === tag);
                      const label = tagObj ? tagObj.nombre : tag;
                      const color = tagObj ? tagObj.color_badge : "#2C2420";
                      return (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase font-body font-medium rounded-sm text-white"
                          style={{ backgroundColor: color }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Controles de estado y acciones */}
              <div className="flex items-center justify-between border-t border-[#F5EFE6] pt-3 mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-[#8A7A6E]">Activo:</span>
                  <button
                    onClick={() => handleToggleActivo(producto)}
                    disabled={togglingId === producto.id}
                    className="transition-colors disabled:opacity-50"
                  >
                    {togglingId === producto.id ? (
                      <Loader2 className="h-5 w-5 text-[#C4956A] animate-spin" strokeWidth={1.5} />
                    ) : producto.activo ? (
                      <ToggleRight className="h-6 w-6 text-[#C4956A]" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[#8A7A6E]" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditando(producto)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#E8DDD0] hover:border-[#C4956A] font-body text-xs text-[#8A7A6E] hover:text-[#C4956A] transition-colors rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Editar
                  </button>
                  <button
                    onClick={() => setEliminando(producto)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-100 hover:border-red-500 font-body text-xs text-red-400 hover:text-red-500 transition-colors rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modales */}
      {showCreate && (
        <ProductoForm
          titulo="Nuevo producto"
          initial={EMPTY_FORM}
          categorias={categoriasParaForm}
          tags={tags}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImportSuccess={cargarDatos}
        />
      )}
      {editando && (
        <ProductoForm
          titulo="Editar producto"
          initial={buildFormFromProducto(editando)}
          categorias={categoriasParaForm}
          tags={tags}
          saving={saving}
          onClose={() => setEditando(null)}
          onSave={handleEdit}
        />
      )}
      {eliminando && (
        <ConfirmDelete
          nombre={eliminando.nombre}
          onConfirm={handleDelete}
          onCancel={() => setEliminando(null)}
        />
      )}
    </div>
  );
}
