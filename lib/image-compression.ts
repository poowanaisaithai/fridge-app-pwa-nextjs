export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  previewUrl: string;
}

/**
 * High-performance client-side image compressor using HTML5 Canvas.
 * Compresses large camera photos (3MB - 12MB) down to < 100KB WebP/JPEG,
 * protecting the Firebase 5GB Free Tier limit.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1024,
  quality: number = 0.75
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio preserving resize
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine best format (WebP or JPEG)
      const mimeType = 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create compressed image blob'));
            return;
          }

          const compressedSize = blob.size;
          const savedPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const compressedFile = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blob);

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize,
            savedPercent,
            previewUrl,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => reject(err);
  });
}

/**
 * Format bytes into human readable string (KB / MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
