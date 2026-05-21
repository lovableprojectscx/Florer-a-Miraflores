import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { DistritoRow } from "@/types/database";

export const Route = createFileRoute("/admin/distritos")({
  head: () => ({ meta: [{ title: "Distritos | Admin Florería Miraflores" }] }),
  component: DistritosPage,
});

// --- Constantes ---

interface FormState {
  nombre: string;
  precio_delivery: string;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  precio_delivery: "0.00",
  activo: true,
};

// --- Skeleton ---

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 w-44 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-24 bg-[#F5EFE6] rounded" />
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

interface DistritoFormProps {
  initial: FormState;
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  titulo: string;
}

function DistritoForm({ initial, saving, onClose, onSave, titulo }: DistritoFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) {
      errs.nombre = "El nombre del distrito es requerido.";
    }
    const precio = Number(form.precio_delivery);
    if (isNaN(precio) || precio < 0) {
      errs.precio_delivery = "El precio de delivery debe ser un número mayor o igual a 0.";
    }
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
      <div className="relative bg-white w-full max-w-sm p-6 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD0] mb-5">
          <h2 className="font-display text-xl text-[#2C2420]">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label
              htmlFor="nombre"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Nombre del distrito *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A6E]">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <input
                id="nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ej: Miraflores"
                className="w-full h-10 pl-9 pr-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>
            {errors.nombre && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Costo de Delivery */}
          <div>
            <label
              htmlFor="precio_delivery"
              className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5"
            >
              Costo de Delivery *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A6E] font-body text-xs font-semibold">
                S/
              </span>
              <input
                id="precio_delivery"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.precio_delivery}
                onChange={(e) => setField("precio_delivery", e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-9 pr-3 bg-[#FDFAF6] border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              />
            </div>
            {errors.precio_delivery && (
              <p className="mt-1 font-body text-xs text-red-500">{errors.precio_delivery}</p>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between pt-1">
            <label className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
              Habilitado para delivery
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
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E8DDD0]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-4 font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-50 text-white text-[11px] tracking-widest uppercase font-body font-medium transition-colors flex items-center gap-2"
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
      <div className="relative bg-white w-full max-w-xs p-5 shadow-xl">
        <h3 className="font-display text-lg text-[#2C2420] mb-2">¿Eliminar distrito?</h3>
        <p className="font-body text-xs text-[#8A7A6E] mb-5">
          Vas a eliminar <strong className="text-[#2C2420]">"{nombre}"</strong>. Los clientes ya no
          podrán elegir esta zona para sus pedidos. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="h-9 px-4 font-body text-[10px] tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white font-body text-[10px] tracking-widest uppercase transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Componente de página ---

function DistritosPage() {
  const [distritos, setDistritos] = useState<DistritoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando] = useState<DistritoRow | null>(null);
  const [eliminando, setEliminando] = useState<DistritoRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("distritos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setDistritos((data ?? []) as DistritoRow[]);
    } catch (err) {
      console.error("Error al cargar distritos:", err);
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
      const { error } = await supabase.from("distritos").insert({
        nombre: form.nombre.trim(),
        precio_delivery: Number(form.precio_delivery),
        activo: form.activo,
      });

      if (error) throw error;
      setShowCreate(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al registrar el distrito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: FormState) {
    if (!editando) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("distritos")
        .update({
          nombre: form.nombre.trim(),
          precio_delivery: Number(form.precio_delivery),
          activo: form.activo,
        })
        .eq("id", editando.id);

      if (error) throw error;
      setEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el distrito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eliminando) return;
    try {
      const { error } = await supabase.from("distritos").delete().eq("id", eliminando.id);
      if (error) throw error;

      setEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el distrito. Es posible que esté asociado a pedidos registrados.");
    }
  }

  async function handleToggleActivo(dist: DistritoRow) {
    setTogglingId(dist.id);
    try {
      const { error } = await supabase
        .from("distritos")
        .update({ activo: !dist.activo })
        .eq("id", dist.id);

      if (error) throw error;
      setDistritos((prev) => prev.map((d) => (d.id === dist.id ? { ...d, activo: !d.activo } : d)));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-8 md:p-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Admin</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Distritos y Delivery</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nuevo distrito
        </button>
      </div>

      {!loading && (
        <p className="font-body text-xs text-[#8A7A6E] mb-4">
          {distritos.length}{" "}
          {distritos.length === 1 ? "distrito registrado" : "distritos registrados"}
        </p>
      )}

      {/* Tabla */}
      <div className="hidden sm:block bg-white border border-[#E8DDD0] overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead>
            <tr className="border-b border-[#E8DDD0] bg-[#FDFAF6]">
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Nombre del distrito
              </th>
              <th className="px-4 py-3 text-left font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                Costo de Delivery
              </th>
              <th className="px-4 py-3 text-center font-body text-xs tracking-widest uppercase text-[#8A7A6E] w-36">
                Estado
              </th>
              <th className="px-4 py-3 text-right font-body text-xs tracking-widest uppercase text-[#8A7A6E] w-36">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : distritos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]">
                  No hay distritos configurados todavía.
                </td>
              </tr>
            ) : (
              distritos.map((dist) => (
                <tr
                  key={dist.id}
                  className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6]/50 transition-colors"
                >
                  {/* Nombre */}
                  <td className="px-4 py-4 font-body text-sm font-medium text-[#2C2420]">
                    {dist.nombre}
                  </td>

                  {/* Costo de Delivery */}
                  <td className="px-4 py-4 font-body text-sm text-[#2C2420]">
                    S/ {Number(dist.precio_delivery).toFixed(2)}
                  </td>

                  {/* Toggle Habilitado */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleActivo(dist)}
                      disabled={togglingId === dist.id}
                      className="transition-colors disabled:opacity-50"
                      title={dist.activo ? "Deshabilitar distrito" : "Habilitar distrito"}
                    >
                      {togglingId === dist.id ? (
                        <Loader2
                          className="h-6 w-6 text-[#C4956A] animate-spin mx-auto"
                          strokeWidth={1.5}
                        />
                      ) : dist.activo ? (
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
                        onClick={() => setEditando(dist)}
                        className="p-1.5 text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setEliminando(dist)}
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
      <div className="sm:hidden mt-4 space-y-4">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-[#E8DDD0] p-4 rounded animate-pulse space-y-2">
              <div className="h-4 bg-[#F5EFE6] rounded w-1/2" />
              <div className="h-3 bg-[#F5EFE6] rounded w-1/3" />
            </div>
          ))
        ) : distritos.length === 0 ? (
          <div className="bg-white border border-[#E8DDD0] p-8 text-center font-body text-sm text-[#8A7A6E] rounded-lg">
            No hay distritos configurados todavía.
          </div>
        ) : (
          distritos.map((dist) => (
            <div key={dist.id} className="bg-white border border-[#E8DDD0] p-4 rounded flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-body text-sm font-semibold text-[#2C2420]">
                    {dist.nombre}
                  </h3>
                  <p className="font-body text-xs text-[#8A7A6E] mt-1">
                    Costo: <span className="text-[#2C2420] font-medium">S/ {Number(dist.precio_delivery).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#F5EFE6] pt-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-body text-xs text-[#8A7A6E]">Habilitado:</span>
                  <button
                    onClick={() => handleToggleActivo(dist)}
                    disabled={togglingId === dist.id}
                    className="transition-colors disabled:opacity-50"
                  >
                    {togglingId === dist.id ? (
                      <Loader2 className="h-5 w-5 text-[#C4956A] animate-spin" strokeWidth={1.5} />
                    ) : dist.activo ? (
                      <ToggleRight className="h-6 w-6 text-[#C4956A]" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[#8A7A6E]" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditando(dist)}
                    className="flex items-center gap-1 px-2.5 py-1 border border-[#E8DDD0] hover:border-[#C4956A] font-body text-xs text-[#8A7A6E] hover:text-[#C4956A] transition-colors rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Editar
                  </button>
                  <button
                    onClick={() => setEliminando(dist)}
                    className="flex items-center gap-1 px-2.5 py-1 border border-red-100 hover:border-red-500 font-body text-xs text-red-400 hover:text-red-500 transition-colors rounded"
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
        <DistritoForm
          titulo="Nuevo distrito"
          initial={EMPTY_FORM}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {editando && (
        <DistritoForm
          titulo="Editar distrito"
          initial={{
            nombre: editando.nombre,
            precio_delivery: Number(editando.precio_delivery).toFixed(2),
            activo: editando.activo,
          }}
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
