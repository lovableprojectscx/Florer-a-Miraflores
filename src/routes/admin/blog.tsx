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
  AlertTriangle,
  Save,
  BookOpen,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Link2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { BlogPostRow, BlogPostInsert, BlogPostUpdate, CategoriaRow } from "@/types/database";
import {
  slugifyBlog,
  getBlogPostStatus,
  formatBlogDate,
  calculateReadingTime,
  validarBlogPostForm,
} from "@/lib/blog-utils";
import { armarOpcionesCategoriaSelect } from "@/lib/categorias-utils";
import { subirImagenConMiniaturas, eliminarImagenConMiniaturas } from "@/lib/image-optimizer";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Blog | Admin Florería Miraflores" }] }),
  component: BlogAdminPage,
});

const BUCKET = "blog";

interface FormState {
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  imagen_portada_url: string;
  autor: string;
  categoria_relacionada_id: string;
  publicado: boolean;
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
  autor: "Florería Miraflores",
  categoria_relacionada_id: "",
  publicado: false,
  fecha_publicacion: new Date().toISOString().slice(0, 16),
  meta_title: "",
  meta_description: "",
};

// ─── Modal de Edición / Creación de Artículo ──────────────────────────────────

function BlogEditorModal({
  post,
  categorias,
  onClose,
  onSave,
  saving,
}: {
  post: BlogPostRow | null;
  categorias: CategoriaRow[];
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!post) return EMPTY_FORM;
    let fechaLocal = "";
    if (post.fecha_publicacion) {
      try {
        const d = new Date(post.fecha_publicacion);
        // Formato local YYYY-MM-DDTHH:mm
        const offset = d.getTimezoneOffset() * 60000;
        fechaLocal = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      } catch {
        fechaLocal = new Date().toISOString().slice(0, 16);
      }
    } else {
      fechaLocal = new Date().toISOString().slice(0, 16);
    }

    return {
      titulo: post.titulo,
      slug: post.slug,
      resumen: post.resumen ?? "",
      contenido: post.contenido,
      imagen_portada_url: post.imagen_portada_url ?? "",
      autor: post.autor ?? "Florería Miraflores",
      categoria_relacionada_id: post.categoria_relacionada_id ?? "",
      publicado: Boolean(post.publicado),
      fecha_publicacion: fechaLocal,
      meta_title: post.meta_title ?? "",
      meta_description: post.meta_description ?? "",
    };
  });

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [slugManual, setSlugManual] = useState(Boolean(post));
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImg, setUploadingContentImg] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImgInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-slug al cambiar título si no se ha editado manualmente
  const handleTituloChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      titulo: val,
      slug: !slugManual ? slugifyBlog(val) : prev.slug,
    }));
  };

  const handleRegenerarSlug = () => {
    setForm((prev) => ({ ...prev, slug: slugifyBlog(prev.titulo) }));
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
      toast.success("Foto de portada subida correctamente.");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("42P01") || msg.includes("PGRST205") || msg.includes("bucket")) {
        toast.error("Falta correr el SQL 008");
      } else {
        toast.error("Error al subir la imagen a Storage.");
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEliminarPortada = async () => {
    if (form.imagen_portada_url) {
      void eliminarImagenConMiniaturas(form.imagen_portada_url, BUCKET);
    }
    setForm((prev) => ({ ...prev, imagen_portada_url: "" }));
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Insertar Markdown en posición del cursor
  const insertarTextoEnCursor = (antes: string, despues: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = form.contenido;
    const seleccionado = textoActual.substring(start, end);

    const nuevoTexto =
      textoActual.substring(0, start) + antes + seleccionado + despues + textoActual.substring(end);

    setForm((prev) => ({ ...prev, contenido: nuevoTexto }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + antes.length, start + antes.length + seleccionado.length);
    }, 0);
  };

  // Subir imagen para insertar en el contenido Markdown
  const handleSubirImagenContenido = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }

    try {
      setUploadingContentImg(true);
      const url = await subirImagenConMiniaturas(file, BUCKET, 1600);
      const nombreLimpio = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const markdownImage = `\n![${nombreLimpio}](${url})\n`;

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const textoActual = form.contenido;
        const nuevoTexto =
          textoActual.substring(0, start) + markdownImage + textoActual.substring(start);
        setForm((prev) => ({ ...prev, contenido: nuevoTexto }));
      } else {
        setForm((prev) => ({ ...prev, contenido: prev.contenido + markdownImage }));
      }

      toast.success("Imagen insertada en el contenido.");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("42P01") || msg.includes("PGRST205") || msg.includes("bucket")) {
        toast.error("Falta correr el SQL 008");
      } else {
        toast.error("Error al subir la imagen.");
      }
    } finally {
      setUploadingContentImg(false);
      if (contentImgInputRef.current) contentImgInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validarBlogPostForm({
      titulo: form.titulo,
      slug: form.slug,
      contenido: form.contenido,
      resumen: form.resumen,
    });

    if (!validation.isValid) {
      setErrores(validation.errors);
      toast.error("Por favor completa los campos requeridos correctamente.");
      return;
    }

    setErrores({});
    await onSave(form);
  };

  const opcionesCategorias = armarOpcionesCategoriaSelect(categorias);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl rounded-xl overflow-hidden border border-[#E8DDD0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0] bg-[#FDFAF6]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C4956A]" />
            <h2 className="font-display text-xl text-[#2C2420]">
              {post ? "Editar Artículo" : "Nuevo Artículo de Blog"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Título y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5 font-medium">
                Título del artículo *
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Ej: Significado de los colores de las rosas"
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
              {errores.titulo && <p className="text-red-500 text-xs mt-1">{errores.titulo}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] font-medium">
                  Slug (URL) *
                </label>
                <button
                  type="button"
                  onClick={handleRegenerarSlug}
                  className="text-[11px] text-[#C4956A] hover:underline inline-flex items-center gap-1 font-body"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
              </div>
              <div className="flex items-center border border-[#E8DDD0] rounded px-3 h-10 bg-[#FAF8F5] focus-within:border-[#C4956A] focus-within:bg-white transition-colors">
                <span className="text-xs text-[#8A7A6E] select-none font-mono">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
                  }}
                  placeholder="significado-de-los-colores-de-las-rosas"
                  className="w-full bg-transparent font-mono text-xs text-[#2C2420] outline-none ml-1"
                />
              </div>
              {errores.slug && <p className="text-red-500 text-xs mt-1">{errores.slug}</p>}
            </div>
          </div>

          {/* Resumen con contador */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] font-medium">
                Resumen / Bajada (máx ~160 caracteres recomendados)
              </label>
              <span
                className={`text-xs font-mono ${
                  form.resumen.length > 160 ? "text-amber-600 font-semibold" : "text-[#8A7A6E]"
                }`}
              >
                {form.resumen.length} / 160
              </span>
            </div>
            <textarea
              rows={2}
              value={form.resumen}
              onChange={(e) => setForm({ ...form, resumen: e.target.value })}
              placeholder="Breve introducción que enganche al lector y sirva como descripción en Google..."
              className="w-full p-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors leading-relaxed"
            />
          </div>

          {/* Imagen de portada */}
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-2 font-medium">
              Imagen de portada (aspecto 16:9)
            </label>

            {form.imagen_portada_url ? (
              <div className="relative aspect-[16/9] max-w-md border border-[#E8DDD0] rounded-lg overflow-hidden bg-[#FAF8F5]">
                <img
                  src={form.imagen_portada_url}
                  alt="Portada del artículo"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleEliminarPortada}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-sm"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="max-w-md">
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleSubirPortada}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full aspect-[16/9] border-2 border-dashed border-[#E8DDD0] rounded-lg flex flex-col items-center justify-center p-4 text-[#8A7A6E] hover:border-[#C4956A] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingCover ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#C4956A]" />
                      <span className="text-xs font-body">Subiendo imagen optimizada...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-[#C4956A]" />
                      <span className="text-xs font-body font-medium text-[#2C2420]">
                        Subir foto de portada (JPG, PNG, WebP)
                      </span>
                      <span className="text-[11px] font-body text-[#8A7A6E]">
                        Se optimizará y generará miniaturas automáticamente
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Contenido Markdown con pestañas Escribir / Vista previa */}
          <div>
            <div className="flex items-center justify-between border-b border-[#E8DDD0] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <label className="font-body text-xs tracking-wider uppercase text-[#8A7A6E] font-medium mr-2">
                  Contenido *
                </label>
                <div className="inline-flex rounded-lg bg-[#FAF8F5] p-0.5 border border-[#E8DDD0]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    className={`px-3 py-1 text-xs font-body font-medium rounded-md transition-colors ${
                      activeTab === "write"
                        ? "bg-white text-[#2C2420] shadow-xs"
                        : "text-[#8A7A6E] hover:text-[#2C2420]"
                    }`}
                  >
                    Escribir
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1 text-xs font-body font-medium rounded-md transition-colors ${
                      activeTab === "preview"
                        ? "bg-white text-[#2C2420] shadow-xs"
                        : "text-[#8A7A6E] hover:text-[#2C2420]"
                    }`}
                  >
                    Vista previa
                  </button>
                </div>
              </div>

              {activeTab === "write" && (
                <div className="flex items-center gap-1">
                  {/* Botón Insertar imagen */}
                  <input
                    type="file"
                    ref={contentImgInputRef}
                    onChange={handleSubirImagenContenido}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => contentImgInputRef.current?.click()}
                    disabled={uploadingContentImg}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-body font-medium bg-[#FAF8F5] hover:bg-[#F5EFE6] text-[#2C2420] border border-[#E8DDD0] rounded transition-colors disabled:opacity-50"
                  >
                    {uploadingContentImg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-[#C4956A]" />
                    )}
                    <span>Insertar imagen</span>
                  </button>
                </div>
              )}
            </div>

            {activeTab === "write" ? (
              <div className="space-y-2">
                {/* Barra de herramientas rápida Markdown */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-t text-[#2C2420]">
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("**", "**")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Negrita"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("*", "*")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Cursiva"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("\n## ", "\n")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Subtítulo H2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("\n### ", "\n")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Sección H3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("\n- ", "\n")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Lista con viñetas"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("\n> ", "\n")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Cita"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarTextoEnCursor("[texto del enlace](", ")")}
                    className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
                    title="Enlace"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={14}
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  placeholder="Escribe el artículo en Markdown. Usa los botones de formato o escribe directamente ## Título, **negrita**, listas e imágenes..."
                  className="w-full p-4 border border-[#E8DDD0] border-t-0 rounded-b font-mono text-xs sm:text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors leading-relaxed bg-[#FDFAF6]"
                />
                {errores.contenido && (
                  <p className="text-red-500 text-xs mt-1">{errores.contenido}</p>
                )}
              </div>
            ) : (
              <div className="border border-[#E8DDD0] rounded p-6 min-h-[350px] bg-white">
                {form.contenido.trim() ? (
                  <div className="prose prose-stone max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="font-display text-2xl text-[#2C2420] mt-6 mb-3 font-normal">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="font-display text-xl text-[#2C2420] mt-6 mb-3 font-normal">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="font-display text-lg text-[#2C2420] mt-4 mb-2 font-medium">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="font-body font-light text-sm text-[#4A4036] leading-relaxed mb-4">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 mb-4 space-y-1 font-body font-light text-[#4A4036] text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-6 mb-4 space-y-1 font-body font-light text-[#4A4036] text-sm">
                            {children}
                          </ol>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[#C4956A] pl-4 my-4 italic text-[#6B5E55] bg-[#FAF8F5] py-2 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        img: ({ src, alt }) => (
                          <span className="block my-4">
                            <img
                              src={src}
                              alt={alt || ""}
                              className="rounded-lg max-w-full h-auto mx-auto object-cover border border-[#E8DDD0]/50"
                            />
                            {alt && (
                              <span className="block text-center text-xs text-[#8A7A6E] mt-1 font-body">
                                {alt}
                              </span>
                            )}
                          </span>
                        ),
                      }}
                    >
                      {form.contenido}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-center text-[#8A7A6E] font-body text-sm py-12">
                    Aún no has escrito nada. Pasa a la pestaña &ldquo;Escribir&rdquo; para redactar
                    el contenido.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Categoría relacionada y Autor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E8DDD0]/60">
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5 font-medium">
                Categoría relacionada (para recomendar productos)
              </label>
              <select
                value={form.categoria_relacionada_id}
                onChange={(e) => setForm({ ...form, categoria_relacionada_id: e.target.value })}
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] bg-white outline-none focus:border-[#C4956A]"
              >
                <option value="">Ninguna (sin productos al pie del artículo)</option>
                {opcionesCategorias.map((grupo) => (
                  <optgroup key={grupo.groupLabel} label={grupo.groupLabel}>
                    {grupo.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-[#8A7A6E] mt-1 font-body">
                Al final del artículo se mostrarán hasta 4 arreglos activos de esta categoría.
              </p>
            </div>

            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5 font-medium">
                Autor
              </label>
              <input
                type="text"
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
                placeholder="Florería Miraflores"
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A]"
              />
            </div>
          </div>

          {/* Publicación y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E8DDD0]/60">
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-[#8A7A6E] mb-1.5 font-medium">
                Fecha y hora de publicación
              </label>
              <input
                type="datetime-local"
                value={form.fecha_publicacion}
                onChange={(e) => setForm({ ...form, fecha_publicacion: e.target.value })}
                className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A]"
              />
              <p className="text-[11px] text-[#8A7A6E] mt-1 font-body">
                Si la fecha es futura, el artículo quedará programado y se mostrará al cumplirse.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E8DDD0]">
              <div>
                <p className="font-body text-xs font-semibold text-[#2C2420] uppercase tracking-wider">
                  Publicar artículo
                </p>
                <p className="font-body text-[11px] text-[#8A7A6E] mt-0.5">
                  {form.publicado
                    ? "Visible para el público según la fecha"
                    : "Guardado como borrador (no visible)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, publicado: !form.publicado })}
                className="cursor-pointer"
                aria-label="Toggle publicado"
              >
                {form.publicado ? (
                  <ToggleRight className="w-8 h-8 text-[#C4956A]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#8A7A6E]" />
                )}
              </button>
            </div>
          </div>

          {/* Campos SEO Opcionales */}
          <details className="pt-2 border-t border-[#E8DDD0]/60">
            <summary className="cursor-pointer font-body text-xs tracking-wider uppercase text-[#8A7A6E] hover:text-[#2C2420] font-medium py-2">
              + Metadatos SEO Opcionales (Google & Redes)
            </summary>
            <div className="space-y-3 pt-3">
              <div>
                <label className="block font-body text-xs text-[#8A7A6E] mb-1">
                  Meta Title personalizado (por defecto usa el título del artículo)
                </label>
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  placeholder="Ej: Significado de regalar flores | Florería Miraflores"
                  className="w-full h-10 px-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A]"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-[#8A7A6E] mb-1">
                  Meta Description personalizada (por defecto usa el resumen)
                </label>
                <textarea
                  rows={2}
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  placeholder="Descripción específica para Google..."
                  className="w-full p-3 border border-[#E8DDD0] rounded font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A]"
                />
              </div>
            </div>
          </details>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0] bg-[#FDFAF6]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingCover || uploadingContentImg}
            className="px-4 py-2 text-xs font-body tracking-wider uppercase text-[#8A7A6E] hover:text-[#2C2420]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploadingCover || uploadingContentImg}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body tracking-wider uppercase font-medium rounded transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Artículo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Confirmación de Eliminación ──────────────────────────────────────

function ModalConfirmarEliminar({
  post,
  onClose,
  onConfirm,
  eliminando,
}: {
  post: BlogPostRow;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  eliminando: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-xl p-6 shadow-2xl border border-[#E8DDD0]">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg text-[#2C2420]">¿Eliminar artículo?</h3>
            <p className="font-body text-xs text-[#8A7A6E]">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <p className="font-body text-sm text-[#4A4036] mb-6 leading-relaxed">
          ¿Estás seguro de que deseas eliminar permanentemente el artículo{" "}
          <strong className="text-[#2C2420]">&ldquo;{post.titulo}&rdquo;</strong>?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={eliminando}
            className="px-4 py-2 text-xs font-body uppercase tracking-wider text-[#8A7A6E] hover:text-[#2C2420]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={eliminando}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-body uppercase tracking-wider font-medium rounded transition-colors disabled:opacity-50"
          >
            {eliminando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal Admin Blog ──────────────────────────────────────────────

function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "publicado" | "borrador" | "programado"
  >("todos");

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [postEditando, setPostEditando] = useState<BlogPostRow | null>(null);
  const [postEliminando, setPostEliminando] = useState<BlogPostRow | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoAccion, setEliminandoAccion] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setTableMissing(false);

    try {
      // 1. Cargar Categorías para el selector
      const { data: catsData } = await supabase
        .from("categorias")
        .select("*")
        .order("orden", { ascending: true });
      setCategorias(catsData ?? []);

      // 2. Cargar Artículos de Blog
      const { data: postsData, error: postsError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        if (
          postsError.code === "42P01" ||
          postsError.code === "PGRST205" ||
          postsError.message?.includes("blog_posts")
        ) {
          setTableMissing(true);
          setPosts([]);
          toast.error("Falta correr el SQL 008");
        } else {
          toast.error(`Error al cargar artículos: ${postsError.message}`);
        }
      } else {
        setPosts(postsData ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Guardar (Crear o Editar)
  const handleGuardarPost = async (form: FormState) => {
    try {
      setGuardando(true);

      // Verificar unicidad de slug
      const { data: slugDuplicado, error: slugCheckError } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", form.slug)
        .neq("id", postEditando?.id ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();

      if (
        slugCheckError &&
        (slugCheckError.code === "42P01" || slugCheckError.code === "PGRST205")
      ) {
        toast.error("Falta correr el SQL 008");
        return;
      }

      if (slugDuplicado) {
        toast.error("El slug ingresado ya existe. Usa uno diferente.");
        return;
      }

      const isoFecha = form.fecha_publicacion
        ? new Date(form.fecha_publicacion).toISOString()
        : new Date().toISOString();

      if (postEditando) {
        // Actualizar
        const updatePayload: BlogPostUpdate = {
          titulo: form.titulo.trim(),
          slug: form.slug.trim(),
          resumen: form.resumen.trim() || null,
          contenido: form.contenido,
          imagen_portada_url: form.imagen_portada_url || null,
          autor: form.autor.trim() || "Florería Miraflores",
          categoria_relacionada_id: form.categoria_relacionada_id || null,
          publicado: form.publicado,
          fecha_publicacion: isoFecha,
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
        };

        const { error } = await supabase
          .from("blog_posts")
          .update(updatePayload)
          .eq("id", postEditando.id);

        if (error) {
          if (error.code === "42P01" || error.code === "PGRST205") {
            toast.error("Falta correr el SQL 008");
          } else {
            toast.error(`Error al actualizar: ${error.message}`);
          }
          return;
        }

        toast.success("Artículo actualizado correctamente.");
      } else {
        // Crear
        const insertPayload: BlogPostInsert = {
          titulo: form.titulo.trim(),
          slug: form.slug.trim(),
          resumen: form.resumen.trim() || null,
          contenido: form.contenido,
          imagen_portada_url: form.imagen_portada_url || null,
          autor: form.autor.trim() || "Florería Miraflores",
          categoria_relacionada_id: form.categoria_relacionada_id || null,
          publicado: form.publicado,
          fecha_publicacion: isoFecha,
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
        };

        const { error } = await supabase.from("blog_posts").insert(insertPayload);

        if (error) {
          if (error.code === "42P01" || error.code === "PGRST205") {
            toast.error("Falta correr el SQL 008");
          } else {
            toast.error(`Error al crear: ${error.message}`);
          }
          return;
        }

        toast.success("Artículo creado correctamente.");
      }

      setModalAbierto(false);
      setPostEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al guardar el artículo.");
    } finally {
      setGuardando(false);
    }
  };

  // Toggle Publicado / Despublicado rápido
  const handleTogglePublicado = async (post: BlogPostRow) => {
    try {
      const nuevoEstado = !post.publicado;
      const { error } = await supabase
        .from("blog_posts")
        .update({
          publicado: nuevoEstado,
          fecha_publicacion:
            nuevoEstado && !post.fecha_publicacion
              ? new Date().toISOString()
              : post.fecha_publicacion,
        })
        .eq("id", post.id);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          toast.error("Falta correr el SQL 008");
        } else {
          toast.error(`Error al cambiar estado: ${error.message}`);
        }
        return;
      }

      toast.success(nuevoEstado ? "Artículo publicado." : "Artículo guardado como borrador.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado.");
    }
  };

  // Confirmar eliminación
  const handleConfirmarEliminar = async () => {
    if (!postEliminando) return;

    try {
      setEliminandoAccion(true);
      if (postEliminando.imagen_portada_url) {
        void eliminarImagenConMiniaturas(postEliminando.imagen_portada_url, BUCKET);
      }

      const { error } = await supabase.from("blog_posts").delete().eq("id", postEliminando.id);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          toast.error("Falta correr el SQL 008");
        } else {
          toast.error(`Error al eliminar: ${error.message}`);
        }
        return;
      }

      toast.success("Artículo eliminado.");
      setPostEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el artículo.");
    } finally {
      setEliminandoAccion(false);
    }
  };

  // Filtrado de posts
  const postsFiltrados = posts.filter((p) => {
    const coincideBusqueda =
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.slug.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;

    const estado = getBlogPostStatus(p);
    if (filtroEstado === "todos") return true;
    return estado === filtroEstado;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Aviso si falta correr la migración SQL 008 */}
      {tableMissing && (
        <div className="bg-[#FFF8E7] border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-amber-900 text-sm">
              Falta correr el SQL 008
            </p>
            <p className="font-body text-xs text-amber-800 mt-0.5 leading-relaxed">
              La tabla{" "}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">blog_posts</code> o el
              bucket <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">blog</code> aún no
              existen en Supabase. Podrás gestionar artículos en cuanto el revisor apruebe y se
              ejecute el archivo{" "}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                docs/sql/008-blog.sql
              </code>
              .
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#2C2420]">Blog de Flores & SEO</h1>
          <p className="font-body text-xs sm:text-sm text-[#8A7A6E] mt-1">
            Crea y administra artículos editoriales para posicionar en Google y recomendar arreglos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPostEditando(null);
            setModalAbierto(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body uppercase tracking-wider font-medium rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo artículo</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DDD0] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A7A6E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o slug..."
            className="w-full h-9 pl-9 pr-3 font-body text-xs text-[#2C2420] bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg outline-none focus:border-[#C4956A] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["todos", "publicado", "borrador", "programado"] as const).map((estado) => {
            const label =
              estado === "todos"
                ? "Todos"
                : estado === "publicado"
                  ? "Publicados"
                  : estado === "borrador"
                    ? "Borradores"
                    : "Programados";
            return (
              <button
                key={estado}
                type="button"
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-body capitalize transition-colors whitespace-nowrap ${
                  filtroEstado === estado
                    ? "bg-[#2C2420] text-white font-medium"
                    : "bg-[#FAF8F5] text-[#8A7A6E] hover:text-[#2C2420] border border-[#E8DDD0]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Artículos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#E8DDD0]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C4956A] mb-3" />
          <p className="text-xs font-body text-[#8A7A6E]">Cargando artículos del blog...</p>
        </div>
      ) : postsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#E8DDD0] text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#C4956A] mb-3">
            <BookOpen className="w-6 h-6 stroke-[1.4]" />
          </div>
          <h3 className="font-display text-lg text-[#2C2420] mb-1">
            {posts.length === 0 ? "Aún no hay artículos" : "No hay resultados"}
          </h3>
          <p className="font-body text-xs text-[#8A7A6E] max-w-sm mb-4">
            {posts.length === 0
              ? "Crea el primer artículo de tu blog haciendo clic en el botón 'Nuevo artículo'."
              : "No se encontraron artículos con los filtros seleccionados."}
          </p>
          {posts.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setPostEditando(null);
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C2420] text-white text-xs font-body uppercase tracking-wider rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear artículo
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8DDD0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8DDD0] bg-[#FAF8F5] text-[11px] font-body uppercase tracking-wider text-[#8A7A6E]">
                  <th className="py-3.5 px-4">Artículo</th>
                  <th className="py-3.5 px-4">Categoría vinculada</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha de publicación</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]/60 font-body text-xs">
                {postsFiltrados.map((p) => {
                  const estado = getBlogPostStatus(p);
                  const lecturaMin = calculateReadingTime(p.contenido);
                  const categoria = categorias.find((c) => c.id === p.categoria_relacionada_id);

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Portada + Título + Slug */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded overflow-hidden bg-[#FAF8F5] border border-[#E8DDD0] shrink-0">
                            {p.imagen_portada_url ? (
                              <img
                                src={p.imagen_portada_url}
                                alt={p.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8A7A6E]">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#2C2420] text-sm line-clamp-1">
                              {p.titulo}
                            </p>
                            <p className="font-mono text-[11px] text-[#8A7A6E] mt-0.5">
                              /blog/{p.slug} • {lecturaMin} min
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría relacionada */}
                      <td className="py-3 px-4 text-[#8A7A6E]">
                        {categoria ? (
                          <span className="inline-flex items-center gap-1 text-[#2C2420] font-medium">
                            {categoria.nombre}
                          </span>
                        ) : (
                          <span className="text-[#8A7A6E]/70">— Ninguna —</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {estado === "publicado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Publicado
                          </span>
                        ) : estado === "programado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Programado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            Borrador
                          </span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 text-[#8A7A6E] whitespace-nowrap">
                        {formatBlogDate(p.fecha_publicacion)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ver artículo público */}
                          <Link
                            to="/blog/$slug"
                            params={{ slug: p.slug }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] hover:bg-[#FAF8F5] rounded transition-colors"
                            title="Ver artículo público en nueva pestaña"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Publicar / Despublicar botón */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublicado(p)}
                            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] hover:bg-[#FAF8F5] rounded transition-colors"
                            title={p.publicado ? "Pasar a borrador" : "Publicar ahora"}
                          >
                            <Eye
                              className={`w-4 h-4 ${p.publicado ? "text-emerald-600" : "text-[#8A7A6E]"}`}
                            />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => {
                              setPostEditando(p);
                              setModalAbierto(true);
                            }}
                            className="p-1.5 text-[#8A7A6E] hover:text-[#2C2420] hover:bg-[#FAF8F5] rounded transition-colors"
                            title="Editar artículo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => setPostEliminando(p)}
                            className="p-1.5 text-[#8A7A6E] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar artículo"
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
        </div>
      )}

      {/* Modal de edición */}
      {modalAbierto && (
        <BlogEditorModal
          post={postEditando}
          categorias={categorias}
          onClose={() => {
            setModalAbierto(false);
            setPostEditando(null);
          }}
          onSave={handleGuardarPost}
          saving={guardando}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {postEliminando && (
        <ModalConfirmarEliminar
          post={postEliminando}
          onClose={() => setPostEliminando(null)}
          onConfirm={handleConfirmarEliminar}
          eliminando={eliminandoAccion}
        />
      )}
    </div>
  );
}
