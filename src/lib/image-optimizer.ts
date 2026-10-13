import { supabase } from "@/lib/supabase";

/**
 * Convierte un archivo de imagen (jpg, jpeg, png, etc.) a formato WebP
 * utilizando el Canvas del navegador de forma cliente-side.
 * Mantiene una alta calidad visual pero reduce drásticamente el tamaño del archivo.
 *
 * @param file El archivo original (File)
 * @param quality Calidad del WebP resultante (de 0.0 a 1.0). Por defecto 0.88 para calidad premium.
 */
export async function convertToWebP(
  file: File,
  quality = 0.92,
  maxDimension = 2000,
): Promise<File> {
  // Si no es un formato de imagen estándar, retornamos el archivo tal cual
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          // Redimensionar si supera el límite especificado (manteniendo la relación de aspecto)
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.warn("No se pudo obtener el contexto 2D del Canvas, usando archivo original.");
            resolve(file);
            return;
          }

          // Dibujar la imagen original en el canvas con las nuevas dimensiones escaladas
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a WebP con calidad configurable (0.88 es excelente)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn("No se pudo generar el blob WebP, usando archivo original.");
                resolve(file);
                return;
              }

              // Crear el nuevo nombre del archivo reemplazando la extensión por .webp
              const originalName = file.name;
              const baseName =
                originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
              const newName = `${baseName}.webp`;

              const optimizedFile = new File([blob], newName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            "image/webp",
            quality,
          );
        } catch (error) {
          console.error("Error durante la conversión a WebP, usando original:", error);
          resolve(file); // Fallback al archivo original
        }
      };
      img.onerror = () => {
        console.warn("Error al cargar la imagen en memoria, usando original.");
        resolve(file);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      console.warn("Error al leer el archivo con FileReader, usando original.");
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Genera miniaturas WebP de 480px y 960px (calidad ~72) para un archivo de imagen en el navegador.
 */
export async function generarMiniaturasWebP(
  file: File,
): Promise<{ thumb480: File; thumb960: File }> {
  const [thumb480, thumb960] = await Promise.all([
    convertToWebP(file, 0.72, 480),
    convertToWebP(file, 0.72, 960),
  ]);
  return { thumb480, thumb960 };
}

/**
 * Sube una imagen y genera automáticamente sus miniaturas de 480w y 960w en el bucket correspondiente.
 */
export async function subirImagenConMiniaturas(
  file: File,
  bucket: string,
  maxDimension = 2000,
): Promise<string> {
  let finalFile = file;
  try {
    finalFile = await convertToWebP(file, 0.9, maxDimension);
  } catch (err) {
    console.error("Error al optimizar imagen a WebP:", err);
  }

  const ext = finalFile.name.split(".").pop() ?? "webp";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // 1. Subir imagen principal
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, finalFile, {
    cacheControl: "31536000",
    contentType: finalFile.type || "image/webp",
    upsert: false,
  });
  if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

  // 2. Generar y subir miniaturas 480 y 960 en paralelo
  try {
    const { thumb480, thumb960 } = await generarMiniaturasWebP(file);
    await Promise.allSettled([
      supabase.storage.from(bucket).upload(`thumbs/480/${path}`, thumb480, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: false,
      }),
      supabase.storage.from(bucket).upload(`thumbs/960/${path}`, thumb960, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: false,
      }),
    ]);
  } catch (err) {
    console.warn("No se pudieron subir miniaturas complementarias:", err);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Elimina la imagen original y sus miniaturas (480 y 960) de Supabase Storage.
 */
export async function eliminarImagenConMiniaturas(url: string, bucket: string): Promise<void> {
  try {
    const regex = new RegExp(
      `\\/storage\\/v1\\/object\\/public\\/${bucket}\\/(?:thumbs\\/\\d+\\/)?(.+)`,
    );
    const match = url.match(regex);
    if (!match) return;
    const filePath = match[1];
    await supabase.storage
      .from(bucket)
      .remove([filePath, `thumbs/480/${filePath}`, `thumbs/960/${filePath}`]);
  } catch {
    // silencioso
  }
}
