import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const totalScrollableHeight = documentHeight - windowHeight;
      const progress = (scrollTop / totalScrollableHeight) * 100;
      
      setScrollProgress(Math.min(progress, 100));
    };

    // Calculate on mount
    calculateScrollProgress();

    // Add scroll listener
    window.addEventListener("scroll", calculateScrollProgress);

    return () => {
      window.removeEventListener("scroll", calculateScrollProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-muted/30">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary via-accent to-primary-glow",
          "transition-all duration-150 ease-out",
          "shadow-[0_0_10px_rgba(var(--primary-glow),0.5)]"
        )}
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      />
    </div>
  );
};
