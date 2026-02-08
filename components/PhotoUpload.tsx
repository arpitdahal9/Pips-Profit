import React, { useRef, useState } from 'react';
import { Image, X, XCircle, Upload } from 'lucide-react';
import { uploadImage, validateImageFile } from '../utils/imageService';

interface PhotoUploadProps {
  photos: string[];
  maxPhotos?: number;
  onPhotosChange: (photos: string[]) => void;
  theme?: any;
  isLightTheme?: boolean;
  label?: string;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  maxPhotos = 2,
  onPhotosChange,
  theme,
  isLightTheme = false,
  label = 'Attach Screenshot',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const borderColor = isLightTheme ? '#cbd5e1' : 'rgba(71,85,105,0.5)';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      alert(validation.error || 'Invalid image file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (photos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsProcessing(true);
      
      // Show processing state immediately to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check file size before processing
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 15) {
        alert('Image file is too large (over 15MB). Please use a smaller image.');
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Adjust compression based on file size
      let maxDimension = 1000;
      let quality = 0.72;
      
      if (fileSizeMB > 2) {
        maxDimension = 800;
        quality = 0.65;
      } else if (fileSizeMB > 1) {
        // For 1.73MB files (like 12MP images), use moderate settings
        maxDimension = 900;
        quality = 0.7;
      }
      
      const result = await uploadImage(file, {
        maxDimension,
        quality,
        maxSizeMB: 15
      });

      if (result.success && result.dataUrl) {
        onPhotosChange([...photos, result.dataUrl]);
      } else {
        const errorMsg = result.error || 'Failed to upload image';
        if (errorMsg.includes('too large') || errorMsg.includes('resolution')) {
          alert('Image is too large or high resolution. Please try a smaller image (under 10MP recommended).');
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Failed to process image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('timeout') || errorMessage.includes('too large') || errorMessage.includes('resolution')) {
        alert('Image is too large or high resolution. Please try a smaller image (under 10MP recommended).');
      } else {
        alert('Failed to process image. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      // Always reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={className}>
      <label className={`text-[10px] font-bold uppercase mb-2 block ${textSecondary}`}>
        {label} {maxPhotos > 1 ? `(Max ${maxPhotos})` : ''}
      </label>

      <div className="space-y-2">
        {/* Display existing photos */}
        {photos.map((photo, index) => (
          <div key={index} className="relative">
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-40 object-cover rounded-xl border"
              style={{ borderColor: `${theme?.primary || '#8b5cf6'}30` }}
            />
            <button
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black/90 rounded-lg text-white transition-colors backdrop-blur-sm"
            >
              <XCircle size={18} />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`w-full py-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              isProcessing
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:opacity-80 active:scale-[0.98]'
            }`}
            style={{
              borderColor: isProcessing ? borderColor : `${theme?.primary || '#8b5cf6'}50`
            }}
          >
            {isProcessing ? (
              <>
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: theme?.primary || '#8b5cf6' }} />
                <span className={`text-sm ${textSecondary}`}>Processing...</span>
              </>
            ) : (
              <>
                <Image size={24} style={{ color: theme?.primary || '#8b5cf6' }} />
                <span className={`text-sm ${textSecondary}`}>
                  {photos.length === 0 ? 'Tap to add screenshot' : 'Add another screenshot'}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default PhotoUpload;
