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
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
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
  const nativeResult = await tryNativeCompression(file, options);
  if (nativeResult) return nativeResult;

  const { maxDimension = 1600, quality = 0.85 } = options;
  const image = await loadImageFromFile(file);
  const maxSide = Math.max(image.width, image.height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to process image');
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Failed to process image'))),
      'image/jpeg',
      quality
    );
  });

  return blobToDataUrl(blob);
};
