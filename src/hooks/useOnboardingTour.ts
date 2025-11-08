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
    
    // Award the Welcome Aboard badge
    const userIdentifier = localStorage.getItem("user_identifier");
    if (userIdentifier) {
      // Check for achievements in the background
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-achievements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userIdentifier,
          action: "onboarding_complete",
        }),
      }).catch((err) => console.error("Failed to check achievements:", err));
    }
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
