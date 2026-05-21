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
import type { CategoriaRow } from "@/types/database";
import { convertToWebP } from "@/lib/image-optimizer";

export const Route = createFileRoute("/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorías | Admin Florería Miraflores" }] }),
  component: CategoriasPage,
});

// --- Constantes ---

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const BUCKET = "categorias";

interface FormState {
  nombre: string;
  slug: string;
  imagen_url: string;
  parent_id: string;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  slug: "",
  imagen_url: "",
  parent_id: "",
  activo: true,
};

// --- Helpers ---

function generateSlug(val: string): string {
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover tildes
    .replace(/[^a-z0-9\s-]/g, "") // remover caracteres raros
    .trim()
    .replace(/\s+/g, "-") // espacios a guiones
    .replace(/-+/g, "-"); // colapsar guiones duplicados
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
    const match = url.match(/\/storage\/v1\/object\/public\/categorias\/(.+)/);
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
      {[1, 2, 3, 4].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-3">
            <div className="w-12 h-12 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-44 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-32 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 bg-[#F5EFE6] rounded" />
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

// --- Formulario Modal ---

interface CategoriaFormProps {
  initial: FormState;
  parents: CategoriaRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  titulo: string;
}

function CategoriaForm({ initial, parents, saving, onClose, onSave, titulo }: CategoriaFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nombre" && !initial.slug) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
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
          : "Error al subir la imagen. Verifica que exista el bucket 'categorias'.",
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
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    if (!form.slug.trim()) errs.slug = "El slug es requerido.";
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Nombre */}
          <div>
            <label
              htmlFor="nombre"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Nombre *
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Cumpleaños"
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            {errors.nombre && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Slug (URL) *
            </label>
            <input
              id="slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => setField("slug", generateSlug(e.target.value))}
              placeholder="ej-cumpleanos"
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            {errors.slug && <p className="mt-1 font-body text-xs text-red-500">{errors.slug}</p>}
          </div>

          {/* Relación Padre (Jerarquía) */}
          <div>
            <label
              htmlFor="parent_id"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Dependencia (Jerarquía)
            </label>
            <select
              id="parent_id"
              value={form.parent_id}
              onChange={(e) => setField("parent_id", e.target.value)}
              className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            >
              <option value="">Categoría Principal (Padre)</option>
              {parents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} (Principal)
                </option>
              ))}
            </select>
            <p className="mt-1.5 font-body text-[10px] text-[#8A7A6E] leading-relaxed">
              Si eliges una categoría principal, esta categoría se comportará como una subcategoría.
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

          {/* Imagen */}
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
              Imagen de portada
            </label>
            {form.imagen_url ? (
              <div className="relative group w-full aspect-video bg-[#F5EFE6] overflow-hidden border border-[#E8DDD0]">
                <img src={form.imagen_url} alt="Portada" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
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
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-[#E8DDD0] hover:border-[#C4956A] bg-[#FDFAF6] cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-[#C4956A] animate-spin" strokeWidth={1.5} />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#8A7A6E] mb-1.5" strokeWidth={1.5} />
                    <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                      Subir foto
                    </span>
                    <span className="font-body text-[9px] text-[#C4956A] mt-1">
                      JPG, PNG, WebP (máx. 5MB)
                    </span>
                    <span className="font-body text-[9px] text-[#8A7A6E] mt-0.5 text-center px-4">
                      Medida recomendada: 800x1000 px (proporción 4:5)
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
        <h3 className="font-display text-xl text-[#2C2420] mb-2">¿Eliminar categoría?</h3>
        <p className="font-body text-sm text-[#8A7A6E] mb-6">
          Vas a eliminar <strong className="text-[#2C2420]">"{nombre}"</strong>. Esto puede
          desasociar productos que pertenezcan a esta categoría. Esta acción no se puede deshacer.
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

// --- Página principal ---

function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando] = useState<CategoriaRow | null>(null);
  const [eliminando, setEliminando] = useState<CategoriaRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) throw error;
      setCategorias((data ?? []) as CategoriaRow[]);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Lista de categorías que son padres (principales)
  const parentCategories = categorias.filter((c) => !c.parent_id);

  // Mapear categorías jerárquicamente
  const buildTree = (): CategoriaRow[] => {
    const tree: CategoriaRow[] = [];
    const parents = categorias.filter((c) => !c.parent_id);
    const children = categorias.filter((c) => c.parent_id);

    parents.forEach((parent) => {
      tree.push(parent);
      const subcats = children.filter((child) => child.parent_id === parent.id);
      tree.push(...subcats);
    });

    // Agregar huérfanas en caso de que alguna subcategoría tenga un parent_id inválido
    const huerfanas = children.filter((child) => !parents.some((p) => p.id === child.parent_id));
    tree.push(...huerfanas);

    return tree;
  };

  const treeData = buildTree();

  async function handleCreate(form: FormState) {
    setSaving(true);
    try {
      // Obtener el máximo orden de las categorías en el mismo nivel
      const sameLevel = categorias.filter((c) => c.parent_id === (form.parent_id || null));
      const maxOrden = sameLevel.reduce((max, c) => Math.max(max, c.orden), 0);

      const { error } = await supabase.from("categorias").insert({
        nombre: form.nombre.trim(),
        slug: form.slug.trim(),
        imagen_url: form.imagen_url || null,
        parent_id: form.parent_id || null,
        activo: form.activo,
        orden: maxOrden + 1,
      });

      if (error) throw error;
      setShowCreate(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la categoría. Revisa si el slug ya existe.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: FormState) {
    if (!editando) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("categorias")
        .update({
          nombre: form.nombre.trim(),
          slug: form.slug.trim(),
          imagen_url: form.imagen_url || null,
          parent_id: form.parent_id || null,
          activo: form.activo,
        })
        .eq("id", editando.id);

      if (error) throw error;
      setEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la categoría. Revisa si el slug ya existe.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eliminando) return;
    try {
      const { error } = await supabase.from("categorias").delete().eq("id", eliminando.id);
      if (error) throw error;

      // Si tenía una portada subida, intentamos borrarla
      if (eliminando.imagen_url) {
        void eliminarImagenStorage(eliminando.imagen_url);
      }

      setEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert(
        "No se pudo eliminar la categoría. Asegúrate de que no tenga subcategorías o dependencias activas.",
      );
    }
  }

  async function handleToggleActivo(cat: CategoriaRow) {
    setTogglingId(cat.id);
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ activo: !cat.activo })
        .eq("id", cat.id);

      if (error) throw error;
      setCategorias((prev) => prev.map((c) => (c.id === cat.id ? { ...c, activo: !c.activo } : c)));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleReorder(cat: CategoriaRow, direction: "up" | "down") {
    // Filtrar categorías del mismo nivel para reordenar
    const levelCats = categorias.filter((c) => c.parent_id === cat.parent_id);
    const index = levelCats.findIndex((c) => c.id === cat.id);

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === levelCats.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const targetCat = levelCats[targetIndex];

    try {
      // Intercambiar orden en base de datos
      const { error: error1 } = await supabase
        .from("categorias")
        .update({ orden: targetCat.orden })
        .eq("id", cat.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("categorias")
        .update({ orden: cat.orden })
        .eq("id", targetCat.id);

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
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Categorías</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nueva categoría
        </button>
      </div>

      {!loading && (
        <p className="font-body text-xs text-[#8A7A6E] mb-4">
          {categorias.length}{" "}
          {categorias.length === 1 ? "categoría registrada" : "categorías registradas"}
        </p>
      )}

      {/* Tabla */}
      <div className="bg-white border border-[#E8DDD0] overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6]">
              <th className="px-4 py-3 text-left w-16" />
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Nombre
              </th>
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Slug
              </th>
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Tipo
              </th>
              <th className="px-4 py-3 text-center font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Orden
              </th>
              <th className="px-4 py-3 text-center font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Activo
              </th>
              <th className="px-4 py-3 text-right font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : treeData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]">
                  No hay categorías aún. Crea la primera con el botón de arriba.
                </td>
              </tr>
            ) : (
              treeData.map((cat) => {
                const isChild = !!cat.parent_id;
                const parentCatName = isChild
                  ? categorias.find((c) => c.id === cat.parent_id)?.nombre
                  : null;

                // Encontrar index en su propio nivel para habilitar/deshabilitar reordenar
                const levelCats = categorias.filter((c) => c.parent_id === cat.parent_id);
                const idxInLevel = levelCats.findIndex((c) => c.id === cat.id);
                const isFirst = idxInLevel === 0;
                const isLast = idxInLevel === levelCats.length - 1;

                return (
                  <tr
                    key={cat.id}
                    className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6]/50 transition-colors"
                  >
                    {/* Portada */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-[#F5EFE6] overflow-hidden flex-shrink-0 border border-[#E8DDD0]/50 rounded-sm">
                        {cat.imagen_url ? (
                          <img
                            src={cat.imagen_url}
                            alt={cat.nombre}
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
                      <p
                        className={`font-body text-sm text-[#2C2420] ${isChild ? "pl-6 font-light text-[#8A7A6E]" : "font-semibold"}`}
                      >
                        {isChild && <span className="mr-1 text-[#C4956A]">↳</span>}
                        {cat.nombre}
                      </p>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <code className="font-body text-xs text-[#8A7A6E] bg-[#F5EFE6] px-1.5 py-0.5 rounded-sm">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3 text-xs font-body text-[#8A7A6E]">
                      {isChild ? (
                        <span>
                          Subcategoría de{" "}
                          <strong className="text-[#2C2420] font-normal">{parentCatName}</strong>
                        </span>
                      ) : (
                        <span className="font-medium text-[#C4956A]">Principal</span>
                      )}
                    </td>

                    {/* Orden ↑↓ */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReorder(cat, "up")}
                          disabled={isFirst}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(cat, "down")}
                          disabled={isLast}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Toggle activo */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActivo(cat)}
                        disabled={togglingId === cat.id}
                        className="transition-colors disabled:opacity-50"
                        title={cat.activo ? "Desactivar" : "Activar"}
                      >
                        {togglingId === cat.id ? (
                          <Loader2
                            className="h-6 w-6 text-[#C4956A] animate-spin mx-auto"
                            strokeWidth={1.5}
                          />
                        ) : cat.activo ? (
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
                          onClick={() => setEditando(cat)}
                          className="p-1.5 text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setEliminando(cat)}
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
        <CategoriaForm
          titulo="Nueva categoría"
          initial={EMPTY_FORM}
          parents={parentCategories}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {editando && (
        <CategoriaForm
          titulo="Editar categoría"
          initial={{
            nombre: editando.nombre,
            slug: editando.slug,
            imagen_url: editando.imagen_url ?? "",
            parent_id: editando.parent_id ?? "",
            activo: editando.activo,
          }}
          parents={parentCategories.filter((c) => c.id !== editando.id)} // Evitar auto-dependencia
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
