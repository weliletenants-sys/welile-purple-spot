import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HISTORY_KEY = "recent_pages_history";
const MAX_HISTORY = 5;

export interface PageHistoryItem {
  url: string;
  title: string;
  timestamp: number;
}

export const usePageHistory = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't track if on home page
    if (location.pathname === "/") return;

    const history = getHistory();
    
    // Remove any existing entry with the same URL
    const filteredHistory = history.filter(item => item.url !== location.pathname);
    
    // Add current page to the beginning
    const newHistory = [
      {
        url: location.pathname,
        title: getPageTitle(location.pathname),
        timestamp: Date.now(),
      },
      ...filteredHistory,
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, [location.pathname]);

  return {
    getHistory,
    clearHistory,
  };
};

export const getHistory = (): PageHistoryItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

// Map URLs to readable titles
const getPageTitle = (url: string): string => {
  const routeTitles: Record<string, string> = {
    "/executive-dashboard": "Executive Dashboard",
    "/agent-dashboard": "Agent Dashboard",
    "/agent-management": "Agent Management",
    "/agent-performance": "Agent Performance",
    "/top-performers": "Top Performers",
    "/pipeline-tenants": "Pipeline Tenants",
    "/recently-added": "Recently Added Tenants",
    "/risk-dashboard": "Risk Dashboard",
    "/missed-payments": "Missed Payments",
    "/recording-activity": "Recording Activity",
    "/monthly-summary": "Monthly Summary",
    "/service-center-analytics": "Service Center Analytics",
    "/service-center-management": "Service Center Management",
    "/service-center-transfer-analytics": "Transfer Analytics",
    "/pipeline-analytics": "Pipeline Analytics",
    "/leaderboard": "Leaderboard",
    "/landlord-management": "Landlord Management",
    "/withdrawal-history": "Withdrawal History",
    "/bulk-add": "Bulk Add Tenants",
    "/auto-import": "Auto Import",
    "/admin-dashboard": "Admin Dashboard",
    "/agent-portal": "Agent Portal",
  };

  // Check for exact match
  if (routeTitles[url]) {
    return routeTitles[url];
  }

  // Handle dynamic routes
  if (url.startsWith("/tenant/")) {
    return "Tenant Details";
  }
  if (url.startsWith("/agent/")) {
    return "Agent Details";
  }
  if (url.startsWith("/landlord/")) {
    return "Landlord Profile";
  }

  // Fallback: clean up the URL
  return url
    .split("/")
    .filter(Boolean)
    .map(part => part.replace(/-/g, " "))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" > ");
};
