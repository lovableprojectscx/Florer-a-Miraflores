import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Tag, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TagRow, TagInsert } from "@/types/database";

export const Route = createFileRoute("/admin/tags")({
  component: AdminTags,
});

const CLAVES_SISTEMA = ["novedad", "mas_vendido", "edicion_limitada", "oferta"] as const;

const EMPTY_FORM: Omit<TagInsert, "orden"> = {
  clave: "",
  nombre: "",
  descripcion: "",
  color_badge: "#2C2420",
  activo: true,
  mostrar_en_home: true,
};

function AdminTags() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TagInsert, "orden">>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── Carga inicial ── */
  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("orden", { ascending: true });
    if (error) setError(error.message);
    else setTags(data ?? []);
    setLoading(false);
  }

  /* ── Guardar (crear o editar) ── */
  async function handleSave() {
    if (!form.clave.trim() || !form.nombre.trim()) {
      setError("La clave y el nombre son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);

    if (editId) {
      const { error } = await supabase
        .from("tags")
        .update({ ...form })
        .eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const orden = tags.length > 0 ? Math.max(...tags.map((t) => t.orden)) + 1 : 1;
      const { error } = await supabase.from("tags").insert({ ...form, orden });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  }

  /* ── Toggle activo ── */
  async function toggleActivo(tag: TagRow) {
    await supabase.from("tags").update({ activo: !tag.activo }).eq("id", tag.id);
    setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, activo: !t.activo } : t)));
  }

  /* ── Toggle mostrar_en_home ── */
  async function toggleHome(tag: TagRow) {
    await supabase.from("tags").update({ mostrar_en_home: !tag.mostrar_en_home }).eq("id", tag.id);
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, mostrar_en_home: !t.mostrar_en_home } : t)),
    );
  }

  /* ── Reordenar ── */
  async function mover(tag: TagRow, dir: "up" | "down") {
    const idx = tags.findIndex((t) => t.id === tag.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tags.length) return;

    const a = tags[idx];
    const b = tags[swapIdx];
    const newTags = [...tags];
    newTags[idx] = { ...a, orden: b.orden };
    newTags[swapIdx] = { ...b, orden: a.orden };
    newTags.sort((x, y) => x.orden - y.orden);
    setTags(newTags);

    await Promise.all([
      supabase.from("tags").update({ orden: b.orden }).eq("id", a.id),
      supabase.from("tags").update({ orden: a.orden }).eq("id", b.id),
    ]);
  }

  /* ── Eliminar ── */
  async function handleDelete(id: string) {
    await supabase.from("tags").delete().eq("id", id);
    setDeleteConfirm(null);
    load();
  }

  /* ── Abrir form edición ── */
  function startEdit(tag: TagRow) {
    setEditId(tag.id);
    setForm({
      clave: tag.clave,
      nombre: tag.nombre,
      descripcion: tag.descripcion ?? "",
      color_badge: tag.color_badge,
      activo: tag.activo,
      mostrar_en_home: tag.mostrar_en_home,
    });
    setShowForm(true);
    setError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  /* ── UI ── */
  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-5xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display italic text-3xl text-[#2C2420]">Tags</h1>
          <p className="font-body text-sm text-[#8A7A6E] mt-1">
            Cada tag activo con "Mostrar en home" genera su propia sección en la página de inicio.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] text-white font-body text-xs tracking-widest uppercase hover:bg-[#2C2420]/80 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Nuevo tag
          </button>
        )}
      </div>

      {/* Formulario crear / editar */}
      {showForm && (
        <div className="mb-8 border border-[#E8DDD0] bg-white p-6 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display italic text-xl text-[#2C2420]">
              {editId ? "Editar tag" : "Nuevo tag"}
            </h2>
            <button onClick={cancelForm} className="text-[#8A7A6E] hover:text-[#2C2420]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Clave */}
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Clave <span className="text-red-400">*</span>
              </label>
              <input
                value={form.clave}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    clave: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  }))
                }
                disabled={!!editId && CLAVES_SISTEMA.includes(form.clave as never)}
                placeholder="ej: novedad, mas_vendido"
                className="w-full h-10 px-3 border border-[#E8DDD0] font-body text-sm text-[#2C2420] focus:outline-none focus:border-[#C4956A] disabled:bg-[#F5EFE6] disabled:text-[#8A7A6E]"
              />
              <p className="mt-1 font-body text-[10px] text-[#8A7A6E]">
                Solo letras y guion bajo. Debe coincidir con el tag en los productos.
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Nombre visible <span className="text-red-400">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="ej: Lanzamientos especiales"
                className="w-full h-10 px-3 border border-[#E8DDD0] font-body text-sm text-[#2C2420] focus:outline-none focus:border-[#C4956A]"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Descripción corta
              </label>
              <textarea
                value={form.descripcion ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                placeholder="Aparece como subtexto bajo el título de la sección en el home."
                className="w-full px-3 py-2.5 border border-[#E8DDD0] font-body text-sm text-[#2C2420] focus:outline-none focus:border-[#C4956A] resize-none"
              />
            </div>

            {/* Color badge */}
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-2">
                Color del badge
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color_badge}
                  onChange={(e) => setForm((f) => ({ ...f, color_badge: e.target.value }))}
                  className="h-10 w-14 border border-[#E8DDD0] cursor-pointer p-0.5"
                />
                <span className="font-body text-sm text-[#8A7A6E] font-mono">
                  {form.color_badge}
                </span>
                {/* Preview del badge */}
                <span
                  className="text-white text-[9px] tracking-widest uppercase font-body px-3 py-1.5"
                  style={{ backgroundColor: form.color_badge }}
                >
                  {form.nombre || "Badge"}
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 justify-center">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.activo ? "translate-x-5" : ""}`}
                  />
                </div>
                <span className="font-body text-sm text-[#2C2420]">Activo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, mostrar_en_home: !f.mostrar_en_home }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.mostrar_en_home ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.mostrar_en_home ? "translate-x-5" : ""}`}
                  />
                </div>
                <span className="font-body text-sm text-[#2C2420]">Mostrar en home</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-4 py-2 border border-red-200">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2C2420] text-white font-body text-xs tracking-widest uppercase hover:bg-[#2C2420]/80 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={cancelForm}
              className="px-6 py-2.5 border border-[#E8DDD0] text-[#8A7A6E] font-body text-xs tracking-widest uppercase hover:border-[#2C2420] hover:text-[#2C2420] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de tags */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#8A7A6E] font-body text-sm">
          Cargando tags...
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Tag className="h-12 w-12 text-[#E8DDD0]" strokeWidth={1} />
          <p className="font-body text-sm text-[#8A7A6E]">No hay tags creados aún.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag, idx) => (
            <div
              key={tag.id}
              className="flex items-center gap-4 bg-white border border-[#E8DDD0] px-5 py-4 hover:border-[#C4956A]/40 transition-colors"
            >
              {/* Reordenar */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => mover(tag, "up")}
                  disabled={idx === 0}
                  className="text-[#C8BDB6] hover:text-[#2C2420] disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => mover(tag, "down")}
                  disabled={idx === tags.length - 1}
                  className="text-[#C8BDB6] hover:text-[#2C2420] disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Badge preview */}
              <span
                className="flex-shrink-0 text-white text-[9px] tracking-widest uppercase font-body px-3 py-1.5 leading-none"
                style={{ backgroundColor: tag.color_badge }}
              >
                {tag.nombre}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body text-sm font-medium text-[#2C2420]">{tag.nombre}</p>
                  <code className="font-mono text-[10px] bg-[#F5EFE6] px-2 py-0.5 text-[#8A7A6E]">
                    {tag.clave}
                  </code>
                </div>
                {tag.descripcion && (
                  <p className="font-body text-xs text-[#8A7A6E] mt-0.5 truncate">
                    {tag.descripcion}
                  </p>
                )}
              </div>

              {/* Toggles compactos */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => toggleHome(tag)}
                  className={`font-body text-[10px] tracking-widest uppercase px-3 py-1 border transition-colors ${
                    tag.mostrar_en_home
                      ? "border-[#C4956A] text-[#C4956A]"
                      : "border-[#E8DDD0] text-[#C8BDB6]"
                  }`}
                >
                  {tag.mostrar_en_home ? "En home ✓" : "En home"}
                </button>

                <button
                  onClick={() => toggleActivo(tag)}
                  className={`relative w-9 h-4.5 rounded-full transition-colors flex-shrink-0 ${
                    tag.activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"
                  }`}
                  style={{ height: "18px", width: "36px" }}
                  aria-label={tag.activo ? "Desactivar" : "Activar"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                      tag.activo ? "translate-x-[18px]" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit(tag)}
                  className="p-2 text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                  <button
                    onClick={() => setDeleteConfirm(tag.id)}
                    className="p-2 text-[#8A7A6E] hover:text-red-500 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white border border-[#E8DDD0] p-8 max-w-sm w-full space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display italic text-xl text-[#2C2420]">¿Eliminar tag?</h3>
            <p className="font-body text-sm text-[#8A7A6E] leading-relaxed">
              Esta acción no se puede deshacer. Los productos que tengan este tag no se verán
              afectados, solo dejará de mostrarse la sección en el home.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 text-white font-body text-xs tracking-widest uppercase hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[#E8DDD0] text-[#8A7A6E] font-body text-xs tracking-widest uppercase hover:border-[#2C2420] hover:text-[#2C2420] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
