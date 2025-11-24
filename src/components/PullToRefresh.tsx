import { ReactNode, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh = ({ onRefresh, children, disabled = false }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPullDistance = 80;
  const triggerDistance = 60;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop === 0 && !isRefreshing) {
        touchStartY = e.touches[0].clientY;
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || touchStartY === 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      // Only trigger if scrolled to top and pulling down
      if (distance > 0 && scrollTop === 0) {
        e.preventDefault();
        const pull = Math.min(distance * 0.5, maxPullDistance);
        const prevDistance = pullDistance;
        setPullDistance(pull);
        
        // Light haptic feedback when reaching trigger point
        if (pull >= triggerDistance && prevDistance < triggerDistance) {
          if ('vibrate' in navigator) {
            navigator.vibrate(10); // Subtle 10ms vibration
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= triggerDistance && !isRefreshing) {
        // Trigger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50); // 50ms vibration
        }
        
        setIsRefreshing(true);
        setPullDistance(maxPullDistance);
        
        try {
          await onRefresh();
          // Success haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]); // Double tap pattern
          }
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setStartY(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
        setStartY(0);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh, disabled]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 flex items-center justify-center z-50 lg:hidden",
          "transition-all duration-300 ease-out pointer-events-none"
        )}
        style={{
          height: `${pullDistance}px`,
          opacity: Math.min(pullDistance / triggerDistance, 1),
        }}
      >
        <div
          className={cn(
            "bg-card/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border",
            "transition-transform duration-200",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: `scale(${Math.min(pullDistance / triggerDistance, 1)})`,
          }}
        >
          <RefreshCw
            className={cn(
              "h-6 w-6 text-primary transition-colors",
              pullDistance >= triggerDistance && "text-accent"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
