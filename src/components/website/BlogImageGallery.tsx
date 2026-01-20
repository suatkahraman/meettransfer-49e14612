import { useState, useCallback, useRef, useEffect } from "react";
import { LazyDialog as Dialog, DialogContent } from "@/components/ui/lazy-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface BlogImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  className?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  startScale: number;
  isDragging: boolean;
  lastTapTime: number;
}

const BlogImageGallery = ({ 
  images, 
  columns = 3,
  className 
}: BlogImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    startScale: 1,
    isDragging: false,
    lastTapTime: 0,
  });

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedIndex]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  }, []);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToPrevious = () => {
    if (selectedIndex === null || scale > 1) return;
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  };

  const goToNext = () => {
    if (selectedIndex === null || scale > 1) return;
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") closeLightbox();
  }, [selectedIndex, scale]);

  // Calculate distance between two touch points
  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for pinch-to-zoom and swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    const state = touchStateRef.current;

    if (touches.length === 2) {
      // Pinch start
      state.startDistance = getDistance(touches);
      state.startScale = scale;
    } else if (touches.length === 1) {
      state.startX = touches[0].clientX;
      state.startY = touches[0].clientY;
      state.isDragging = scale > 1;
      
      // Double tap detection
      const now = Date.now();
      if (now - state.lastTapTime < 300) {
        // Double tap - toggle zoom
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
      }
      state.lastTapTime = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touches = e.touches;
    const state = touchStateRef.current;

    if (touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(touches);
      const scaleFactor = currentDistance / state.startDistance;
      const newScale = Math.min(Math.max(state.startScale * scaleFactor, 1), 5);
      setScale(newScale);
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (touches.length === 1 && scale > 1 && state.isDragging) {
      // Pan when zoomed
      e.preventDefault();
      const deltaX = touches[0].clientX - state.startX;
      const deltaY = touches[0].clientY - state.startY;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      state.startX = touches[0].clientX;
      state.startY = touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const state = touchStateRef.current;
    
    if (e.changedTouches.length === 1 && scale === 1 && !state.isDragging) {
      // Swipe detection for navigation
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - state.startX;
      const threshold = 50;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    }
    
    state.isDragging = false;
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <>
      <div className={cn("grid gap-4", gridCols[columns], className)}>
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {/* Skeleton loader */}
            {!loadedImages.has(index) && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
            
            {/* Lazy loaded image */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              onLoad={() => handleImageLoad(index)}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                "group-hover:scale-105",
                loadedImages.has(index) ? "opacity-100" : "opacity-0"
              )}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Caption */}
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Zoom controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={zoomIn}
                disabled={scale >= 5}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={zoomOut}
                disabled={scale <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              {scale > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={resetZoom}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Navigation buttons */}
            {images.length > 1 && scale === 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Main image with touch gestures */}
            {selectedIndex !== null && (
              <div 
                ref={imageContainerRef}
                className="flex flex-col items-center max-h-[90vh] p-4 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="overflow-hidden"
                  style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transition: scale === 1 ? 'transform 0.3s ease-out' : 'none',
                  }}
                >
                  <img
                    src={images[selectedIndex].src}
                    alt={images[selectedIndex].alt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
                    draggable={false}
                  />
                </div>
                {images[selectedIndex].caption && scale === 1 && (
                  <p className="text-white text-center mt-4 max-w-2xl">
                    {images[selectedIndex].caption}
                  </p>
                )}
                {/* Image counter and zoom level */}
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-white/60 text-sm">
                    {selectedIndex + 1} / {images.length}
                  </p>
                  {scale > 1 && (
                    <p className="text-white/60 text-sm">
                      {Math.round(scale * 100)}%
                    </p>
                  )}
                </div>
                {/* Mobile gesture hint */}
                {scale === 1 && (
                  <p className="text-white/40 text-xs mt-2 sm:hidden">
                    Swipe to navigate • Pinch to zoom • Double-tap to zoom
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlogImageGallery;
