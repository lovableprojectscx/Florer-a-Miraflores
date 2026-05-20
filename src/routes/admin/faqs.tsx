import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FaqRow } from "@/types/database";

export const Route = createFileRoute("/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs | Admin Floreria Miraflores" }] }),
  component: FaqsPage,
});

// --- Modal crear/editar ---

interface FaqModalProps {
  faq:       FaqRow | null;
  onClose:   () => void;
  onGuardar: (data: { pregunta: string; respuesta: string }) => Promise<void>;
}

function FaqModal({ faq, onClose, onGuardar }: FaqModalProps) {
  const [pregunta,  setPregunta]  = useState(faq?.pregunta  ?? "");
  const [respuesta, setRespuesta] = useState(faq?.respuesta ?? "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pregunta.trim())  { setError("La pregunta es obligatoria.");  return; }
    if (!respuesta.trim()) { setError("La respuesta es obligatoria."); return; }
    setSaving(true);
    setError(null);
    try {
      await onGuardar({ pregunta: pregunta.trim(), respuesta: respuesta.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0]">
          <p className="font-display text-lg text-[#2C2420]">{faq ? "Editar FAQ" : "Nueva FAQ"}</p>
          <button onClick={onClose} className="text-[#8A7A6E] hover:text-[#2C2420]"><X className="h-5 w-5" strokeWidth={1.5} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="font-body text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">Pregunta *</label>
            <input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              className="w-full h-10 px-3 border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
              placeholder="Ej: Hacen delivery el mismo dia?"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1.5">Respuesta *</label>
            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors resize-none"
              placeholder="Escribe la respuesta aqui..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-[#E8DDD0] font-body text-[11px] tracking-widest uppercase text-[#8A7A6E] hover:border-[#C4956A] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-10 bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
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

function FaqsPage() {
  const [faqs,    setFaqs]    = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState<FaqRow | null | "new">(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("faqs").select("*").order("orden", { ascending: true });
      if (err) throw new Error(err.message);
      setFaqs(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleToggle(faq: FaqRow) {
    const { error: err } = await supabase.from("faqs").update({ activo: !faq.activo }).eq("id", faq.id);
    if (err) { alert(err.message); return; }
    setFaqs((prev) => prev.map((f) => f.id === faq.id ? { ...f, activo: !faq.activo } : f));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta FAQ?")) return;
    const { error: err } = await supabase.from("faqs").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleMove(idx: number, dir: -1 | 1) {
    const other = idx + dir;
    if (other < 0 || other >= faqs.length) return;
    const a = faqs[idx];
    const b = faqs[other];
    await Promise.all([
      supabase.from("faqs").update({ orden: b.orden }).eq("id", a.id),
      supabase.from("faqs").update({ orden: a.orden }).eq("id", b.id),
    ]);
    const next = [...faqs];
    next[idx]   = { ...a, orden: b.orden };
    next[other] = { ...b, orden: a.orden };
    next.sort((x, y) => x.orden - y.orden);
    setFaqs(next);
  }

  async function handleGuardar(data: { pregunta: string; respuesta: string }) {
    if (editing === "new") {
      const maxOrden = faqs.length > 0 ? Math.max(...faqs.map((f) => f.orden)) + 1 : 0;
      const { error: err } = await supabase.from("faqs").insert({ ...data, orden: maxOrden, activo: true });
      if (err) throw new Error(err.message);
    } else if (editing && typeof editing === "object") {
      const { error: err } = await supabase.from("faqs").update(data).eq("id", editing.id);
      if (err) throw new Error(err.message);
    }
    await cargar();
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Titulo */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-[#2C2420]">Preguntas Frecuentes</h1>
            <p className="font-body text-sm text-[#8A7A6E] mt-1">{faqs.length} pregunta{faqs.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="h-10 px-5 bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Nueva FAQ
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
            {error} <button onClick={cargar} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white border border-[#E8DDD0]">
          {loading ? (
            [1,2,3].map((n) => (
              <div key={n} className="border-b border-[#E8DDD0] px-5 py-4 animate-pulse">
                <div className="h-4 w-3/4 bg-[#F5EFE6] rounded mb-2" />
                <div className="h-3 w-full bg-[#F5EFE6] rounded" />
              </div>
            ))
          ) : faqs.length === 0 ? (
            <div className="px-5 py-12 text-center font-body text-sm text-[#8A7A6E]">No hay FAQs. Agrega la primera.</div>
          ) : (
            faqs.map((faq, idx) => (
              <div key={faq.id} className="border-b border-[#E8DDD0] last:border-0 px-5 py-4 flex items-start gap-4 hover:bg-[#FDFAF6] transition-colors">
                {/* Reordenar */}
                <div className="flex flex-col gap-0.5 pt-0.5 flex-shrink-0">
                  <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleMove(idx, 1)} disabled={idx === faqs.length - 1} className="text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-[#2C2420] mb-1 truncate">{faq.pregunta}</p>
                  <p className="font-body text-xs text-[#8A7A6E] line-clamp-2">{faq.respuesta}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(faq)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${faq.activo ? "bg-[#C4956A]" : "bg-[#E8DDD0]"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${faq.activo ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </button>
                  <button onClick={() => setEditing(faq)} className="text-[#8A7A6E] hover:text-[#C4956A] transition-colors">
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="text-[#8A7A6E] hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {editing !== null && (
        <FaqModal
          faq={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}
