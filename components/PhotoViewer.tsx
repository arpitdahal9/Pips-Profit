import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoViewerProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate
}) => {
  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  const canGoPrev = hasMultiple && currentIndex > 0;
  const canGoNext = hasMultiple && currentIndex < images.length - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoPrev && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the image
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Close Button - Positioned with safe area */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg backdrop-blur-sm"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)'
        }}
        aria-label="Close image"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Back Button - Positioned with safe area */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 left-4 px-4 py-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors z-10 shadow-lg backdrop-blur-sm flex items-center gap-2"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          left: 'calc(env(safe-area-inset-left, 0px) + 16px)'
        }}
      >
        <span className="text-white text-sm font-medium">← Back</span>
      </button>

      {/* Image Counter */}
      {hasMultiple && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg z-10 backdrop-blur-sm"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)'
          }}
        >
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Previous Button */}
      {hasMultiple && canGoPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg backdrop-blur-sm"
          style={{
            left: 'calc(env(safe-area-inset-left, 0px) + 16px)'
          }}
          aria-label="Previous image"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}

      {/* Next Button */}
      {hasMultiple && canGoNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg backdrop-blur-sm"
          style={{
            right: 'calc(env(safe-area-inset-right, 0px) + 16px)'
          }}
          aria-label="Next image"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      {/* Image */}
      <div className="flex items-center justify-center w-full h-full p-4">
        <img
          src={currentImage}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default PhotoViewer;
