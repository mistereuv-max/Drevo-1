const COMPRESSIBLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 1600;
const TARGET_MAX_BYTES = 2 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать изображение."));
    };

    image.src = objectUrl;
  });
}

function calculateSize(width: number, height: number): { width: number; height: number } {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_DIMENSION / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function canvasToFile(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
  fallbackName: string,
): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve(new File([blob], fallbackName, { type: blob.type || type }));
      },
      type,
      quality,
    );
  });
}

export async function prepareAvatarForUpload(file: File): Promise<File> {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = calculateSize(image.width, image.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  // Сохраняем пропорции и рисуем изображение в вычисленный размер.
  context.drawImage(image, 0, 0, width, height);

  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = type === "image/png" ? 0.92 : 0.86;
  const compressed = await canvasToFile(canvas, type, quality, file.name);

  if (!compressed) {
    return file;
  }

  if (compressed.size > TARGET_MAX_BYTES && type === "image/jpeg") {
    const strongerCompressed = await canvasToFile(canvas, type, 0.78, file.name);
    if (strongerCompressed && strongerCompressed.size < compressed.size) {
      return strongerCompressed.size < file.size ? strongerCompressed : file;
    }
  }

  return compressed.size < file.size ? compressed : file;
}
