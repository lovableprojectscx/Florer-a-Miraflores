import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  ExternalLink,
  Save,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type {
  RecuerdoRow,
  RecuerdoInsert,
  RecuerdoUpdate,
  CategoriaRow,
  DistritoRow,
  ProductoRow,
} from "@/types/database";
import {
  slugifyRecuerdo,
  getRecuerdoStatus,
  formatRecuerdoDate,
  validarRecuerdoForm,
} from "@/lib/recuerdos-utils";
import { armarOpcionesCategoriaSelect } from "@/lib/categorias-utils";
import { subirImagenConMiniaturas, eliminarImagenConMiniaturas } from "@/lib/image-optimizer";

export const Route = createFileRoute("/admin/recuerdos")({
  head: () => ({ meta: [{ title: "Mural de Recuerdos | Admin Florería Miraflores" }] }),
  component: RecuerdosAdminPage,
});

const BUCKET = "testimonios";

interface FormState {
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  imagen_portada_url: string;
  categoria_relacionada_id: string;
  distrito_id: string;
  producto_id: string;
  publicado: boolean;
  destacado: boolean;
  orden: number;
  fecha_publicacion: string; // YYYY-MM-DDTHH:mm
  meta_title: string;
  meta_description: string;
}

const EMPTY_FORM: FormState = {
  titulo: "",
  slug: "",
  resumen: "",
  contenido: "",
  imagen_portada_url: "",
  categoria_relacionada_id: "",
  distrito_id: "",
  producto_id: "",
  publicado: true,
  destacado: false,
  orden: 0,
  fecha_publicacion: new Date().toISOString().slice(0, 16),
  meta_title: "",
  meta_description: "",
};

// ─── Modal de Edición / Creación de Recuerdo ──────────────────────────────────

function RecuerdoEditorModal({
  recuerdo,
  categorias,
  distritos,
  productos,
  onClose,
  onSave,
  saving,
}: {
  recuerdo: RecuerdoRow | null;
  categorias: CategoriaRow[];
  distritos: DistritoRow[];
  productos: ProductoRow[];
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!recuerdo) return EMPTY_FORM;
    let fechaLocal = "";
    if (recuerdo.fecha_publicacion) {
      try {
        const d = new Date(recuerdo.fecha_publicacion);
        const offset = d.getTimezoneOffset() * 60000;
        fechaLocal = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      } catch {
        fechaLocal = new Date().toISOString().slice(0, 16);
      }
    } else {
      fechaLocal = new Date().toISOString().slice(0, 16);
    }

    return {
      titulo: recuerdo.titulo,
      slug: recuerdo.slug,
      resumen: recuerdo.resumen ?? "",
      contenido: recuerdo.contenido,
      imagen_portada_url: recuerdo.imagen_portada_url ?? "",
      categoria_relacionada_id: recuerdo.categoria_relacionada_id ?? "",
      distrito_id: recuerdo.distrito_id ?? "",
      producto_id: recuerdo.producto_id ?? "",
      publicado: Boolean(recuerdo.publicado),
      destacado: Boolean(recuerdo.destacado),
      orden: recuerdo.orden ?? 0,
      fecha_publicacion: fechaLocal,
      meta_title: recuerdo.meta_title ?? "",
      meta_description: recuerdo.meta_description ?? "",
    };
  });

  const [slugManual, setSlugManual] = useState(Boolean(recuerdo));
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Auto-slug al cambiar título si no se ha editado manualmente
  const handleTituloChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      titulo: val,
      slug: !slugManual ? slugifyRecuerdo(val) : prev.slug,
    }));
  };

  const handleRegenerarSlug = () => {
    setForm((prev) => ({ ...prev, slug: slugifyRecuerdo(prev.titulo) }));
    setSlugManual(false);
  };

  // Subir imagen de portada
  const handleSubirPortada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }

    try {
      setUploadingCover(true);
      const url = await subirImagenConMiniaturas(file, BUCKET, 1600);
      setForm((prev) => ({ ...prev, imagen_portada_url: url }));
      toast.success("Foto del recuerdo subida correctamente.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al subir la imagen a Storage.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEliminarPortada = async () => {
    if (form.imagen_portada_url) {
      try {
        await eliminarImagenConMiniaturas(form.imagen_portada_url, BUCKET);
      } catch (err) {
        console.warn("No se pudo eliminar la imagen previa de Storage:", err);
      }
    }
    setForm((prev) => ({ ...prev, imagen_portada_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validacion = validarRecuerdoForm(form);
    if (!validacion.isValid) {
      setErrores(validacion.errors);
      const primerError = Object.values(validacion.errors)[0];
      toast.error(primerError);
      return;
    }
    setErrores({});
    await onSave(form);
  };

  const opcionesCategoria = armarOpcionesCategoriaSelect(categorias);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recuerdo-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto border border-[#E8DDD0]">
        {/* Cabecera modal */}
        <div className="px-6 py-4 border-b border-[#E8DDD0] flex items-center justify-between bg-[#FAF8F5] rounded-t-xl">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-accent" />
            <h2 id="modal-recuerdo-title" className="font-display text-lg text-[#2C2420]">
              {recuerdo ? "Editar Recuerdo de Entrega" : "Nuevo Recuerdo de Entrega"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Título y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
                Título del Recuerdo *
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Ej. Sorpresa de Aniversario en Miraflores"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-sm font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
              />
              {errores.titulo && (
                <p className="text-xs text-red-600 mt-1 font-body">{errores.titulo}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420]">
                  Slug de URL *
                </label>
                <button
                  type="button"
                  onClick={handleRegenerarSlug}
                  className="text-[11px] font-body text-[#C4956A] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
              </div>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="sorpresa-de-aniversario-en-miraflores"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-sm font-mono text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
              />
              {errores.slug && (
                <p className="text-xs text-red-600 mt-1 font-body">{errores.slug}</p>
              )}
            </div>
          </div>

          {/* Fotografía de la Entrega */}
          <div>
            <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-2">
              Foto Real de la Entrega
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0]">
              {form.imagen_portada_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#E8DDD0] shrink-0">
                  <img
                    src={form.imagen_portada_url}
                    alt="Foto del recuerdo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleEliminarPortada}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[#E8DDD0] flex flex-col items-center justify-center text-[#8A7A6E] shrink-0 bg-white">
                  <ImageIcon className="w-8 h-8 stroke-[1.2] mb-1" />
                  <span className="text-[10px] font-body">Sin foto</span>
                </div>
              )}

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs font-body text-[#5C5046]">
                  Sube una foto de entrega en alta definición. Se optimizará a WebP automáticamente.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSubirPortada}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="px-4 py-2 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {form.imagen_portada_url ? "Cambiar foto" : "Subir foto"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Relaciones: Ocasión, Distrito y Producto Vinculado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
                Ocasión (Categoría)
              </label>
              <select
                value={form.categoria_relacionada_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoria_relacionada_id: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
              >
                <option value="">(Ninguna)</option>
                {opcionesCategoria.map((grp) => (
                  <optgroup key={grp.groupLabel} label={grp.groupLabel}>
                    {grp.options.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
                Distrito de Entrega
              </label>
              <select
                value={form.distrito_id}
                onChange={(e) => setForm((prev) => ({ ...prev, distrito_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
              >
                <option value="">(Sin especificar)</option>
                {distritos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
                Arreglo Floral Entregado
              </label>
              <select
                value={form.producto_id}
                onChange={(e) => setForm((prev) => ({ ...prev, producto_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
              >
                <option value="">(Ninguno / Selección manual)</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (S/. {Number(p.precio).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frase / Dedicatoria Corta */}
          <div>
            <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
              Frase corta o dedicatoria auténtica
            </label>
            <input
              type="text"
              value={form.resumen}
              onChange={(e) => setForm((prev) => ({ ...prev, resumen: e.target.value }))}
              placeholder="Ej. ¡5 años celebrando juntos con rosas rojas inolvidables!"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-sm font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
            />
          </div>

          {/* Reseña o Historia Breve */}
          <div>
            <label className="block text-xs font-body font-medium uppercase tracking-wider text-[#2C2420] mb-1.5">
              Reseña o Historia de la Entrega *
            </label>
            <textarea
              rows={4}
              value={form.contenido}
              onChange={(e) => setForm((prev) => ({ ...prev, contenido: e.target.value }))}
              placeholder="Breve narración de la entrega o contexto del momento especial..."
              className="w-full p-3 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-sm font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
            />
            {errores.contenido && (
              <p className="text-xs text-red-600 mt-1 font-body">{errores.contenido}</p>
            )}
          </div>

          {/* Configuración de Publicación y Destacado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E8DDD0]">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8DDD0]">
              <input
                type="checkbox"
                id="check-publicado"
                checked={form.publicado}
                onChange={(e) => setForm((prev) => ({ ...prev, publicado: e.target.checked }))}
                className="w-4 h-4 text-rose-accent rounded focus:ring-rose-accent"
              />
              <label
                htmlFor="check-publicado"
                className="text-xs font-body font-medium text-[#2C2420]"
              >
                Visible públicamente
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8DDD0]">
              <input
                type="checkbox"
                id="check-destacado"
                checked={form.destacado}
                onChange={(e) => setForm((prev) => ({ ...prev, destacado: e.target.checked }))}
                className="w-4 h-4 text-rose-accent rounded focus:ring-rose-accent"
              />
              <label
                htmlFor="check-destacado"
                className="text-xs font-body font-medium text-[#2C2420]"
              >
                Destacado en el mural
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-body uppercase tracking-wider text-[#8A7A6E] mb-1">
                Fecha del Momento
              </label>
              <input
                type="datetime-local"
                value={form.fecha_publicacion}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_publicacion: e.target.value }))
                }
                className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420]"
              />
            </div>
          </div>
        </form>

        {/* Pie de modal con acciones */}
        <div className="px-6 py-4 border-t border-[#E8DDD0] bg-[#FAF8F5] rounded-b-xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E8DDD0] text-[#2C2420] text-xs font-body rounded-lg hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {recuerdo ? "Actualizar Recuerdo" : "Crear Recuerdo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal de Administración de Recuerdos ─────────────────────────

function RecuerdosAdminPage() {
  const [recuerdos, setRecuerdos] = useState<RecuerdoRow[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [distritos, setDistritos] = useState<DistritoRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "publicado" | "programado" | "borrador"
  >("todos");
  const [filtroOcasion, setFiltroOcasion] = useState<string>("todas");
  const [filtroDistrito, setFiltroDistrito] = useState<string>("todos");

  const [selectedRecuerdo, setSelectedRecuerdo] = useState<RecuerdoRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<RecuerdoRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data: recs, error: errRecs }, { data: cats }, { data: dists }, { data: prods }] =
        await Promise.all([
          supabase
            .from("recuerdos")
            .select("*")
            .order("destacado", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase.from("categorias").select("*").eq("activo", true),
          supabase.from("distritos").select("*").eq("activo", true),
          supabase
            .from("productos")
            .select("*")
            .eq("activo", true)
            .order("nombre", { ascending: true }),
        ]);

      if (errRecs) throw errRecs;
      setRecuerdos(recs ?? []);
      setCategorias(cats ?? []);
      setDistritos(dists ?? []);
      setProductos(prods ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los recuerdos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Guardar (Crear o Actualizar)
  const handleSave = async (form: FormState) => {
    try {
      setSaving(true);
      const payload: Partial<RecuerdoInsert> = {
        titulo: form.titulo.trim(),
        slug: form.slug.trim(),
        resumen: form.resumen.trim() || null,
        contenido: form.contenido.trim(),
        imagen_portada_url: form.imagen_portada_url.trim() || null,
        categoria_relacionada_id: form.categoria_relacionada_id || null,
        distrito_id: form.distrito_id || null,
        producto_id: form.producto_id || null,
        publicado: form.publicado,
        destacado: form.destacado,
        orden: form.orden || 0,
        fecha_publicacion: form.fecha_publicacion
          ? new Date(form.fecha_publicacion).toISOString()
          : new Date().toISOString(),
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
      };

      if (selectedRecuerdo) {
        const { error } = await supabase
          .from("recuerdos")
          .update(payload)
          .eq("id", selectedRecuerdo.id);
        if (error) throw error;
        toast.success("Recuerdo actualizado correctamente.");
      } else {
        const { error } = await supabase.from("recuerdos").insert(payload as RecuerdoInsert);
        if (error) throw error;
        toast.success("Recuerdo creado exitosamente.");
      }

      setIsModalOpen(false);
      setSelectedRecuerdo(null);
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Alternar publicado rápido
  const handleTogglePublicado = async (rec: RecuerdoRow) => {
    try {
      const nuevoEstado = !rec.publicado;
      const { error } = await supabase
        .from("recuerdos")
        .update({ publicado: nuevoEstado })
        .eq("id", rec.id);
      if (error) throw error;
      setRecuerdos((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, publicado: nuevoEstado } : r)),
      );
      toast.success(nuevoEstado ? "Recuerdo publicado." : "Recuerdo pasado a borrador.");
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado.");
    }
  };

  // Alternar destacado rápido
  const handleToggleDestacado = async (rec: RecuerdoRow) => {
    try {
      const nuevoEstado = !rec.destacado;
      const { error } = await supabase
        .from("recuerdos")
        .update({ destacado: nuevoEstado })
        .eq("id", rec.id);
      if (error) throw error;
      setRecuerdos((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, destacado: nuevoEstado } : r)),
      );
      toast.success(nuevoEstado ? "Marcado como destacado." : "Desmarcado de destacados.");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar destacado.");
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("recuerdos").delete().eq("id", deleteCandidate.id);
      if (error) throw error;
      toast.success("Recuerdo eliminado.");
      setDeleteCandidate(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el recuerdo.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtros en cliente
  const filteredRecuerdos = recuerdos.filter((r) => {
    const matchSearch =
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase());

    const status = getRecuerdoStatus(r);
    const matchStatus = filtroEstado === "todos" || status === filtroEstado;

    const matchOcasion = filtroOcasion === "todas" || r.categoria_relacionada_id === filtroOcasion;

    const matchDistrito = filtroDistrito === "todos" || r.distrito_id === filtroDistrito;

    return matchSearch && matchStatus && matchOcasion && matchDistrito;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#2C2420]">Mural de Recuerdos</h1>
          <p className="font-body text-xs sm:text-sm text-[#8A7A6E] mt-1">
            Gestiona los momentos y fotografías reales de entregas para mostrar a tus clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedRecuerdo(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body uppercase tracking-wider rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Recuerdo
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-xl bg-white border border-[#E8DDD0] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A6E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o slug..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
          />
        </div>

        <div>
          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value as "todos" | "publicado" | "programado" | "borrador")
            }
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
          >
            <option value="todos">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="programado">Programados</option>
            <option value="borrador">Borradores</option>
          </select>
        </div>

        <div>
          <select
            value={filtroOcasion}
            onChange={(e) => setFiltroOcasion(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
          >
            <option value="todas">Todas las ocasiones</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filtroDistrito}
            onChange={(e) => setFiltroDistrito(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
          >
            <option value="todos">Todos los distritos</option>
            {distritos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla / Listado de Recuerdos */}
      <div className="bg-white rounded-xl border border-[#E8DDD0] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#8A7A6E]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#C4956A]" />
            <p className="text-xs font-body">Cargando recuerdos...</p>
          </div>
        ) : filteredRecuerdos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DDD0] text-[#8A7A6E] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Recuerdo</th>
                  <th className="py-3 px-4">Ocasión / Distrito</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Destacado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]/60 text-[#2C2420]">
                {filteredRecuerdos.map((rec) => {
                  const status = getRecuerdoStatus(rec);
                  const categoria = categorias.find((c) => c.id === rec.categoria_relacionada_id);
                  const distrito = distritos.find((d) => d.id === rec.distrito_id);

                  return (
                    <tr key={rec.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Miniatura */}
                      <td className="py-3 px-4">
                        {rec.imagen_portada_url ? (
                          <img
                            src={rec.imagen_portada_url}
                            alt={rec.titulo}
                            className="w-12 h-14 object-cover rounded-md border border-[#E8DDD0]"
                          />
                        ) : (
                          <div className="w-12 h-14 rounded-md bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#8A7A6E]">
                            <ImageIcon className="w-5 h-5 stroke-[1.2]" />
                          </div>
                        )}
                      </td>

                      {/* Título & Slug */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-sm text-[#2C2420] truncate">{rec.titulo}</p>
                        <p className="text-[11px] font-mono text-[#8A7A6E] truncate">/{rec.slug}</p>
                      </td>

                      {/* Ocasión y Distrito */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {categoria && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-[#FAF8F5] text-rose-accent border border-[#E8DDD0]">
                              {categoria.nombre}
                            </span>
                          )}
                          {distrito && (
                            <span className="block text-[11px] text-[#8A7A6E]">
                              📍 {distrito.nombre}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePublicado(rec)}
                          className="cursor-pointer"
                        >
                          {status === "publicado" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Publicado
                            </span>
                          )}
                          {status === "programado" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Programado
                            </span>
                          )}
                          {status === "borrador" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <FileText className="w-3 h-3" /> Borrador
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Destacado */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleDestacado(rec)}
                          className="cursor-pointer p-1 rounded hover:bg-gray-100"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              rec.destacado
                                ? "fill-amber-400 text-amber-500"
                                : "text-gray-300 hover:text-gray-400"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/recuerdos/$slug"
                            params={{ slug: rec.slug }}
                            target="_blank"
                            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] rounded hover:bg-[#FAF8F5]"
                            title="Ver en vivo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecuerdo(rec);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] rounded hover:bg-[#FAF8F5]"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(rec)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#8A7A6E]">
            <Camera className="w-8 h-8 stroke-[1.2] mx-auto mb-2 text-[#C4956A]" />
            <p className="text-sm font-body">No se encontraron recuerdos con estos filtros.</p>
          </div>
        )}
      </div>

      {/* Modal Editor */}
      {isModalOpen && (
        <RecuerdoEditorModal
          recuerdo={selectedRecuerdo}
          categorias={categorias}
          distritos={distritos}
          productos={productos}
          saving={saving}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecuerdo(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-[#E8DDD0]">
            <h3 className="font-display text-lg text-[#2C2420]">¿Eliminar este recuerdo?</h3>
            <p className="font-body text-xs text-[#8A7A6E] leading-relaxed">
              Estás por eliminar permanentemente el recuerdo{" "}
              <strong className="text-[#2C2420]">"{deleteCandidate.titulo}"</strong>. Esta acción no
              se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-[#E8DDD0] text-xs font-body rounded-lg hover:bg-[#FAF8F5]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-body rounded-lg transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
