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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ProductoRow, ProductoTag, CategoriaRow } from "@/types/database";
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

const TAGS: { value: ProductoTag; label: string }[] = [
  { value: "novedad", label: "Novedad" },
  { value: "mas_vendido", label: "Más vendido" },
  { value: "edicion_limitada", label: "Edición limitada" },
  { value: "oferta", label: "Oferta" },
];

const TAG_COLORS: Record<ProductoTag, string> = {
  novedad: "bg-[#2C2420] text-white",
  mas_vendido: "bg-[#8A7A6E] text-white",
  edicion_limitada: "bg-[#2C2420] text-white",
  oferta: "bg-[#C4956A] text-white",
};

const TAG_LABELS: Record<ProductoTag, string> = {
  novedad: "NUEVO",
  mas_vendido: "MAS VENDIDO",
  edicion_limitada: "ED. LIMITADA",
  oferta: "OFERTA",
};

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
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  titulo: string;
}

function ProductoForm({ initial, categorias, saving, onClose, onSave, titulo }: ProductoFormProps) {
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
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
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
              {TAGS.map(({ value, label }) => {
                const active = form.tags.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleTag(value)}
                    className={`px-3 py-1.5 text-[10px] tracking-widest uppercase font-body font-medium transition-colors border ${active ? "bg-[#2C2420] text-white border-[#2C2420]" : "bg-white text-[#8A7A6E] border-[#E8DDD0] hover:border-[#C4956A]"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
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

// --- Pagina principal ---

interface ProductoConCategoria extends ProductoRow {
  categoria_nombre: string;
}

function ProductosPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando] = useState<ProductoRow | null>(null);
  const [eliminando, setEliminando] = useState<ProductoRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const sorted = [...productos].sort((a, b) => {
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

  return (
    <div className="p-4 sm:p-8 md:p-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Productos</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nuevo producto
        </button>
      </div>

      {!loading && (
        <p className="font-body text-xs text-[#8A7A6E] mb-4">
          {sorted.length} {sorted.length === 1 ? "producto" : "productos"}
        </p>
      )}

      {/* Tabla */}
      <div className="bg-white border border-[#E8DDD0] overflow-x-auto">
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
                  No hay productos aun. Crea el primero con el boton de arriba.
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
                        producto.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 text-[9px] tracking-widest uppercase font-body font-medium rounded-sm ${TAG_COLORS[tag]}`}
                          >
                            {TAG_LABELS[tag]}
                          </span>
                        ))
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

      {/* Modales */}
      {showCreate && (
        <ProductoForm
          titulo="Nuevo producto"
          initial={EMPTY_FORM}
          categorias={categoriasParaForm}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
      {editando && (
        <ProductoForm
          titulo="Editar producto"
          initial={buildFormFromProducto(editando)}
          categorias={categoriasParaForm}
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
