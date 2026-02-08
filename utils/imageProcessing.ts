import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ImageManipulator } from '@capacitor-community/image-manipulator';

type ImageProcessingOptions = {
  maxDimension?: number;
  quality?: number;
};

const dataUrlToBase64 = (dataUrl: string): string => {
  const split = dataUrl.split(',');
  return split.length > 1 ? split[1] : dataUrl;
};

const tryNativeCompression = async (
  file: File,
  options: ImageProcessingOptions
): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const { maxDimension = 1600, quality = 0.85 } = options;
    const dataUrl = await blobToDataUrl(file);
    const base64 = dataUrlToBase64(dataUrl);
    const fileName = `capture_${Date.now()}.jpg`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache
    });

    const resized = await ImageManipulator.resize({
      imagePath: savedFile.uri,
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality: Math.round(quality * 100),
      fixRotation: true
    });

    const webPath = resized.webPath || (resized.imagePath ? Capacitor.convertFileSrc(resized.imagePath) : '');
    if (!webPath) return null;

    const response = await fetch(webPath);
    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch (error) {
    return null;
  }
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    // Set timeout for image loading (30 seconds for very large images)
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading timeout - image too large'));
    }, 30000);
    
    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      
      // Check if image dimensions are too large (prevent memory issues)
      if (img.width * img.height > 15000000) { // ~15MP limit
        reject(new Error('Image resolution too high. Please use an image under 12MP.'));
        return;
      }
      
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(blob);
  });
};

export const readImageFileAsDataUrl = async (
  file: File,
  options: ImageProcessingOptions = {}
): Promise<string> => {
  try {
    // Pre-check file size and dimensions before processing
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 15) {
      throw new Error('Image file is too large. Please use an image under 15MB.');
    }

    const nativeResult = await tryNativeCompression(file, options);
    if (nativeResult) return nativeResult;

    // More aggressive defaults for large files
    let maxDimension = options.maxDimension || 1200;
    let quality = options.quality || 0.75;
    
    // Adjust based on file size
    if (fileSizeMB > 2) {
      maxDimension = 1000;
      quality = 0.7;
    }
    if (fileSizeMB > 5) {
      maxDimension = 800;
      quality = 0.65;
    }

    const image = await loadImageFromFile(file);
    
    // Calculate dimensions
    const maxSide = Math.max(image.width, image.height);
    const totalPixels = image.width * image.height;
    
    // Very aggressive resizing for high-resolution images (like 12MP)
    let scale = 1;
    if (totalPixels > 10000000) { // > 10MP
      // For 12MP images (3060x4080 = 12.5MP), resize aggressively
      maxDimension = Math.min(maxDimension, 1000);
      quality = Math.min(quality, 0.7);
    }
    if (maxSide > 3000) {
      // For images wider/taller than 3000px, be very aggressive
      maxDimension = Math.min(maxDimension, 900);
    }
    
    scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
    
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    // Strict canvas size limit to prevent memory issues
    const MAX_CANVAS_SIZE = 1500; // Reduced from 2000
    if (targetWidth > MAX_CANVAS_SIZE || targetHeight > MAX_CANVAS_SIZE) {
      const finalScale = Math.min(MAX_CANVAS_SIZE / targetWidth, MAX_CANVAS_SIZE / targetHeight);
      scale = scale * finalScale;
    }

    const finalWidth = Math.max(1, Math.round(image.width * scale));
    const finalHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const ctx = canvas.getContext('2d', { 
      willReadFrequently: false,
      alpha: false,
      desynchronized: true // Better performance for large images
    });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use lower quality smoothing for very large images to save memory
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = totalPixels > 10000000 ? 'medium' : 'high';

    // Draw image with error handling
    try {
      ctx.drawImage(image, 0, 0, finalWidth, finalHeight);
    } catch (drawError) {
      console.error('Error drawing image to canvas:', drawError);
      throw new Error('Failed to process image - image too large or corrupted');
    }
    
    // Clear image reference to help with memory
    image.src = '';

    // Convert to blob with timeout protection and memory cleanup
    const blob = await Promise.race([
      new Promise<Blob>((resolve, reject) => {
        try {
          canvas.toBlob(
            (result) => {
              // Clean up canvas
              canvas.width = 0;
              canvas.height = 0;
              
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(new Error('Canvas conversion failed'));
        }
      }),
      new Promise<Blob>((_, reject) => {
        setTimeout(() => reject(new Error('Image processing timeout - please try a smaller image')), 15000);
      })
    ]);

    return blobToDataUrl(blob);
  } catch (error) {
    console.error('Image processing error:', error);
    // Re-throw with more context
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
