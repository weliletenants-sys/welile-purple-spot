import { useLocation, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";

// Map routes to user-friendly names
const routeNames: Record<string, string> = {
  "/": "Home",
  "/tenant": "Tenant Details",
  "/executive-dashboard": "Executive Dashboard",
  "/agent-dashboard": "Agent Dashboard",
  "/agent": "Agent Details",
  "/top-performers": "Top Performers",
  "/recording-activity": "Recording Activity",
  "/bulk-add": "Bulk Add Tenants",
  "/auto-import": "Auto Import",
  "/missed-payments": "Missed Payments",
  "/admin-login": "Admin Login",
  "/admin-dashboard": "Admin Dashboard",
  "/withdrawal-history": "Withdrawal History",
  "/monthly-summary": "Monthly Summary",
  "/agent-portal-login": "Agent Portal Login",
  "/agent-portal": "Agent Portal",
  "/service-center-analytics": "Service Center Analytics",
  "/service-center-management": "Service Center Management",
  "/service-center-transfer-analytics": "Transfer Analytics",
  "/recently-added": "Recently Added",
  "/risk-dashboard": "Risk Dashboard",
  "/pipeline-tenants": "Pipeline Tenants",
  "/pipeline-analytics": "Pipeline Analytics",
  "/agent-management": "Agent Management",
  "/agent-performance": "Agent Performance",
  "/landlord-management": "Landlord Management",
  "/landlord": "Landlord Profile",
  "/auth": "Authentication",
  "/leaderboard": "Leaderboard",
};

export const DynamicBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Split the pathname into segments
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = [
    { path: "/", label: "Home" },
  ];

  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Check if this is a dynamic segment (like tenant ID or agent name)
    const isDynamic = !routeNames[currentPath];
    
    if (isDynamic) {
      // For dynamic routes, use a cleaned version of the segment
      const label = decodeURIComponent(segment).replace(/-/g, " ");
      breadcrumbs.push({
        path: currentPath,
        label: label.length > 30 ? label.substring(0, 30) + "..." : label,
      });
    } else {
      // For known routes, use the mapped name
      const baseRoute = `/${pathSegments.slice(0, index + 1).join("/")}`;
      breadcrumbs.push({
        path: currentPath,
        label: routeNames[baseRoute] || segment,
      });
    }
  });

  // Don't show breadcrumbs on home page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isHome = crumb.path === "/";

              return (
                <div key={crumb.path} className="flex items-center">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-foreground">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => navigate(crumb.path)}
                        className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                      >
                        {isHome && <Home className="h-4 w-4" />}
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
