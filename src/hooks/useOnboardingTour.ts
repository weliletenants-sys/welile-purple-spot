import { useState, useEffect } from "react";

const ONBOARDING_STORAGE_KEY = "onboarding_completed";

export const useOnboardingTour = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Show tour after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setShowTour(true);
  };

  return {
    showTour,
    completeTour,
    skipTour,
    resetTour,
  };
};
