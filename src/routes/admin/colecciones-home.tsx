import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  X, Loader2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { CategoriaRow } from "@/types/database";

export const Route = createFileRoute("/admin/colecciones-home")({
  head: () => ({ meta: [{ title: "Colecciones Home | Admin Floreria Miraflores" }] }),
  component: ColeccionesHomePage,
});

// --- Tipos ---

interface ColeccionRow {
  id:               string;
  categoria_id:     string | null;
  imagen_custom_url: string | null;
  orden:            number;
  activo:           boolean;
}

interface ColeccionConCategoria extends ColeccionRow {
  categoria_nombre: string;
  categoria_slug:   string;
}

// --- Helpers ---

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Skeleton ---

function RowSkeleton() {
  return (
    <>
      {[1, 2, 3].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-6 bg-[#F5EFE6] rounded" /></td>
          <td className="px-4 py-3"><div className="h-4 w-40 bg-[#F5EFE6] rounded" /></td>
          <td className="px-4 py-3"><div className="h-4 w-32 bg-[#F5EFE6] rounded" /></td>
          <td className="px-4 py-3"><div className="h-6 w-10 bg-[#F5EFE6] rounded-full" /></td>
          <td className="px-4 py-3"><div className="h-4 w-12 bg-[#F5EFE6] rounded" /></td>
        </tr>
      ))}
    </>
  );
}

// --- Modal agregar coleccion ---

interface AgregarModalProps {
  categorias:    CategoriaRow[];
  colExistentes: string[]; // categoria_ids ya usados
  onClose:       () => void;
  onSave:        (categoriaId: string) => Promise<void>;
}

function AgregarModal({ categorias, colExistentes, onClose, onSave }: AgregarModalProps) {
  const [categoriaId, setCategoriaId] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Solo mostrar categorias que no estan ya agregadas
  const disponibles = categorias.filter(
    (c) => c.activo && !colExistentes.includes(c.id)
  );

  async function handleSave() {
    if (!categoriaId) { setError("Selecciona una categoria."); return; }
    setSaving(true);
    try {
      await onSave(categoriaId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD0]">
          <h2 className="font-display text-2xl text-[#2C2420]">Agregar coleccion</h2>
          <button onClick={onClose} className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Categoria *
            </label>
            {disponibles.length === 0 ? (
              <p className="font-body text-sm text-[#8A7A6E]">Todas las categorias activas ya estan en el home.</p>
            ) : (
              <select
                value={categoriaId}
                onChange={(e) => { setCategoriaId(e.target.value); setError(null); }}
                className="w-full h-10 px-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              >
                <option value="">Seleccionar...</option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
            {error && <p className="mt-1 font-body text-xs text-red-500">{error}</p>}
          </div>
          <p className="font-body text-[10px] text-[#8A7A6E]">
            La coleccion usara la imagen de la categoria. Puedes agregar una imagen personalizada despues desde la tabla.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8DDD0]">
          <button onClick={onClose} disabled={saving} className="h-10 px-5 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || disponibles.length === 0}
            className="h-10 px-6 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-50 text-white text-[11px] tracking-widest uppercase font-body font-medium transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Agregar
          </button>
        </div>

      </div>
    </div>
  );
}

// --- Pagina principal ---

function ColeccionesHomePage() {
  const [colecciones, setColecciones] = useState<ColeccionConCategoria[]>([]);
  const [categorias,  setCategorias]  = useState<CategoriaRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [movingId,    setMovingId]    = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: cols }] = await Promise.all([
        supabase.from("categorias").select("*").order("nombre"),
        supabase
          .from("colecciones_home")
          .select("*, categoria:categorias(id, nombre, slug, imagen_url)")
          .order("orden", { ascending: true }),
      ]);

      const todasCats = (cats ?? []) as CategoriaRow[];
      setCategorias(todasCats);

      const catMap = new Map(todasCats.map((c) => [c.id, c]));
      const mapped: ColeccionConCategoria[] = ((cols ?? []) as ColeccionRow[]).map((col) => {
        const cat = col.categoria_id ? catMap.get(col.categoria_id) : undefined;
        return {
          ...col,
          categoria_nombre: cat?.nombre ?? "Sin categoria",
          categoria_slug:   cat?.slug   ?? "",
        };
      });
      setColecciones(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  async function handleAgregar(categoriaId: string) {
    const maxOrden = colecciones.length > 0
      ? Math.max(...colecciones.map((c) => c.orden)) + 1
      : 0;
    const { error } = await supabase.from("colecciones_home").insert({
      categoria_id:     categoriaId,
      imagen_custom_url: null,
      orden:            maxOrden,
      activo:           true,
    });
    if (error) throw new Error(error.message);
    setShowModal(false);
    await cargarDatos();
  }

  async function handleEliminar(id: string) {
    if (!confirm("Quitar esta coleccion del home?")) return;
    const { error } = await supabase.from("colecciones_home").delete().eq("id", id);
    if (error) { console.error(error); return; }
    await cargarDatos();
  }

  async function handleToggle(col: ColeccionConCategoria) {
    setTogglingId(col.id);
    try {
      const { error } = await supabase
        .from("colecciones_home")
        .update({ activo: !col.activo })
        .eq("id", col.id);
      if (error) throw error;
      setColecciones((prev) =>
        prev.map((c) => c.id === col.id ? { ...c, activo: !c.activo } : c)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleMover(idx: number, dir: "up" | "down") {
    const target  = colecciones[idx];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= colecciones.length) return;
    const swap = colecciones[swapIdx];

    setMovingId(target.id);
    try {
      await Promise.all([
        supabase.from("colecciones_home").update({ orden: swap.orden }).eq("id", target.id),
        supabase.from("colecciones_home").update({ orden: target.orden }).eq("id", swap.id),
      ]);
      await cargarDatos();
    } catch (err) {
      console.error(err);
    } finally {
      setMovingId(null);
    }
  }

  const catIdsUsados = colecciones.map((c) => c.categoria_id ?? "");

  return (
    <div className="p-8 md:p-10">

      {/* Encabezado */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Colecciones Home</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Agregar coleccion
        </button>
      </div>

      <p className="font-body text-xs text-[#8A7A6E] mb-6">
        Estas son las colecciones que aparecen en la seccion de categorias destacadas del home. El orden aqui es el orden que ve el cliente.
      </p>

      {/* Tabla */}
      <div className="bg-white border border-[#E8DDD0] overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6]">
              <th className="px-4 py-3 text-left w-16">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">Orden</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">Categoria</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">Slug</span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">Activo</span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <RowSkeleton />
            ) : colecciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]">
                  No hay colecciones en el home. Agrega la primera con el boton de arriba.
                </td>
              </tr>
            ) : (
              colecciones.map((col, idx) => (
                <tr key={col.id} className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6] transition-colors">

                  {/* Orden */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMover(idx, "up")}
                        disabled={idx === 0 || movingId === col.id}
                        className="text-[#8A7A6E] hover:text-[#C4956A] disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleMover(idx, "down")}
                        disabled={idx === colecciones.length - 1 || movingId === col.id}
                        className="text-[#8A7A6E] hover:text-[#C4956A] disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>

                  {/* Nombre */}
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-[#2C2420] font-medium">{col.categoria_nombre}</p>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3">
                    <p className="font-body text-xs text-[#8A7A6E] font-mono">{col.categoria_slug || "-"}</p>
                  </td>

                  {/* Toggle activo */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(col)}
                      disabled={togglingId === col.id}
                      className="transition-colors disabled:opacity-50"
                      title={col.activo ? "Desactivar" : "Activar"}
                    >
                      {togglingId === col.id ? (
                        <Loader2 className="h-6 w-6 text-[#C4956A] animate-spin mx-auto" strokeWidth={1.5} />
                      ) : col.activo ? (
                        <ToggleRight className="h-6 w-6 text-[#C4956A]" strokeWidth={1.5} />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-[#8A7A6E]" strokeWidth={1.5} />
                      )}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleEliminar(col.id)}
                        className="p-1.5 text-[#8A7A6E] hover:text-red-500 transition-colors"
                        title="Quitar del home"
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

      {/* Modal */}
      {showModal && (
        <AgregarModal
          categorias={categorias}
          colExistentes={catIdsUsados}
          onClose={() => setShowModal(false)}
          onSave={handleAgregar}
        />
      )}

    </div>
  );
}
