import { 
  Home, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Award, 
  TrendingUp,
  FileText,
  Building2,
  MapPin,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Clock,
  GitBranch,
  Target,
  Wallet,
  UserCog,
  Activity
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "Executive Dashboard", url: "/executive-dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Agents",
    items: [
      { title: "Agent Dashboard", url: "/agent-dashboard", icon: Users },
      { title: "Agent Management", url: "/agent-management", icon: UserCog },
      { title: "Agent Performance", url: "/agent-performance", icon: TrendingUp },
      { title: "Top Performers", url: "/top-performers", icon: Award },
    ],
  },
  {
    label: "Tenants",
    items: [
      { title: "Pipeline Tenants", url: "/pipeline-tenants", icon: Target },
      { title: "Recently Added", url: "/recently-added", icon: Clock },
      { title: "Risk Dashboard", url: "/risk-dashboard", icon: AlertTriangle },
      { title: "Missed Payments", url: "/missed-payments", icon: DollarSign },
    ],
  },
  {
    label: "Recording",
    items: [
      { title: "Recording Activity", url: "/recording-activity", icon: Activity },
      { title: "Monthly Summary", url: "/monthly-summary", icon: FileText },
    ],
  },
  {
    label: "Service Centers",
    items: [
      { title: "Analytics", url: "/service-center-analytics", icon: BarChart3 },
      { title: "Management", url: "/service-center-management", icon: Building2 },
      { title: "Transfer Analytics", url: "/service-center-transfer-analytics", icon: GitBranch },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Pipeline Analytics", url: "/pipeline-analytics", icon: TrendingUp },
      { title: "Leaderboard", url: "/leaderboard", icon: Award },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Landlord Management", url: "/landlord-management", icon: Building2 },
      { title: "Withdrawal History", url: "/withdrawal-history", icon: Wallet },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach(group => {
      const hasActiveRoute = group.items.some(item => currentPath.startsWith(item.url) && item.url !== "/");
      initial[group.label] = hasActiveRoute || currentPath === "/" && group.label === "Overview";
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="px-2 py-4">
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroups[group.label];
          const hasActiveRoute = group.items.some(item => 
            item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url)
          );

          return (
            <Collapsible
              key={group.label}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors flex items-center justify-between group">
                    <span className={hasActiveRoute ? "text-primary font-semibold" : ""}>
                      {group.label}
                    </span>
                    {open && (
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = item.url === "/" 
                          ? currentPath === "/"
                          : currentPath.startsWith(item.url);

                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink 
                                to={item.url} 
                                end={item.url === "/"}
                                className="flex items-center gap-3 hover:bg-accent/50 rounded-md transition-colors"
                                activeClassName="bg-primary/10 text-primary font-medium"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {open && <span>{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
