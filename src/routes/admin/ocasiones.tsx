import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Star,
  Cake,
  Heart,
  Gem,
  Flower2,
  GraduationCap,
  Briefcase,
  Baby,
  Gift,
  Sun,
  TreePine,
  Music,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { OcasionHomeRow, CategoriaRow } from "@/types/database";

export const Route = createFileRoute("/admin/ocasiones")({
  head: () => ({ meta: [{ title: "Ocasiones Home | Admin Floreria Miraflores" }] }),
  component: OcasionesPage,
});

// --- Iconos disponibles ---

const ICON_DETAILS = [
  { value: "Heart", label: "Amor / Corazón", Icon: Heart },
  { value: "Cake", label: "Cumpleaños / Torta", Icon: Cake },
  { value: "Gem", label: "Aniversario / Gema", Icon: Gem },
  { value: "Flower2", label: "Condolencias / Flor", Icon: Flower2 },
  { value: "GraduationCap", label: "Graduación / Logros", Icon: GraduationCap },
  { value: "Briefcase", label: "Corporativo / Maletín", Icon: Briefcase },
  { value: "Star", label: "Destacado / Estrella", Icon: Star },
  { value: "Baby", label: "Bebé / Nacimiento", Icon: Baby },
  { value: "Gift", label: "Regalo / Detalle", Icon: Gift },
  { value: "Sun", label: "Día / Sol", Icon: Sun },
  { value: "TreePine", label: "Navidad / Pino", Icon: TreePine },
  { value: "Music", label: "Música / Celebración", Icon: Music },
];

// --- Modal agregar ---

interface AgregarModalProps {
  categorias: CategoriaRow[];
  onClose: () => void;
  onGuardar: (data: {
    nombre: string;
    icono: string;
    categoria_id: string | null;
  }) => Promise<void>;
}

function AgregarModal({ categorias, onClose, onGuardar }: AgregarModalProps) {
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("Heart");
  const [catId, setCatId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onGuardar({ nombre: nombre.trim(), icono, categoria_id: catId || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0]">
          <p className="font-display text-lg text-[#2C2420]">Nueva ocasion</p>
          <button onClick={onClose} className="text-[#8A7A6E] hover:text-[#2C2420]">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="font-body text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Nombre *
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-10 px-3 border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              placeholder="Ej: Cumpleanos"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Ícono
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <select
                  value={icono}
                  onChange={(e) => setIcono(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors appearance-none bg-white"
                >
                  {ICON_DETAILS.map((ic) => (
                    <option key={ic.value} value={ic.value}>
                      {ic.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#8A7A6E]">
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              {(() => {
                const IconComp = ICON_DETAILS.find((i) => i.value === icono)?.Icon ?? Star;
                return (
                  <div className="flex items-center justify-center h-10 w-10 border border-[#E8DDD0] bg-[#FDFAF6] text-[#2C2420] shrink-0">
                    <IconComp className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">
              Categoria vinculada
            </label>
            <div className="relative">
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full h-10 pl-3 pr-8 border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors appearance-none bg-white"
              >
                <option value="">Sin categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#E8DDD0] font-body text-[11px] tracking-widest uppercase text-[#8A7A6E] hover:border-[#C4956A] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Pagina principal ---

function OcasionesPage() {
  const [ocasiones, setOcasiones] = useState<OcasionHomeRow[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ocRes, catRes] = await Promise.all([
        supabase.from("ocasiones_home").select("*").order("orden", { ascending: true }),
        supabase.from("categorias").select("*").eq("activo", true).order("nombre"),
      ]);
      if (ocRes.error) throw new Error(ocRes.error.message);
      if (catRes.error) throw new Error(catRes.error.message);
      setOcasiones(ocRes.data ?? []);
      setCategorias(catRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleToggle(oc: OcasionHomeRow) {
    const { error: err } = await supabase
      .from("ocasiones_home")
      .update({ activo: !oc.activo })
      .eq("id", oc.id);
    if (err) {
      alert(err.message);
      return;
    }
    setOcasiones((prev) => prev.map((o) => (o.id === oc.id ? { ...o, activo: !oc.activo } : o)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta ocasion?")) return;
    const { error: err } = await supabase.from("ocasiones_home").delete().eq("id", id);
    if (err) {
      alert(err.message);
      return;
    }
    setOcasiones((prev) => prev.filter((o) => o.id !== id));
  }

  async function handleMove(idx: number, dir: -1 | 1) {
    const other = idx + dir;
    if (other < 0 || other >= ocasiones.length) return;
    const a = ocasiones[idx];
    const b = ocasiones[other];
    const [resA, resB] = await Promise.all([
      supabase.from("ocasiones_home").update({ orden: b.orden }).eq("id", a.id),
      supabase.from("ocasiones_home").update({ orden: a.orden }).eq("id", b.id),
    ]);
    if (resA.error || resB.error) {
      alert("Error al reordenar");
      return;
    }
    const next = [...ocasiones];
    next[idx] = { ...a, orden: b.orden };
    next[other] = { ...b, orden: a.orden };
    next.sort((x, y) => x.orden - y.orden);
    setOcasiones(next);
  }

  async function handleAgregar(data: {
    nombre: string;
    icono: string;
    categoria_id: string | null;
  }) {
    const maxOrden = ocasiones.length > 0 ? Math.max(...ocasiones.map((o) => o.orden)) + 1 : 0;
    const { error: err } = await supabase.from("ocasiones_home").insert({
      nombre: data.nombre,
      icono: data.icono,
      categoria_id: data.categoria_id,
      orden: maxOrden,
      activo: true,
    });
    if (err) throw new Error(err.message);
    await cargar();
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Titulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-[#2C2420]">Ocasiones Home</h1>
            <p className="font-body text-sm text-[#8A7A6E] mt-1">
              {ocasiones.length} ocasion{ocasiones.length !== 1 ? "es" : ""}
            </p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="h-10 px-5 bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Agregar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
            {error}{" "}
            <button onClick={cargar} className="ml-2 underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="hidden sm:block bg-white border border-[#E8DDD0] overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E8DDD0] bg-[#F5EFE6]">
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Orden
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Icono
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Activo
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Eliminar
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 bg-[#F5EFE6] rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 bg-[#F5EFE6] rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 bg-[#F5EFE6] rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-10 bg-[#F5EFE6] rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-6 bg-[#F5EFE6] rounded" />
                    </td>
                  </tr>
                ))
              ) : ocasiones.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center font-body text-sm text-[#8A7A6E]"
                  >
                    No hay ocasiones. Agrega una.
                  </td>
                </tr>
              ) : (
                ocasiones.map((oc, idx) => (
                  <tr
                    key={oc.id}
                    className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === ocasiones.length - 1}
                          className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420]">{oc.nombre}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const detail = ICON_DETAILS.find((i) => i.value === oc.icono);
                        const IconComp = detail?.Icon ?? Star;
                        const label = detail ? detail.label.split(" / ")[0] : (oc.icono ?? "-");
                        return (
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4 text-[#C4956A]" strokeWidth={1.5} />
                            <span className="font-body text-sm text-[#2C2420]">{label}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(oc)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${oc.activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${oc.activo ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(oc.id)}
                        className="text-[#8A7A6E] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Tarjetas) */}
        <div className="sm:hidden mt-4 space-y-4">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#E8DDD0] p-4 rounded-lg animate-pulse space-y-2">
                <div className="h-4 bg-[#F5EFE6] rounded w-1/2" />
                <div className="h-3 bg-[#F5EFE6] rounded w-1/3" />
              </div>
            ))
          ) : ocasiones.length === 0 ? (
            <div className="bg-white border border-[#E8DDD0] p-8 text-center font-body text-sm text-[#8A7A6E] rounded-lg">
              No hay ocasiones. Agrega una.
            </div>
          ) : (
            ocasiones.map((oc, idx) => {
              const detail = ICON_DETAILS.find((i) => i.value === oc.icono);
              const IconComp = detail?.Icon ?? Star;
              const label = detail ? detail.label.split(" / ")[0] : (oc.icono ?? "-");

              return (
                <div key={oc.id} className="bg-white border border-[#E8DDD0] p-4 rounded flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-[#FDFAF6] border border-[#E8DDD0] text-[#C4956A]">
                        <IconComp className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-body text-sm font-semibold text-[#2C2420]">
                          {oc.nombre}
                        </h3>
                        <p className="font-body text-xs text-[#8A7A6E] mt-0.5">
                          Icono: {label}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#F5EFE6] pt-3 mt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {/* Orden */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === ocasiones.length - 1}
                          className="p-1 border border-[#E8DDD0] hover:border-[#C4956A] hover:bg-white text-[#8A7A6E] disabled:opacity-30 disabled:hover:border-[#E8DDD0] transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Activo Toggle */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-body text-xs text-[#8A7A6E]">Activo:</span>
                        <button
                          onClick={() => handleToggle(oc)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${oc.activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${oc.activo ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(oc.id)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-red-100 hover:border-red-500 font-body text-xs text-red-400 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modal && (
        <AgregarModal
          categorias={categorias}
          onClose={() => setModal(false)}
          onGuardar={handleAgregar}
        />
      )}
    </div>
  );
}
