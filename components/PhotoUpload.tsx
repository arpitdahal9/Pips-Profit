import React, { useRef, useState } from 'react';
import { Image as ImageIcon, X, XCircle, Upload } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import PhotoAnnotator from './PhotoAnnotator';

interface PhotoUploadProps {
  photos: string[];
  maxPhotos?: number;
  onPhotosChange: (photos: string[]) => void;
  theme?: any;
  isLightTheme?: boolean;
  label?: string;
  className?: string;
  mode?: 'trade' | 'setup';
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  maxPhotos = 2,
  onPhotosChange,
  theme,
  isLightTheme = false,
  label = 'Attach Screenshot',
  className = '',
  mode = 'trade'
}) => {
  const { strategies } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | undefined>(undefined);

  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const borderColor = isLightTheme ? '#cbd5e1' : 'rgba(71,85,105,0.5)';

  const handleOpenAnnotator = () => {
    if (photos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }
    setViewOnly(false);
    setActiveImageUrl(undefined);
    setShowAnnotator(true);
  };

  const handleViewPhoto = (url: string) => {
    setViewOnly(true);
    setActiveImageUrl(url);
    setShowAnnotator(true);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={className}>
      <label className={`text-[10px] font-bold uppercase mb-2 block ${textSecondary}`}>
        {label} {maxPhotos > 1 ? `(Max ${maxPhotos})` : ''}
      </label>

      <div className="space-y-2">
        {/* Display existing photos as thumbnails */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div
                  onClick={() => handleViewPhoto(photo)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 cursor-pointer active:scale-95 transition-transform"
                >
                  <img src={photo} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(index);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add photo button */}
        {canAddMore && (
          <button
            onClick={handleOpenAnnotator}
            className={`w-full py-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors hover:opacity-80 active:scale-[0.98]`}
            style={{
              borderColor: `${theme?.primary || '#8b5cf6'}50`
            }}
          >
            <ImageIcon size={24} style={{ color: theme?.primary || '#8b5cf6' }} />
            <span className={`text-sm ${textSecondary}`}>
              {photos.length === 0 ? 'Tap to add screenshot' : 'Add another screenshot'}
            </span>
          </button>
        )}
      </div>

      <PhotoAnnotator
        isOpen={showAnnotator}
        onClose={() => setShowAnnotator(false)}
        onSave={(dataUrl) => {
          onPhotosChange([...photos, dataUrl]);
          setShowAnnotator(false);
        }}
        strategies={strategies}
        theme={theme}
        isLightTheme={isLightTheme}
        mode={mode}
        initialImageUrl={activeImageUrl}
        viewOnly={viewOnly}
      />
    </div>
  );
};

export default PhotoUpload;
