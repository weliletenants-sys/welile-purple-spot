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
  Activity,
  Database
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
      { title: "Pipeline Dashboard", url: "/pipeline-dashboard", icon: Target },
      { title: "Pipeline Tenants", url: "/pipeline-tenants", icon: Target },
      { title: "Pending Tenants", url: "/pending-tenants", icon: Clock },
      { title: "Under Review", url: "/under-review-tenants", icon: AlertTriangle },
      { title: "Recently Added", url: "/recently-added", icon: Clock },
      { title: "Risk Dashboard", url: "/risk-dashboard", icon: AlertTriangle },
      { title: "Missed Payments", url: "/missed-payments", icon: DollarSign },
      { title: "Status History", url: "/status-history", icon: Activity },
    ],
  },
  {
    label: "Recording",
    items: [
      { title: "Recording Activity", url: "/recording-activity", icon: Activity },
      { title: "Earnings Analytics", url: "/agent-earnings-analytics", icon: TrendingUp },
      { title: "Earnings Leaderboard", url: "/earnings-leaderboard", icon: Award },
      { title: "Team Leaderboard", url: "/team-earnings", icon: Users },
      { title: "Bonus Calculator", url: "/recording-bonus-calculator", icon: DollarSign },
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
      { title: "Data Cleanup", url: "/data-cleanup", icon: Database },
    ],
  },
];

export function AppSidebar() {
  const { open, isMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Track which groups are expanded - expand groups with active routes by default
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach(group => {
      const hasActiveRoute = group.items.some(item => 
        item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url)
      );
      // Expand groups with active routes OR Overview group on home page
      // On mobile/smaller screens, expand at least the active group
      initial[group.label] = hasActiveRoute || (currentPath === "/" && group.label === "Overview");
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
    <Sidebar className="border-r border-border" collapsible="icon">
      <SidebarContent className="overflow-y-auto overflow-x-hidden px-2 py-4" style={{ maxHeight: "100vh" }}>
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
              className="mb-2"
            >
              <SidebarGroup className="space-y-1">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel 
                    className="cursor-pointer hover:bg-accent rounded-md px-2 py-2 transition-all duration-200 flex items-center justify-between group select-none w-full"
                    title={open ? `${isExpanded ? 'Collapse' : 'Expand'} ${group.label}` : group.label}
                  >
                    <span className={`text-sm font-medium truncate ${hasActiveRoute ? "text-primary font-semibold" : "text-foreground"}`}>
                      {open ? group.label : group.label.charAt(0).toUpperCase()}
                    </span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-all duration-200 shrink-0 ${isExpanded ? "rotate-180" : "rotate-0"} ${!open ? "opacity-0 w-0" : "opacity-100"}`} 
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent className="transition-all duration-200 ease-in-out">
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = item.url === "/" 
                          ? currentPath === "/"
                          : currentPath.startsWith(item.url);

                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <NavLink 
                                to={item.url} 
                                end={item.url === "/"}
                                className="flex items-center gap-3 hover:bg-accent rounded-md transition-all duration-150 py-2.5 px-2 w-full"
                                activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[6px]"
                                title={item.title}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {open && <span className="text-sm truncate flex-1 text-left">{item.title}</span>}
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
