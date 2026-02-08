import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, ArrowLeft } from 'lucide-react';

interface EnhancedPhotoViewerProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  theme?: any;
}

const EnhancedPhotoViewer: React.FC<EnhancedPhotoViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  theme
}) => {
  const [showTimestamp, setShowTimestamp] = useState<boolean[]>([]);
  const [timestampPositions, setTimestampPositions] = useState<Array<{ x: number; y: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize timestamp states
  useEffect(() => {
    if (isOpen && images.length > 0) {
      setShowTimestamp(new Array(images.length).fill(false));
      setTimestampPositions(new Array(images.length).fill({ x: 0.85, y: 0.85 })); // Bottom right default
    }
  }, [isOpen, images.length]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Handle escape key to close
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      // Handle back button (Android)
      const handleBackButton = () => {
        onClose();
      };
      
      window.addEventListener('keydown', handleEscape);
      window.addEventListener('popstate', handleBackButton);
      
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
        window.removeEventListener('popstate', handleBackButton);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  // Draw timestamp on canvas
  useEffect(() => {
    if (!isOpen || !imageRef.current || !canvasRef.current || !showTimestamp[currentIndex]) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const pos = timestampPositions[currentIndex] || { x: 0.85, y: 0.85 };
    const x = pos.x * canvas.width;
    const y = pos.y * canvas.height;

    // Draw background for text (rounded rectangle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const padding = 10;
    const textWidth = ctx.measureText(timestamp).width + padding * 2;
    const textHeight = 30;
    const radius = 8;
    
    ctx.beginPath();
    ctx.moveTo(x - padding + radius, y - textHeight);
    ctx.lineTo(x - padding + textWidth - radius, y - textHeight);
    ctx.quadraticCurveTo(x - padding + textWidth, y - textHeight, x - padding + textWidth, y - textHeight + radius);
    ctx.lineTo(x - padding + textWidth, y - padding - radius);
    ctx.quadraticCurveTo(x - padding + textWidth, y - padding, x - padding + textWidth - radius, y - padding);
    ctx.lineTo(x - padding + radius, y - padding);
    ctx.quadraticCurveTo(x - padding, y - padding, x - padding, y - padding + radius);
    ctx.lineTo(x - padding, y - textHeight - radius);
    ctx.quadraticCurveTo(x - padding, y - textHeight, x - padding + radius, y - textHeight);
    ctx.closePath();
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(timestamp, x, y - 10);
  }, [isOpen, currentIndex, showTimestamp, timestampPositions]);

  if (!isOpen || images.length === 0 || !images[currentIndex]) return null;

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
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleTimestamp = () => {
    const newShowTimestamp = [...showTimestamp];
    newShowTimestamp[currentIndex] = !newShowTimestamp[currentIndex];
    setShowTimestamp(newShowTimestamp);
  };

  const handleImageLoad = () => {
    // Image loaded, canvas will update via useEffect
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Back Button - Top Left */}
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
        <ArrowLeft size={18} className="text-white" />
        <span className="text-white text-sm font-medium">Back</span>
      </button>

      {/* Close Button - Top Right */}
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

      {/* Timestamp Toggle Button - Bottom Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleTimestamp();
        }}
        className="absolute bottom-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg backdrop-blur-sm"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
          backgroundColor: showTimestamp[currentIndex] ? (theme?.primary || '#8b5cf6') : 'rgba(0, 0, 0, 0.6)'
        }}
        aria-label="Toggle timestamp"
      >
        <Clock size={24} className="text-white" />
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

      {/* Image Container */}
      <div className="flex items-center justify-center w-full h-full p-4 relative">
        {showTimestamp[currentIndex] ? (
          <div className="relative">
            <img
              ref={imageRef}
              src={currentImage}
              alt={`Photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
              onLoad={handleImageLoad}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              style={{ display: 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'block' }}
            />
          </div>
        ) : (
          <img
            src={currentImage}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedPhotoViewer;
