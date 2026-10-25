import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 13 Grupos con sus reglas de negocio y catálogo florístico ───────────────

const GROUPS_CONFIG = [
  {
    folder: "02_Fotos_Con_Fondo_Prompt_4K",
    prefix: "amor",
    categoria_id: "2978fbd0-defa-4a07-94db-8dfc1070ab94", // amor-aniversario
    categoria_slug: "amor-aniversario",
    basePriceMin: 125,
    basePriceMax: 235,
    names: [
      "Ramo Pasión Carmesí",
      "Box Corazón Enamorado",
      "Bouquet Romance Eterno",
      "Sinfonía de Rosas Rojas",
      "Amor Infinito Deluxe",
      "Bouquet Pasión Escarlata",
      "Arreglo Nupcial Rosa Reina",
      "Ramo Cautivador de Rosas",
      "Box Terciopelo Amor Verdadero",
      "Bouquet Ensueño Romántico",
      "Rosas Rojas Selección Miraflores",
      "Bouquet Promesa de Amor",
      "Ramo Imperial Carmesí",
      "Box Corazón & Rosas Premium",
      "Bouquet Idilio Romántico",
      "Ramo Pasión Profunda",
      "Arreglo Amor Sin Fin",
      "Bouquet Suspiros de Amor",
      "Rosas Escarlata & Follaje Fino",
      "Box Elegancia Romántica",
      "Bouquet Destello de Pasión",
      "Ramo Rosa Sublime",
      "Arreglo Pasión & Poesía",
      "Bouquet Enamorados Deluxe",
      "Ramo Rosas de Terciopelo",
      "Box Amor Puro & Rosas",
      "Bouquet Caricia Floral",
      "Ramo Ilusión Romántica",
      "Bouquet Rosas Majestuosas",
      "Arreglo Pasión Eterna",
    ],
    descriptions: [
      "Fina composición de rosas rojas de exportación acompañadas de eucalipto aromático y envoltura artesanal. Dedicatoria incluida.",
      "Espectacular presentación romántica diseñada para transmitir amor profundo y celebrar fechas inolvidables.",
      "Bouquet clásico y apasionado con flores frescas seleccionadas a mano una a una para máxima durabilidad y fragancia.",
    ],
  },
  {
    folder: "03_Fotos_Paquete_2_4K",
    prefix: "cumple",
    categoria_id: "52eba7b8-c70e-42dd-a7ea-c5ed80a360f6", // cumpleanos
    categoria_slug: "cumpleanos",
    basePriceMin: 100,
    basePriceMax: 195,
    names: [
      "Explosión Festiva de Color",
      "Bouquet Fiesta & Alegría",
      "Celebración Radiante",
      "Arreglo Felicidades Premium",
      "Sinfonía de Gerberas y Rosas",
      "Bouquet Deseos de Cumpleaños",
      "Ramo Alegría Primaveral",
      "Box Dulce Cumpleaños Festivo",
      "Arreglo Cumpleaños Multicolor",
      "Bouquet Fiesta Floral Miraflores",
      "Ramo Radiante Sorpresa",
      "Arreglo Jubiloso Celebración",
      "Bouquet Luces de Fiesta",
      "Box Cumpleaños Feliz Deluxe",
      "Arreglo Fantasía Floral",
      "Ramo Alegría & Vida",
      "Bouquet Champaña & Flores",
      "Arreglo Sonrisas & Rosas",
      "Bouquet Destellos Festivos",
      "Ramo Dulce Celebración",
      "Arreglo Fiesta & Brillo",
      "Bouquet Felicidad Compartida",
      "Ramo Colores de Vida",
      "Arreglo Cumpleaños de Ensueño",
      "Bouquet Fiesta Silvestre",
      "Ramo Sonrisas de Cumpleaños",
      "Arreglo Carnaval de Flores",
      "Bouquet Dulce Homenaje",
      "Ramo Ilusión & Sorpresa",
      "Arreglo Cumpleaños Espectacular",
      "Bouquet Regocijo Floral",
      "Ramo Brindis & Rosas",
      "Arreglo Día Especial",
      "Bouquet Celebración de Oro",
    ],
    descriptions: [
      "Vibrante combinación de flores multicolor llenas de vitalidad y frescura, perfecta para celebrar la vida en su día especial.",
      "Arreglo festivo cargado de energía positiva con rosas, gerberas y toques silvestres en empaque de regalo premium.",
      "Diseño dinámico y colorido que ilumina cualquier celebración de cumpleaños. Incluye tarjeta con dedicatoria personalizada.",
    ],
  },
  {
    folder: "CON FONDO HECHO 4K",
    prefix: "orquidea",
    categoria_id: "50c4251e-d651-40e7-a8b4-b77c0119156c", // orquideas
    categoria_slug: "orquideas",
    basePriceMin: 180,
    basePriceMax: 285,
    names: [
      "Orquídea Phalaenopsis Doble Vara Blanca",
      "Orquídea Púrpura Real en Cerámica",
      "Orquídea Imperial Cascada",
      "Orquídea Albina de Colección",
      "Orquídea Fucsia Sofisticada",
      "Orquídea Amarilla Sol Naciente",
      "Orquídea Marfil Elegancia Pura",
      "Orquídea Phalaenopsis Trío Deluxe",
      "Orquídea Veteada Exótica",
      "Orquídea Escultural en Base de Madera",
      "Orquídea Bicolor Serenidad",
      "Orquídea Real en Maceta Artesanal",
      "Orquídea Blanca Nobleza",
      "Orquídea Silvestre de Alta Gama",
      "Orquídea Zen Armonía",
    ],
    descriptions: [
      "Exclusiva orquídea Phalaenopsis viva en maceta decorativa de alta gama. Floración prolongada y elegancia atemporal para espacios refinados.",
      "Pieza botánica viva de primera categoría con varas florales de porte distinguido, ideal para regalos ejecutivos o decoración distinguida.",
      "Orquídea de colección cultivada en condiciones óptimas para garantizar múltiples flores abiertas y botones listos para florecer.",
    ],
  },
  {
    folder: "convert 4 4K",
    prefix: "boxlux",
    categoria_id: "ea7f7eeb-50e3-4656-b0f5-5672c182b559", // box-luxury
    categoria_slug: "box-luxury",
    basePriceMin: 155,
    basePriceMax: 260,
    names: [
      "Box Velvet Cilíndrico Negro",
      "Box Luxury Marfil & Rosas Pastel",
      "Sombrerera Rose Gold Exclusiva",
      "Box Terciopelo Rosa & Follaje",
      "Box Cilíndrico Carmesí Imperial",
      "Sombrerera Negra Rosas Rubí",
      "Box Cuadrado Blanco & Rosas Nude",
      "Box Luxury Nube de Algodón",
      "Sombrerera Esmeralda & Rosas",
      "Box Terciopelo Gris Glamour",
      "Box Cuadrado Negro Midnight",
      "Sombrerera Azul Real & Blancas",
      "Box Luxury Rosa Champagne",
      "Box Terciopelo Vino Tinto",
      "Sombrerera Pastel Sweet Dreams",
      "Box Cilíndrico Marfil & Hortensias",
      "Box Luxury Gold Edition",
      "Sombrerera Terciopelo Amatista",
      "Box Cuadrado Velvet Escarlata",
      "Box Luxury Perlas & Rosas",
      "Sombrerera Blanco Puro & Rosas",
      "Box Cilíndrico Zafiro",
      "Box Luxury Crema Imperial",
      "Sombrerera Terciopelo Borgoña",
      "Box Cuadrado Minimalista Blanco",
      "Box Luxury Menta & Rosas Rosa",
      "Sombrerera Bronce Clásica",
      "Box Terciopelo Antracita",
      "Box Luxury Lavanda & Rosas",
      "Sombrerera Coral Elegance",
      "Box Cilíndrico Rosa Quartz",
      "Box Luxury Terciopelo Jade",
      "Sombrerera Black Velvet Deluxe",
      "Box Luxury Diamante & Rosas",
    ],
    descriptions: [
      "Imponente presentación en sombrerera rígida aterciopelada con lazo de satén, repleta de rosas de primera selección y follajes exóticos.",
      "Diseño vanguardista de estilo europeo en caja cilíndrica de lujo. Una joya floral para ocasiones que demandan distinción absoluta.",
      "Arreglo en caja rígida premium reutilizable con espuma floral importada que asegura frescura continua durante días.",
    ],
  },
  {
    folder: "FOTOS_4K_EDITORIALES",
    prefix: "premium",
    categoria_id: "a7a4a6c0-784a-4415-818a-5921f04e57a7", // arreglos-premium
    categoria_slug: "arreglos-premium",
    basePriceMin: 220,
    basePriceMax: 360,
    names: [
      "Composición Editorial Alta Costura",
      "Escultura Floral Vanguardia",
      "Gran Arreglo Majestuoso Miraflores",
      "Sinfonía Floral Exótica Imperial",
      "Arreglo Escultural Palmeras & Rosas",
      "Composición Botánica Gran Gala",
      "Arquitectura Floral Renacimiento",
      "Gran Diseño Silvestre Contemporáneo",
      "Arreglo Magistral de Temporada",
      "Composición Monumental de Lujo",
      "Escultura Botánica Orquídeas & Rosas",
      "Gran Bodegón Floral Artístico",
      "Composición Editorial Blanco Sublime",
      "Arreglo Majestuoso Jardín Secreto",
      "Escultura Floral Pasión Real",
      "Composición Botánica Otoño Dorado",
      "Gran Arreglo Sinfónico Floral",
      "Diseño Floral Arquitectónico Miraflores",
      "Composición Floral Bellas Artes",
      "Gran Centro Escultural Exótico",
      "Arreglo Editorial Romance en París",
      "Composición Botánica Primavera Imperial",
      "Gran Diseño Floral Ilusión Andina",
      "Escultura Floral Aurora Boreal",
      "Composición Editorial Rosa Mística",
      "Arreglo Monumental Resplandor",
      "Gran Escultura Floral Magnolia",
      "Composición Botánica Jardines de Versalles",
      "Diseño Floral Épica Botánica",
      "Gran Arreglo Celestial",
      "Composición Editorial Seda & Flores",
      "Escultura Floral Élite Miraflores",
      "Gran Composición Selva Alta",
      "Arreglo Editorial Flores de Ensueño",
      "Composición Botánica Crepúsculo",
      "Gran Obra Maestra Floral",
    ],
    descriptions: [
      "Obra maestra del arte floral contemporáneo concebida para impresionar en eventos de gala, recepciones o aniversarios trascendentales.",
      "Composición de gran porte elaborada con flores exóticas, ramas escultóricas y follajes finos importados. Pura elegancia editorial.",
      "Diseño a gran escala que combina volumen, texturas y armonía cromática impecable. Ideal para espacios amplios y de alto perfil.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 1 4K",
    prefix: "ramo",
    categoria_id: "c98bd545-af26-4ff0-a5b3-08ffef4fa9cf", // ramos
    categoria_slug: "ramos",
    basePriceMin: 85,
    basePriceMax: 165,
    names: [
      "Bouquet Silvestre Andino",
      "Ramo Miraflores Clásico",
      "Bouquet Coreano Rosa Suave",
      "Ramo Armonía Campestre",
      "Bouquet Flores Frescas del Valle",
      "Ramo Sinfonía Silvestre",
      "Bouquet Romántico Papel Seda",
      "Ramo Gerberas & Margaritas",
      "Bouquet Follaje Eucalipto & Rosas",
      "Ramo Primavera Radiante",
      "Bouquet Delicadeza Floral",
      "Ramo Ilusión Pastel",
      "Bouquet Silvestre & Astromelias",
      "Ramo Cautivador de Temporada",
      "Bouquet Encanto Miraflores",
      "Ramo Frescura Matinal",
      "Bouquet Brisa Campestre",
      "Ramo Pétalos de Seda",
      "Bouquet Sueño Floral",
      "Ramo Tradición Miraflores",
      "Bouquet Campo de Flores",
      "Ramo Dulce Aromático",
      "Bouquet Romance Suave",
      "Ramo Vida & Color",
      "Bouquet Pastel Delicado",
      "Ramo Flores de la Huerta",
      "Bouquet Ilusión de Primavera",
      "Ramo Frescura y Luz",
      "Bouquet Jardín Silvestre",
      "Ramo Pureza Campestre",
      "Bouquet Encanto Bohemio",
      "Ramo Ternura Natural",
      "Bouquet Follaje & Rosas Nude",
      "Ramo Silvestre de Ensueño",
      "Bouquet Serenidad Floral",
      "Ramo Miraflores en Flor",
      "Bouquet Armonía de Temporada",
      "Ramo Suave Poesía",
      "Bouquet Alegría Silvestre",
      "Ramo Belleza Natural",
    ],
    descriptions: [
      "Bouquet de mano envuelto en exclusivo papel coreano impermeable con cintas textiles. Frescura floral garantizada del día.",
      "Combinación armónica de flores variadas y follaje silvestre seleccionadas frescas diariamente. Presentación impecable para regalo.",
      "Ramo clásico y versátil con envoltura multicapa que resalta la belleza natural de cada tallo floral.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 2 4K",
    prefix: "tulipan",
    splitCategories: [
      { id: "1036ab86-e9b0-4f2a-9aeb-ce658d1231ef", slug: "tulipanes-ramos", count: 20 },
      { id: "667e9006-5ac9-45e9-9ebf-13701f55f98e", slug: "tulipanes-arreglos", count: 20 },
    ],
    basePriceMin: 150,
    basePriceMax: 235,
    names: [
      "Bouquet Tulipanes Holandeses Amarillos",
      "Ramo Tulipanes Bicolor Fucsia",
      "Arreglo Tulipanes Violeta & Eucalipto",
      "Ramo Tulipanes Blancos de Ámsterdam",
      "Bouquet Tulipanes Rojos Puros",
      "Arreglo Tulipanes Naranja & Especies",
      "Ramo Tulipanes Rosa Pastel",
      "Arreglo Tulipanes en Base Cerámica",
      "Bouquet Tulipanes Morados Nobles",
      "Arreglo Tulipanes & Follaje Nórdico",
      "Ramo Tulipanes Holandeses Selección",
      "Arreglo Tulipanes Bicolor en Caja",
      "Bouquet Tulipanes Fucsia & Lazo",
      "Arreglo Tulipanes y Margaritas",
      "Ramo Tulipanes Amarillo Sol",
      "Arreglo Tulipanes Blanco Nupcial",
      "Bouquet Tulipanes Rojo Intenso",
      "Arreglo Tulipanes en Canasta Rústica",
      "Ramo Tulipanes Mezcla Holandesa",
      "Arreglo Tulipanes Primavera Europea",
      "Arreglo Tulipanes Elegancia en Base",
      "Bouquet Tulipanes Pasión Naranja",
      "Arreglo Tulipanes & Gypsophila",
      "Ramo Tulipanes Púrpura Imperial",
      "Arreglo Tulipanes Contemporáneo",
      "Bouquet Tulipanes y Lirios",
      "Arreglo Tulipanes en Sombrerera",
      "Ramo Tulipanes y Rosas Blancas",
      "Arreglo Tulipanes Bicolor Carmesí",
      "Bouquet Tulipanes Rosa Flamingo",
      "Arreglo Tulipanes Frescura Nórdica",
      "Ramo Tulipanes Coral & Crema",
      "Arreglo Tulipanes & Eucalipto Silver",
      "Bouquet Tulipanes Amarillo Dorado",
      "Arreglo Tulipanes Violeta Intenso",
      "Ramo Tulipanes de Exportación",
      "Arreglo Tulipanes en Madera Rústica",
      "Bouquet Tulipanes Rosa Vintage",
      "Arreglo Tulipanes Blanca Pureza",
      "Bouquet Tulipanes Multicolor Holanda",
    ],
    descriptions: [
      "Tulipanes importados de Holanda con tallos firmes y botones cerrados listos para abrir y durar en el hogar.",
      "Diseño sofisticado con tulipanes frescos de primera calidad, reconocidos por su elegancia arquitectónica y porte esbelto.",
      "Arreglo de tulipanes de temporada con envoltura especial coreana y follaje complementario que realza su vibrante color.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 3 4K",
    prefix: "girasol",
    categoria_id: "1415a57d-ebde-4353-8a9f-98d1cb14ce79", // girasoles
    categoria_slug: "girasoles",
    basePriceMin: 95,
    basePriceMax: 175,
    names: [
      "Bouquet Luz Solar de Girasoles",
      "Canasta Girasoles del Valle",
      "Arreglo Campestre Girasoles & Margaritas",
      "Ramo Resplandor Dorado",
      "Bouquet Girasoles & Rosas Rojas",
      "Arreglo Alegría Amarilla en Sombrerera",
      "Ramo Girasoles & Lavanda",
      "Bouquet Girasoles Silvestres Deluxe",
      "Arreglo Luz de Verano en Base",
      "Ramo Girasoles & Eucalipto",
      "Bouquet Girasoles y Follaje Verde",
      "Canasta Girasoles Andinos",
      "Ramo Girasoles Sonrisas",
      "Arreglo Girasoles & Astromelias",
      "Bouquet Sol Radiante",
      "Ramo Girasoles & Solidago",
      "Arreglo Campestre Girasoles & Flores",
      "Bouquet Girasoles Gigantes de Colección",
      "Ramo Girasoles & Lirios Amarillos",
      "Arreglo Girasoles & Mini Rosas",
      "Bouquet Amanecer Dorado",
      "Ramo Girasoles & Statice Morado",
      "Canasta Silvestre Girasoles",
      "Bouquet Girasoles Energía Pura",
      "Arreglo Girasoles en Caja de Madera",
      "Ramo Girasoles & Manzanilla",
      "Bouquet Girasoles de la Campiña",
      "Arreglo Girasoles & Claveles",
      "Ramo Girasoles Cautivadores",
      "Bouquet Girasoles & Gerberas",
      "Arreglo Girasoles Luz del Ande",
      "Ramo Girasoles y Follaje Ruscus",
      "Bouquet Girasoles & Follaje Coreano",
      "Arreglo Girasoles & Hortensia",
      "Ramo Girasoles Radiantes",
      "Bouquet Girasoles Iluminación",
      "Arreglo Girasoles del Huerto",
      "Ramo Girasoles & Limonium",
      "Bouquet Girasoles Vibrantes",
      "Arreglo Girasoles Siempre Sol",
    ],
    descriptions: [
      "Girasoles grandes y luminosos de cultivo seleccionado, combinados con follajes frescos para transmitir energía positiva y calidez.",
      "Arreglo campestre alegre y vivaz protagonizado por girasoles frescos que llenan de luz y optimismo cualquier ambiente.",
      "Bouquet de girasoles con empaque moderno impermeable y dedicatoria personalizada. El detalle perfecto para animar el día.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 4 4K",
    prefix: "boxchoc",
    categoria_id: "7d64b58f-b280-47be-ae99-e4104d868c41", // box-chocolates
    categoria_slug: "box-chocolates",
    basePriceMin: 130,
    basePriceMax: 215,
    names: [
      "Box Dulce Amor & Ferrero Rocher",
      "Caja Sorpresa Flores & Bombones Suizos",
      "Detalle Chocolate & Rosas Pastel",
      "Sweet Box Aniversario & Trufas",
      "Box Rosas Rojas & Bombones de Autor",
      "Caja Regalo Flores & Chocolates Finos",
      "Dúo Dulzura Rosas & Ferrero",
      "Box Sorpresa Enamorados Dulce Tentación",
      "Caja Velvet Flores & Delicias de Cacao",
      "Sweet Box Rosas Rosadas & Trufas",
      "Detalle Bombones & Gerberas",
      "Box Premium Rosas & Chocolates Artesanales",
      "Caja Romántica Flores & Selección Dulce",
      "Sweet Box Corazón & Chocolates",
      "Box Regalo Rosas & Trufas de Café",
      "Caja Delicia Floral & Bombones",
      "Sweet Box Rosas Champagne & Chocolates",
      "Detalle de Amor Flores & Ferrero",
      "Box Dulce Tentación Rosas & Cacao",
      "Caja Fiesta Flores & Chocolates",
      "Sweet Box Elegancia & Delicias",
      "Box Cumpleaños Flores & Bombones",
      "Caja Sorpresa Rosas & Trufas Belgas",
      "Sweet Box Dulce Romance",
      "Detalle Rosas Rojas & Bombones Finos",
      "Box Capricho Floral & Chocolates",
      "Caja Encanto Flores & Dulzuras",
      "Sweet Box Pasión & Chocolate",
      "Box Regalo Flores & Trufas de Licor",
      "Caja Amorosa Flores & Cacao Puro",
      "Sweet Box Rosas & Bombones Selectos",
      "Detalle Floristería & Delicatessen",
      "Box Ternura Rosas & Dulces",
      "Caja Sorpresa Aniversario & Chocolates",
      "Sweet Box Rosas Blancas & Bombones",
      "Detalle Especial Flores & Trufas",
      "Box Dulce Compañía Floral",
      "Caja Exclusiva Rosas & Chocolates Gourmet",
      "Sweet Box Ilusión Dulce",
      "Box Magistral Flores & Finas Trufas",
    ],
    descriptions: [
      "Exquisita combinación de flores frescas de alta floristería con fina selección de chocolates en elegante caja de regalo.",
      "El regalo completo ideal: caja artesanal con hermosas rosas frescas y bombones premium para conquistar corazones.",
      "Presentación de lujo que une aroma floral y placer gourmet en una experiencia inolvidable. Tarjeta incluida.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 5 4K",
    prefix: "defuncion",
    splitCategories: [
      { id: "e3f73ae6-9cbd-49f1-b9a8-b81244131fd5", slug: "coronas-funebres", count: 14 },
      { id: "4c777708-89be-43b6-86c8-3b22e533d1d5", slug: "cruces", count: 10 },
      { id: "581afa16-236f-47aa-b3aa-d0054ada8081", slug: "lagrima-pedestal", count: 8 },
      { id: "3044ac75-5545-4d0f-a636-e5b97248def4", slug: "lagrimas", count: 8 },
    ],
    basePriceMin: 190,
    basePriceMax: 390,
    names: [
      "Corona Fúnebre Solemne Paz",
      "Cruz Floral Redención Divina",
      "Lágrima con Pedestal Esperanza Eterna",
      "Corona Fúnebre Lirios & Rosas Blancas",
      "Cruz Fúnebre Pureza & Memoria",
      "Lágrima Fúnebre Descanso Eterno",
      "Corona Imperial Respeto y Condolencia",
      "Cruz Floral Luz en el Camino",
      "Lágrima con Pedestal Serenidad",
      "Corona Fúnebre Blanca Miraflores",
      "Cruz Fúnebre Rosas Blancas & Lirios",
      "Lágrima Fúnebre Amor Inmortal",
      "Corona de Respeto Paz Celestial",
      "Cruz Floral Consuelo Divino",
      "Lágrima con Pedestal Memoria Eterna",
      "Corona Solemne Flores Blancas",
      "Cruz Fúnebre Espiritualidad",
      "Lágrima Fúnebre Vuelo Celestial",
      "Corona Distinción en el Adiós",
      "Cruz Floral Redención Celestial",
      "Lágrima con Pedestal Adiós Querido",
      "Corona Memorial Flores de Honor",
      "Cruz Fúnebre Serenidad de Dios",
      "Lágrima Fúnebre Lágrimas de Paz",
      "Corona Fúnebre Rosa Blanca & Hiedra",
      "Cruz Floral Esperanza Inmortal",
      "Lágrima con Pedestal Nobleza",
      "Corona Memorial Silencio Eterno",
      "Cruz Fúnebre Paz en las Alturas",
      "Lágrima Fúnebre Plegaria",
      "Corona Fúnebre San Isidro",
      "Cruz Floral Pureza del Alma",
      "Lágrima con Pedestal Luz Perpetua",
      "Corona Solemne Despedida Blanca",
      "Cruz Fúnebre Piedad y Respeto",
      "Lágrima Fúnebre Despedida de Amor",
      "Corona Fúnebre Tradicional Miraflores",
      "Cruz Floral Memorial Elegante",
      "Lágrima con Pedestal Respeto Máximo",
      "Corona Fúnebre Resignación Cristiana",
    ],
    descriptions: [
      "Arreglo floral fúnebre elaborado con flores blancas de primera calidad (lirios, rosas y claveles) y cinta con texto de pésame impreso.",
      "Diseño solemne y respetuoso montado en estructura firme para velatorios y ceremonias de homenaje póstumo.",
      "Homenaje distinguido elaborado con flores frescas y follaje selecto para expresar consuelo y acompañamiento a los deudos.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 6 4K",
    prefix: "nacimiento",
    splitCategories: [
      { id: "7467e3d4-f3e3-4f97-83e1-e28e784813fc", slug: "nacimientos-nino", count: 20 },
      { id: "dbe956c5-61ad-4459-ac88-f74d25e4e347", slug: "nacimientos-nina", count: 20 },
    ],
    basePriceMin: 115,
    basePriceMax: 195,
    names: [
      "Bienvenido Pequeño Ángel Celeste",
      "Bienvenida Princesa Rosas Pastel",
      "Cunita Floral de Ensueño Celeste",
      "Nube de Ternura Baby Girl",
      "Arreglo Dulce Espera Niño",
      "Bouquet Ternura Nacimiento Niña",
      "Cesta Baby Boy Flores & Peluche",
      "Cesta Baby Girl Rosas & Algodón",
      "Arreglo Llegada del Bebé Celeste",
      "Arreglo Dulce Bienvenida Princesa",
      "Bouquet Pequeño Príncipe",
      "Bouquet Primera Sonrisa Niña",
      "Cesta Bienvenida Bebé en Celeste",
      "Cesta Bienvenida Bebé en Rosa",
      "Arreglo Nube Blanca & Toque Celeste",
      "Arreglo Nube Blanca & Toque Rosado",
      "Bouquet Baby Boy Miraflores",
      "Bouquet Baby Girl Miraflores",
      "Cesta Tierna Infancia Celeste",
      "Cesta Tierna Infancia Rosada",
      "Arreglo Cuna de Rosas Niño",
      "Arreglo Cuna de Rosas Niña",
      "Bouquet Alegría por el Nacimiento Niño",
      "Bouquet Alegría por el Nacimiento Niña",
      "Cesta Pastel Bienvenida Niño",
      "Cesta Pastel Bienvenida Niña",
      "Arreglo Cariño de Bebé Celeste",
      "Arreglo Cariño de Bebé Rosa",
      "Bouquet Dulce Milagro Niño",
      "Bouquet Dulce Milagro Niña",
      "Cesta Primer Amor Baby Boy",
      "Cesta Primer Amor Baby Girl",
      "Arreglo Encanto Infantil Celeste",
      "Arreglo Encanto Infantil Rosa",
      "Bouquet Vida Nueva Niño",
      "Bouquet Vida Nueva Niña",
      "Cesta Ternura sin Fin Celeste",
      "Cesta Ternura sin Fin Niña",
      "Arreglo Bienvenido a Casa Campeón",
      "Arreglo Bienvenida a Casa Princesa",
    ],
    descriptions: [
      "Tierno arreglo floral en tonos suaves concebido para celebrar el milagro de una nueva vida. Incluye tarjeta de felicitación.",
      "Delicada combinación de flores frescas en tonos pastel y detalles dulces para felicitar a los nuevos padres en clínicas u hogares.",
      "Composición de bienvenida al bebé presentada en base artesanal o canasta con cinta decorativa de nacimiento.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 7 4K",
    prefix: "deco",
    splitCategories: [
      { id: "84a7f0ed-d2ac-4648-862b-0be156d8c0f7", slug: "centros-de-mesa", count: 20 },
      { id: "b23a6449-c8ee-4ecc-8ff5-03171f2a67e9", slug: "floreros", count: 20 },
    ],
    basePriceMin: 110,
    basePriceMax: 215,
    names: [
      "Centro de Mesa Banquete Elegante",
      "Florero de Cristal Rosas & Gerberas",
      "Composición de Salón Frescura Natural",
      "Florero Cilíndrico Lirios & Eucalipto",
      "Centro de Mesa Rústico Campestre",
      "Florero Vintage Rosas Champagne",
      "Centro de Mesa Comedor Armonía",
      "Florero de Cristal Tallado & Tulipanes",
      "Centro de Mesa Vela & Rosas Blancas",
      "Florero Nórdico Flores Variadas",
      "Centro de Mesa Evento Distinguido",
      "Florero Minimalista Flores Exóticas",
      "Centro de Mesa Terraza Silvestre",
      "Florero Moderno Hortensias & Rosas",
      "Centro de Mesa Gala Dorada",
      "Florero Transparente Girasoles & Follaje",
      "Centro de Mesa Fiesta Familiar",
      "Florero de Cristal Fina Selección",
      "Centro de Mesa Buffet Floral",
      "Florero Escultural Rosas & Ramas",
      "Centro de Mesa Ilusión Natural",
      "Florero de Vidrio Soplado & Lirios",
      "Centro de Mesa Celebración Blanca",
      "Florero Clásico Rosas de Exportación",
      "Centro de Mesa Calidez Andina",
      "Florero Cilíndrico Gerberas Multicolor",
      "Centro de Mesa Bodegón Aromático",
      "Florero Elegance Flores Silvestres",
      "Centro de Mesa Jardín Interior",
      "Florero Campestre Eucalipto & Rosas",
      "Centro de Mesa Nupcial en Base Espejo",
      "Florero de Cristal Flores de Estación",
      "Centro de Mesa Tertulia Floral",
      "Florero Decó Rosas Púrpuras",
      "Centro de Mesa Frescura y Paz",
      "Florero Botánico Hojas & Flores",
      "Centro de Mesa Navidad & Fiestas",
      "Florero Reflejos de Cristal & Rosas",
      "Centro de Mesa Cena Romántica",
      "Florero Majestuoso para Recibidor",
    ],
    descriptions: [
      "Diseño floral decorativo concebido para embellecer mesas de comedor, salas de estar o buffets con porte y frescura inigualables.",
      "Arreglo floral listo para lucir presentado en florero de vidrio de primera línea, con flores frescas hidratadas y follaje fino.",
      "Composición de centro de mesa balanceada a 360 grados para que luzca radiante desde cualquier ángulo de la estancia.",
    ],
  },
  {
    folder: "tercer paquete de fotos/Grupo 8 4K",
    prefix: "ocasion",
    splitCategories: [
      { id: "dd8eb966-4ba2-4085-b909-6da4fc58c9ce", slug: "graduacion", count: 6 },
      { id: "9a4ec235-9fa8-42f2-9620-8de63e256b35", slug: "inauguracion", count: 5 },
      { id: "7d3faa5a-2094-4237-a2cd-7d46d8666450", slug: "para-el", count: 5 },
      { id: "7709a36a-fe12-4d5b-9038-33b66d3952ef", slug: "corporativo", count: 5 },
    ],
    basePriceMin: 135,
    basePriceMax: 265,
    names: [
      "Arreglo Triunfo & Graduación Cum Laude",
      "Bouquet Éxito Académico con Birrete",
      "Arreglo Felicitaciones Nuevo Profesional",
      "Bouquet Corona de Laureles & Rosas",
      "Arreglo Graduación Magistral",
      "Bouquet Meta Cumplida Deluxe",
      "Arreglo Presidencial Gran Inauguración",
      "Pedestal de Éxito Comercial Flores Vivas",
      "Composición Próspera Apertura de Negocio",
      "Arreglo Inauguración Corporativa",
      "Diseño Monumental Bienvenida al Éxito",
      "Diseño Vanguardia Elegancia Para Él",
      "Box Sobrio Caballero Rosas & Vino",
      "Arreglo Distinción Masculina en Base Oscura",
      "Bouquet Ejecutivo Tonos Tierra & Verde",
      "Box Para Él Selección Exclusiva",
      "Composición Ejecutiva Sala de Directorio",
      "Arreglo Recepción Corporativa Miraflores",
      "Centro Floral Empresarial de Gala",
      "Composición de Agradecimiento Corporativo",
      "Arreglo Institucional Flores de Alta Gama",
    ],
    descriptions: [
      "Diseño estilizado creado específicamente para homenajear logros profesionales, aperturas corporativas o agasajar con sobriedad.",
      "Composición floral estructurada con líneas limpias y colores selectos, ideal para despachos, eventos de empresa y felicitaciones.",
      "Presentación formal de alta gama acompañada de tarjeta con mensaje personalizado y dedicatoria empresarial.",
    ],
  },
];

// Helper para distribuir tags
function assignTags(index, total) {
  const tags = [];
  if (index % 5 === 0) tags.push("mas_vendido");
  if (index % 7 === 0) tags.push("novedad");
  if (index % 11 === 0) tags.push("oferta");
  if (index % 13 === 0) tags.push("edicion_limitada");
  return tags;
}

export async function generateManifest() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const manifest = [];
  let globalOrder = 11; // Los 10 base ya tienen 1-10

  for (const group of GROUPS_CONFIG) {
    const folderPath = resolve(process.cwd(), group.folder);
    const files = fs
      .readdirSync(folderPath)
      .filter((item) => {
        const full = path.join(folderPath, item);
        if (fs.statSync(full).isDirectory()) return false;
        if (item.startsWith("CATALOGO_VISUAL")) return false;
        const ext = path.extname(item).toLowerCase();
        return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
      })
      .sort();

    console.log(`Grupo ${group.folder}: ${files.length} archivos.`);

    let subIndex = 0;
    for (const file of files) {
      const name = group.names[subIndex] || `${group.prefix} Floral Miraflores ${subIndex + 1}`;
      const desc = group.descriptions[subIndex % group.descriptions.length];

      // Asignar categoría (si el grupo tiene split de categorías)
      let catId = group.categoria_id;
      let catSlug = group.categoria_slug;
      if (group.splitCategories) {
        let accumulated = 0;
        for (const split of group.splitCategories) {
          accumulated += split.count;
          if (subIndex < accumulated) {
            catId = split.id;
            catSlug = split.slug;
            break;
          }
        }
      }

      // Precio realista distribuido entre min y max redondeado a múltiplos de 5
      const priceRange = group.basePriceMax - group.basePriceMin;
      const step = priceRange / Math.max(1, files.length - 1);
      const rawPrice = group.basePriceMin + step * subIndex;
      const precio = Math.round(rawPrice / 5) * 5;

      const safeName = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const targetFileName = `prod-${String(globalOrder).padStart(3, "0")}-${safeName}.webp`;

      manifest.push({
        order: globalOrder,
        nombre: name,
        precio,
        descripcion: desc,
        categoria_id: catId,
        categoria_slug: catSlug,
        tags: assignTags(globalOrder, 450),
        sourcePath: path.join(group.folder, file),
        targetFileName,
        storageUrl: `https://hdudifvzlblmqgiepjgd.supabase.co/storage/v1/object/public/productos/${targetFileName}`,
      });

      globalOrder++;
      subIndex++;
    }
  }

  return manifest;
}

// Ejecutar generación si se llama directamente
const isMain = process.argv[1]?.endsWith("preparar-manifest-450.mjs");
if (isMain) {
  generateManifest()
    .then((items) => {
      const dataDir = resolve(process.cwd(), "scripts/data");
      mkdirSync(dataDir, { recursive: true });
      const targetFile = resolve(dataDir, "catalogo-450.json");
      writeFileSync(targetFile, JSON.stringify(items, null, 2), "utf-8");
      console.log(`\n Manifest generado con éxito en ${targetFile}!`);
      console.log(` Total de productos en manifiesto: ${items.length}`);
    })
    .catch(console.error);
}
