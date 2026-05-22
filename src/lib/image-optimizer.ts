/**
 * Convierte un archivo de imagen (jpg, jpeg, png, etc.) a formato WebP
 * utilizando el Canvas del navegador de forma cliente-side.
 * Mantiene una alta calidad visual pero reduce drásticamente el tamaño del archivo.
 * 
 * @param file El archivo original (File)
 * @param quality Calidad del WebP resultante (de 0.0 a 1.0). Por defecto 0.88 para calidad premium.
 */
export async function convertToWebP(file: File, quality = 0.88, maxDimension = 1200): Promise<File> {
  // Si ya es webp, no hacemos conversión
  if (file.type === "image/webp") {
    return file;
  }

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
              const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
              const newName = `${baseName}.webp`;

              const optimizedFile = new File([blob], newName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            "image/webp",
            quality
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
