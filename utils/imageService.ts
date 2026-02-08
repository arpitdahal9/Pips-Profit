/**
 * Dedicated Image Service
 * Handles all image operations: upload, processing, viewing, and management
 */

import { Capacitor } from '@capacitor/core';
import { readImageFileAsDataUrl } from './imageProcessing';

export interface ImageUploadOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeMB?: number;
}

export interface ImageUploadResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * Upload and process a single image file
 */
export const uploadImage = async (
  file: File,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' };
    }

    // Validate file size
    const maxSize = (options.maxSizeMB || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: `Image size must be less than ${options.maxSizeMB || 10}MB` };
    }

    // Process image with aggressive compression for large files
    const fileSizeMB = file.size / (1024 * 1024);
    let maxDimension = options.maxDimension || 1200;
    let quality = options.quality || 0.75;
    
    // Very aggressive compression for larger files and high-res images
    if (fileSizeMB > 5) {
      maxDimension = 800;
      quality = 0.65;
    } else if (fileSizeMB > 2) {
      maxDimension = 900;
      quality = 0.7;
    } else if (fileSizeMB > 1) {
      // For files like 1.73MB (12MP images), use moderate compression
      maxDimension = 1000;
      quality = 0.72;
    }
    
    try {
      const dataUrl = await readImageFileAsDataUrl(file, {
        maxDimension,
        quality
      });
      
      return { success: true, dataUrl };
    } catch (error) {
      // If first attempt fails, try even more aggressive compression
      if (fileSizeMB > 1) {
        console.log('Retrying with more aggressive compression...');
        try {
          const dataUrl = await readImageFileAsDataUrl(file, {
            maxDimension: 800,
            quality: 0.65
          });
          return { success: true, dataUrl };
        } catch (retryError) {
          return { 
            success: false, 
            error: 'Image is too large or high resolution. Please try a smaller image or lower resolution.' 
          };
        }
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process image' 
      };
    }

    return { success: true, dataUrl };
  } catch (error) {
    console.error('Image upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process image' 
    };
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  files: File[],
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult[]> => {
  const results = await Promise.all(
    files.map(file => uploadImage(file, options))
  );
  return results;
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` };
  }

  return { valid: true };
};

/**
 * Get image dimensions from data URL
 */
export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
};

/**
 * Compress image if needed
 */
export const compressImageIfNeeded = async (
  dataUrl: string,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<string> => {
  try {
    const dimensions = await getImageDimensions(dataUrl);
    
    // If image is already small enough, return as-is
    if (dimensions.width <= maxDimension && dimensions.height <= maxDimension) {
      return dataUrl;
    }

    // Create canvas and resize
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = dimensions;
        if (width > height) {
          if (width > maxDimension) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return dataUrl; // Return original if compression fails
  }
};
