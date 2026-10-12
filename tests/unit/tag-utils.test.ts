import { describe, expect, it } from "vitest";
import { resolverClavesTag, findTagByClave, getTagBadgeInfo } from "@/lib/tag-utils";
import type { TagRow } from "@/types/database";

const sampleTags: TagRow[] = [
  {
    id: "tag-1",
    clave: "novedad",
    nombre: "Nuevo",
    color_badge: "#C4848A",
    mostrar_en_home: true,
    orden: 1,
    activo: true,
    created_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "tag-2",
    clave: "globos_para_enamorar",
    nombre: "Globos para enamorar",
    color_badge: "#9E7347",
    mostrar_en_home: true,
    orden: 2,
    activo: true,
    created_at: "2026-10-01T00:00:00Z",
  },
];

describe("tag-utils", () => {
  describe("resolverClavesTag", () => {
    it("resuelve alias canónicos de globos", () => {
      expect(resolverClavesTag("globos")).toEqual([
        "globos_para_enamorar",
        "flores_y_globos_para_sorprender",
        "globos",
      ]);
      expect(resolverClavesTag("flores_y_globos_para_sorprender")).toContain(
        "globos_para_enamorar",
      );
    });

    it("incluye variantes de globos si la clave contiene 'globo'", () => {
      const res = resolverClavesTag("arreglo_con_globo_heliado");
      expect(res).toContain("globos_para_enamorar");
      expect(res).toContain("arreglo_con_globo_heliado");
    });

    it("devuelve la clave original en un array si no tiene alias", () => {
      expect(resolverClavesTag("novedad")).toEqual(["novedad"]);
    });
  });

  describe("findTagByClave", () => {
    it("encuentra tag por clave exacta", () => {
      expect(findTagByClave(sampleTags, "novedad")?.id).toBe("tag-1");
    });

    it("encuentra tag por alias histórico", () => {
      expect(findTagByClave(sampleTags, "flores_y_globos_para_sorprender")?.id).toBe("tag-2");
    });

    it("retorna undefined si tags o clave son null/undefined o inexistentes", () => {
      expect(findTagByClave(undefined, "novedad")).toBeUndefined();
      expect(findTagByClave(sampleTags, undefined)).toBeUndefined();
      expect(findTagByClave(sampleTags, "inexistente")).toBeUndefined();
    });
  });

  describe("getTagBadgeInfo", () => {
    it("devuelve label en mayúsculas y color del TagRow cuando existe", () => {
      const info = getTagBadgeInfo(sampleTags, "novedad");
      expect(info).toEqual({
        label: "NUEVO",
        color: "#C4848A",
        tagObj: sampleTags[0],
      });
    });

    it("devuelve fallback con color oscuro cuando el tag no existe en la lista", () => {
      const info = getTagBadgeInfo(sampleTags, "edicion_limitada");
      expect(info).toEqual({
        label: "EDICION LIMITADA",
        color: "#2C2420",
        tagObj: undefined,
      });
    });

    it("devuelve null cuando rawTag es undefined, null o vacío", () => {
      expect(getTagBadgeInfo(sampleTags, undefined)).toBeNull();
      expect(getTagBadgeInfo(sampleTags, null)).toBeNull();
      expect(getTagBadgeInfo(sampleTags, "")).toBeNull();
    });
  });
});
