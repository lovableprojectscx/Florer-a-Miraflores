import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { Camera, MapPin, Heart, Sparkles, Filter, ChevronDown, Check } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { RecuerdoCard } from "@/components/RecuerdoCard";
import { getRecuerdosPublicos, getCategorias, getDistritos, getConfig } from "@/lib/queries";
import { useVerMas } from "@/hooks/use-ver-mas";
import type { RecuerdoRow, CategoriaRow, DistritoRow } from "@/types/database";

export const Route = createFileRoute("/recuerdos")({
  loader: async () => {
    const [recuerdos, categorias, distritos, config] = await Promise.all([
      getRecuerdosPublicos().catch(() => [] as RecuerdoRow[]),
      getCategorias().catch(() => [] as CategoriaRow[]),
      getDistritos().catch(() => [] as DistritoRow[]),
      getConfig().catch(() => null),
    ]);
    return { recuerdos, categorias, distritos, config };
  },
  head: () => ({
    meta: [
      { title: "Mural de Recuerdos de Entrega en Lima | Florería Miraflores" },
      {
        name: "description",
        content:
          "Explora momentos reales y sonrisas de clientes con nuestras entregas de flores en Miraflores, San Isidro, Surco y Lima Metropolitana. Fotos auténticas de cada ocasión.",
      },
      {
        property: "og:title",
        content: "Mural de Recuerdos de Entrega | Florería Miraflores",
      },
      {
        property: "og:description",
        content:
          "Fotografías auténticas de entregas y momentos especiales en Lima. Cada arreglo floral cuenta una historia.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RecuerdosLayoutOrIndex,
});

function RecuerdosLayoutOrIndex() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/recuerdos/$slug");

  if (hasChild) {
    return <Outlet />;
  }

  return <RecuerdosIndexPage />;
}

function RecuerdosIndexPage() {
  const { recuerdos, categorias, distritos, config } = Route.useLoaderData();

  // Obtener subcategorías de ocasión
  const ocasionPadre = categorias.find((c: CategoriaRow) => c.slug === "ocasion");
  const ocasiones = useMemo(() => {
    if (!ocasionPadre) return [];
    return categorias.filter((c: CategoriaRow) => c.parent_id === ocasionPadre.id);
  }, [categorias, ocasionPadre]);

  // Estados de filtros
  const [selectedOcasion, setSelectedOcasion] = useState<string>("todas");
  const [selectedDistrito, setSelectedDistrito] = useState<string>("todos");

  // Filtrado reactivo en cliente
  const recuerdosFiltrados = useMemo(() => {
    return recuerdos.filter((r: RecuerdoRow) => {
      const matchOcasion =
        selectedOcasion === "todas" || r.categoria_relacionada_id === selectedOcasion;
      const matchDistrito = selectedDistrito === "todos" || r.distrito_id === selectedDistrito;
      return matchOcasion && matchDistrito;
    });
  }, [recuerdos, selectedOcasion, selectedDistrito]);

  // Paginación progresiva con useVerMas
  const { visibles, total, mostrando, hayMas, verMas } = useVerMas<RecuerdoRow>(
    recuerdosFiltrados,
    12,
  );

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-4 md:pt-6 pb-20">
        {/* Ruta + Eyebrow */}
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-2 md:mb-3"
        >
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span aria-hidden className="text-[#8A7A6E]/60">
            /
          </span>
          <span className="text-[#2C2420]">Mural de Recuerdos</span>
          <span className="text-rose-accent font-italic-serif lowercase tracking-normal text-xs md:text-sm">
            — entregas reales en Lima
          </span>
        </nav>

        {/* Encabezado Editorial */}
        <header className="mb-8 md:mb-10 border-b border-[#E8DDD0]/70 pb-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-body tracking-wider uppercase bg-[#FAF8F5] text-rose-accent border border-[#E8DDD0] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Historias y Sonrisas Reales
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#2C2420] leading-tight">
                Mural de Recuerdos
              </h1>
              <p className="mt-2 font-body font-light text-xs sm:text-sm text-[#8A7A6E] max-w-2xl leading-relaxed">
                Fotografías auténticas de nuestros arreglos florales entregados en momentos
                especiales. Cada sorpresa en Lima cuenta una historia de amor, gratitud y alegría.
              </p>
            </div>

            {/* Contador de momentos */}
            <div className="text-right">
              <span className="font-display text-2xl md:text-3xl text-[#2C2420]">
                {recuerdosFiltrados.length}
              </span>
              <span className="block text-[11px] font-body tracking-wider uppercase text-[#8A7A6E]">
                {recuerdosFiltrados.length === 1 ? "Recuerdo mostrado" : "Recuerdos mostrados"}
              </span>
            </div>
          </div>
        </header>

        {/* Si no hay ningún recuerdo publicado */}
        {recuerdos.length === 0 ? (
          <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E8DDD0] p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#C4956A] mx-auto mb-4">
              <Camera className="w-8 h-8 stroke-[1.2]" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] mb-2">
              Pronto compartiremos nuestras entregas
            </h2>
            <p className="font-body font-light text-xs sm:text-sm text-[#8A7A6E] max-w-md mx-auto">
              Estamos preparando fotografías de nuestras entregas y arreglos florales especiales en
              Lima.
            </p>
          </div>
        ) : (
          <>
            {/* Barra de Filtros Interactivos */}
            <div className="mb-8 p-4 rounded-xl bg-[#FFFFFF] border border-[#E8DDD0] shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Filtro por Ocasión (Pills) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  <span className="text-xs font-body font-medium uppercase tracking-wider text-[#8A7A6E] flex items-center gap-1 shrink-0 mr-1">
                    <Filter className="w-3 h-3 text-[#C4956A]" /> Ocasión:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOcasion("todas")}
                    className={`px-3 py-1.5 rounded-full text-xs font-body tracking-wide transition-all shrink-0 ${
                      selectedOcasion === "todas"
                        ? "bg-[#2C2420] text-white shadow-xs"
                        : "bg-[#FAF8F5] text-[#5C5046] hover:bg-[#E8DDD0]/50"
                    }`}
                  >
                    Todas
                  </button>
                  {ocasiones.map((oc: CategoriaRow) => (
                    <button
                      key={oc.id}
                      type="button"
                      onClick={() => setSelectedOcasion(oc.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-body tracking-wide transition-all shrink-0 ${
                        selectedOcasion === oc.id
                          ? "bg-rose-accent text-white shadow-xs"
                          : "bg-[#FAF8F5] text-[#5C5046] hover:bg-[#E8DDD0]/50"
                      }`}
                    >
                      {oc.nombre}
                    </button>
                  ))}
                </div>

                {/* Filtro por Distrito */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-body font-medium uppercase tracking-wider text-[#8A7A6E] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C4956A]" /> Distrito:
                  </span>
                  <select
                    aria-label="Filtrar por distrito"
                    value={selectedDistrito}
                    onChange={(e) => setSelectedDistrito(e.target.value)}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DDD0] rounded-lg text-xs font-body text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-rose-accent"
                  >
                    <option value="todos">Todos los distritos</option>
                    {distritos.map((d: DistritoRow) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grilla Tipo Collage / Polaroid de Recuerdos */}
            {recuerdosFiltrados.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-7">
                  {visibles.map((recuerdo: RecuerdoRow) => (
                    <RecuerdoCard
                      key={recuerdo.id}
                      recuerdo={recuerdo}
                      categorias={categorias}
                      distritos={distritos}
                    />
                  ))}
                </div>

                {/* Paginación progresiva */}
                {total > 12 && (
                  <div className="mt-12 text-center space-y-3">
                    <p className="text-xs font-body font-light text-[#8A7A6E]">
                      Mostrando {mostrando} de {total} recuerdos
                    </p>
                    {hayMas && (
                      <button
                        type="button"
                        onClick={verMas}
                        className="inline-flex items-center justify-center px-8 py-3.5 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body uppercase tracking-widest rounded-md transition-colors shadow-sm"
                      >
                        Ver más recuerdos
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E8DDD0] p-8 max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#C4956A] mx-auto mb-4">
                  <Camera className="w-8 h-8 stroke-[1.2]" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] mb-2">
                  No hay recuerdos con estos filtros
                </h2>
                <p className="font-body font-light text-xs sm:text-sm text-[#8A7A6E] mb-6 max-w-md mx-auto">
                  Prueba cambiando la ocasión o el distrito seleccionado para descubrir más momentos
                  de entrega.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOcasion("todas");
                    setSelectedDistrito("todos");
                  }}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-[#2C2420] text-white text-xs font-body uppercase tracking-widest rounded hover:bg-[#1A1A1A] transition-colors"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer config={config} />
      {config && <WhatsappFab config={config} />}
    </div>
  );
}
