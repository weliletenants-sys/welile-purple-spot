import { ReactNode, useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SwipeableCardsProps {
  children: ReactNode[];
  className?: string;
  onAddNew?: () => void;
  addButtonLabel?: string;
}

export const SwipeableCards = ({ children, className, onAddNew, addButtonLabel = "Add New" }: SwipeableCardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;
  const totalCards = children.length;

  const goToNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    const offset = currentTouch - touchStart;
    
    // Limit drag to prevent over-scrolling
    const maxOffset = 100;
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    setDragOffset(limitedOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (!touchStart || !touchEnd) {
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < totalCards - 1) {
      goToNext();
    } else if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
    
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalCards]);

  if (totalCards === 0) {
    return null;
  }

  const handleAddClick = () => {
    if (onAddNew) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      onAddNew();
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Desktop view - show all cards */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>

      {/* Mobile view - swipeable cards */}
      <div className="md:hidden relative">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={cn(
              "transition-transform duration-300 ease-out",
              isDragging && "transition-none"
            )}
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              display: 'flex',
            }}
          >
            {children.map((child, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 px-2"
                style={{ minWidth: '100%' }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="tap-target"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalCards, 5) }).map((_, index) => {
              // Show first 2, current, and last 2 if more than 5 cards
              let displayIndex = index;
              if (totalCards > 5) {
                if (index === 0) displayIndex = 0;
                else if (index === 1) displayIndex = currentIndex > 1 ? currentIndex : 1;
                else if (index === 2) displayIndex = currentIndex;
                else if (index === 3) displayIndex = currentIndex < totalCards - 2 ? currentIndex + 1 : totalCards - 2;
                else displayIndex = totalCards - 1;
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(displayIndex);
                    if ('vibrate' in navigator) {
                      navigator.vibrate(15);
                    }
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all tap-target",
                    displayIndex === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30"
                  )}
                  aria-label={`Go to card ${displayIndex + 1}`}
                />
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === totalCards - 1}
            className="tap-target"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Card counter */}
        <p className="text-center text-sm text-muted-foreground mt-3">
          {currentIndex + 1} of {totalCards}
        </p>

        {/* Swipe hint (show only for first few cards) */}
        {currentIndex < 2 && (
          <p className="text-center text-xs text-muted-foreground mt-2 animate-pulse">
            👈 Swipe to navigate 👉
          </p>
        )}

        {/* Floating Action Button - Add New */}
        {onAddNew && (
          <Button
            onClick={handleAddClick}
            size="lg"
            className={cn(
              "fixed bottom-20 right-4 z-40 rounded-full shadow-lg",
              "h-14 w-14 p-0",
              "bg-gradient-to-r from-primary to-accent",
              "hover:shadow-xl hover:scale-110",
              "transition-all duration-300",
              "tap-target",
              "animate-in slide-in-from-bottom-4 fade-in duration-500"
            )}
            aria-label={addButtonLabel}
          >
            <Plus className="h-6 w-6 text-primary-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};
