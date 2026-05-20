/**
 * Tipos TypeScript para todas las tablas de Supabase.
 * Refleja exactamente el schema definido en CLAUDE.md sección 11.
 *
 * Convención de nombres:
 *   - Row   → fila que viene de la BD (SELECT)
 *   - Insert → payload para INSERT
 *   - Update → payload para UPDATE (todos los campos opcionales)
 */

// ─── config ───────────────────────────────────────────────────────────────────

export interface ConfigRow {
  id:                         string;
  whatsapp:                   string | null;
  correo:                     string | null;
  horario:                    string | null;
  logo_url:                   string | null;
  anuncio_barra:              string | null;
  instagram_url:              string | null;
  tiktok_url:                 string | null;
  facebook_url:               string | null;
  libro_reclamaciones_activo: boolean;
}

export type ConfigInsert = Omit<ConfigRow, "id">;
export type ConfigUpdate = Partial<ConfigInsert>;

// ─── banners ──────────────────────────────────────────────────────────────────

export interface BannerRow {
  id:         string;
  imagen_url: string;
  titulo:     string | null;
  subtexto:   string | null;
  cta_texto:  string | null;
  cta_link:   string | null;
  orden:      number;
  activo:     boolean;
  created_at: string;
}

export type BannerInsert = Omit<BannerRow, "id" | "created_at">;
export type BannerUpdate = Partial<BannerInsert>;

// ─── popup ────────────────────────────────────────────────────────────────────

export interface PopupRow {
  id:               string;
  imagen_url:       string | null;
  texto:            string | null;
  activo:           boolean;
  fecha_expiracion: string | null; // date → string ISO
}

export type PopupInsert = Omit<PopupRow, "id">;
export type PopupUpdate = Partial<PopupInsert>;

// ─── categorias ───────────────────────────────────────────────────────────────

export interface CategoriaRow {
  id:         string;
  nombre:     string;
  slug:       string;
  imagen_url: string | null;
  parent_id:  string | null;
  orden:      number;
  activo:     boolean;
}

export type CategoriaInsert = Omit<CategoriaRow, "id">;
export type CategoriaUpdate = Partial<CategoriaInsert>;

/** Categoría con sus hijas anidadas (resultado de join manual) */
export interface CategoriaConHijas extends CategoriaRow {
  hijas: CategoriaRow[];
}

// ─── productos ────────────────────────────────────────────────────────────────

export type ProductoTag = "novedad" | "mas_vendido" | "edicion_limitada" | "oferta";

export interface ProductoRow {
  id:           string;
  nombre:       string;
  precio:       number;
  descripcion:  string | null;
  imagenes:     string[];
  categoria_id: string | null;
  tags:         ProductoTag[];
  activo:       boolean;
  orden:        number;
  created_at:   string;
}

export type ProductoInsert = Omit<ProductoRow, "id" | "created_at">;
export type ProductoUpdate = Partial<ProductoInsert>;

// ─── ocasiones_home ───────────────────────────────────────────────────────────

export interface OcasionHomeRow {
  id:           string;
  nombre:       string;
  icono:        string | null;
  categoria_id: string | null;
  orden:        number;
  activo:       boolean;
}

export type OcasionHomeInsert = Omit<OcasionHomeRow, "id">;
export type OcasionHomeUpdate = Partial<OcasionHomeInsert>;

// ─── colecciones_home ─────────────────────────────────────────────────────────

export interface ColeccionHomeRow {
  id:               string;
  categoria_id:     string | null;
  imagen_custom_url: string | null;
  orden:            number;
  activo:           boolean;
}

export type ColeccionHomeInsert = Omit<ColeccionHomeRow, "id">;
export type ColeccionHomeUpdate = Partial<ColeccionHomeInsert>;

/** Colección con el nombre y slug de la categoría asociada (join) */
export interface ColeccionConCategoria extends ColeccionHomeRow {
  categoria: Pick<CategoriaRow, "id" | "nombre" | "slug" | "imagen_url"> | null;
}

// ─── faqs ─────────────────────────────────────────────────────────────────────

export interface FaqRow {
  id:        string;
  pregunta:  string;
  respuesta: string;
  orden:     number;
  activo:    boolean;
}

export type FaqInsert = Omit<FaqRow, "id">;
export type FaqUpdate = Partial<FaqInsert>;

// ─── distritos ────────────────────────────────────────────────────────────────

export interface DistritoRow {
  id:              string;
  nombre:          string;
  precio_delivery: number;
  activo:          boolean;
}

export type DistritoInsert = Omit<DistritoRow, "id">;
export type DistritoUpdate = Partial<DistritoInsert>;

// ─── pedidos ──────────────────────────────────────────────────────────────────

export type EstadoPedido = "pendiente" | "pagado" | "en_camino" | "entregado" | "cancelado";

export interface PedidoProducto {
  id:       string;
  nombre:   string;
  precio:   number;
  cantidad: number;
  imagen:   string;
}

export interface PedidoRow {
  id:                 string;
  numero:             string | null;
  nombre_cliente:     string | null;
  telefono:           string | null;
  email:              string | null;
  distrito_id:        string | null;
  direccion:          string | null;
  referencia:         string | null;
  fecha_entrega:      string | null; // date → string ISO
  hora_entrega:       string | null;
  productos:          PedidoProducto[]; // jsonb
  subtotal:           number | null;
  delivery:           number | null;
  total:              number | null;
  estado:             EstadoPedido;
  izi_transaction_id: string | null;
  notas:              string | null;
  created_at:         string;
}

export type PedidoInsert = Omit<PedidoRow, "id" | "izi_transaction_id" | "created_at"> & {
  estado?: EstadoPedido;
};
export type PedidoUpdate = Partial<Pick<PedidoRow, "estado" | "izi_transaction_id" | "notas">>;

// --- Database (interfaz para el cliente tipado de Supabase) ---

export interface Database {
  public: {
    Tables: {
      config: {
        Row:           ConfigRow;
        Insert:        ConfigInsert;
        Update:        ConfigUpdate;
        Relationships: [];
      };
      banners: {
        Row:           BannerRow;
        Insert:        BannerInsert;
        Update:        BannerUpdate;
        Relationships: [];
      };
      popup: {
        Row:           PopupRow;
        Insert:        PopupInsert;
        Update:        PopupUpdate;
        Relationships: [];
      };
      categorias: {
        Row:           CategoriaRow;
        Insert:        CategoriaInsert;
        Update:        CategoriaUpdate;
        Relationships: [];
      };
      productos: {
        Row:           ProductoRow;
        Insert:        ProductoInsert;
        Update:        ProductoUpdate;
        Relationships: [];
      };
      ocasiones_home: {
        Row:           OcasionHomeRow;
        Insert:        OcasionHomeInsert;
        Update:        OcasionHomeUpdate;
        Relationships: [];
      };
      colecciones_home: {
        Row:           ColeccionHomeRow;
        Insert:        ColeccionHomeInsert;
        Update:        ColeccionHomeUpdate;
        Relationships: [];
      };
      faqs: {
        Row:           FaqRow;
        Insert:        FaqInsert;
        Update:        FaqUpdate;
        Relationships: [];
      };
      distritos: {
        Row:           DistritoRow;
        Insert:        DistritoInsert;
        Update:        DistritoUpdate;
        Relationships: [];
      };
      pedidos: {
        Row:           PedidoRow;
        Insert:        PedidoInsert;
        Update:        PedidoUpdate;
        Relationships: [];
      };
    };
    Views:     {};
    Functions: {};
    Enums:     {};
  };
}
