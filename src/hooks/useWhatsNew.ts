import { useState, useEffect } from "react";

const CURRENT_VERSION = "2.0.0"; // Update this when you add new features
const VERSION_KEY = "app_version_seen";

export const useWhatsNew = () => {
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(VERSION_KEY);
    
    // Show if user hasn't seen this version or it's their first time
    if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
      // Delay slightly to let the page load
      const timer = setTimeout(() => {
        setShowWhatsNew(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const markAsSeen = () => {
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    setShowWhatsNew(false);
  };

  const reopenWhatsNew = () => {
    setShowWhatsNew(true);
  };

  return {
    showWhatsNew,
    markAsSeen,
    reopenWhatsNew,
    currentVersion: CURRENT_VERSION,
  };
};
