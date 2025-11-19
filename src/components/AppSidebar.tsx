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
  Database,
  History,
  Star,
  Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

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
import { Separator } from "@/components/ui/separator";

interface RecentPage {
  url: string;
  title: string;
  visitedAt: number;
}

interface PinnedPage {
  url: string;
  title: string;
}

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
      { title: "Transfer History", url: "/transfer-history", icon: History },
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
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { open, isMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Track recently visited pages
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  
  // Track pinned pages
  const [pinnedPages, setPinnedPages] = useState<PinnedPage[]>([]);

  // Get all navigation items for lookup - memoized to prevent infinite loops
  const allNavItems = useMemo(() => 
    navigationGroups.flatMap(group => group.items),
    []
  );

  useEffect(() => {
    // Load recent pages and pinned pages from localStorage
    const stored = localStorage.getItem('recentPages');
    if (stored) {
      setRecentPages(JSON.parse(stored));
    }
    
    const storedPinned = localStorage.getItem('pinnedPages');
    if (storedPinned) {
      setPinnedPages(JSON.parse(storedPinned));
    }
  }, []);

  useEffect(() => {
    // Track current page visit (exclude if it's pinned)
    const currentItem = allNavItems.find(item => 
      item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url)
    );

    if (currentItem && !pinnedPages.some(p => p.url === currentItem.url)) {
      setRecentPages(prev => {
        // Remove if already exists
        const filtered = prev.filter(p => p.url !== currentItem.url);
        // Add to front (without icon - we'll look it up when rendering)
        const updated = [{
          url: currentItem.url,
          title: currentItem.title,
          visitedAt: Date.now()
        }, ...filtered].slice(0, 5); // Keep only 5 most recent
        
        // Save to localStorage
        localStorage.setItem('recentPages', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentPath, pinnedPages, allNavItems]);

  const togglePin = (url: string) => {
    const item = allNavItems.find(i => i.url === url);
    if (!item) return;

    setPinnedPages(prev => {
      const isPinned = prev.some(p => p.url === url);
      let updated: PinnedPage[];
      
      if (isPinned) {
        // Unpin
        updated = prev.filter(p => p.url !== url);
      } else {
        // Pin (without icon - we'll look it up when rendering)
        updated = [...prev, {
          url: item.url,
          title: item.title
        }];
        
        // Remove from recent pages if pinned
        setRecentPages(recent => {
          const filtered = recent.filter(p => p.url !== url);
          localStorage.setItem('recentPages', JSON.stringify(filtered));
          return filtered;
        });
      }
      
      localStorage.setItem('pinnedPages', JSON.stringify(updated));
      return updated;
    });
  };

  const isPinned = (url: string) => pinnedPages.some(p => p.url === url);

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
        
        {/* Pinned Pages Section */}
        {pinnedPages.length > 0 && (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <Star className="h-4 w-4 text-primary shrink-0 fill-primary" />
                {open && <span className="text-xs font-semibold text-primary uppercase tracking-wide">Pinned</span>}
              </div>
              <SidebarMenu className="space-y-0.5">
                {pinnedPages.map((page) => {
                  const isActive = page.url === "/" 
                    ? currentPath === "/"
                    : currentPath.startsWith(page.url);
                  // Look up icon from navigation items
                  const navItem = allNavItems.find(item => item.url === page.url);
                  const PageIcon = navItem?.icon || Home;

                  return (
                    <SidebarMenuItem key={page.url} className="group/item">
                      <div className="flex items-center gap-1">
                        <SidebarMenuButton asChild isActive={isActive} className="flex-1">
                          <NavLink 
                            to={page.url} 
                            end={page.url === "/"}
                            className="flex items-center gap-3 hover:bg-accent rounded-md transition-all duration-150 py-2 px-2 w-full"
                            activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[6px]"
                            title={page.title}
                          >
                            <PageIcon className="h-4 w-4 shrink-0" />
                            {open && <span className="text-sm truncate flex-1 text-left">{page.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                        {open && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              togglePin(page.url);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-accent rounded transition-all"
                            title="Unpin page"
                          >
                            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                          </button>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
            <Separator className="mb-4" />
          </>
        )}
        
        {/* Recently Visited Section */}
        {recentPages.length > 0 && (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <History className="h-4 w-4 text-muted-foreground shrink-0" />
                {open && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent</span>}
              </div>
              <SidebarMenu className="space-y-0.5">
                {recentPages.map((page) => {
                  const isActive = page.url === "/" 
                    ? currentPath === "/"
                    : currentPath.startsWith(page.url);
                  // Look up icon from navigation items
                  const navItem = allNavItems.find(item => item.url === page.url);
                  const PageIcon = navItem?.icon || Home;

                  return (
                    <SidebarMenuItem key={page.url} className="group/item">
                      <div className="flex items-center gap-1">
                        <SidebarMenuButton asChild isActive={isActive} className="flex-1">
                          <NavLink 
                            to={page.url} 
                            end={page.url === "/"}
                            className="flex items-center gap-3 hover:bg-accent rounded-md transition-all duration-150 py-2 px-2 w-full"
                            activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[6px]"
                            title={page.title}
                          >
                            <PageIcon className="h-4 w-4 shrink-0" />
                            {open && <span className="text-sm truncate flex-1 text-left">{page.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                        {open && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              togglePin(page.url);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-accent rounded transition-all"
                            title="Pin page"
                          >
                            <Star className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </button>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
            <Separator className="mb-4" />
          </>
        )}

        {/* Main Navigation Groups */}
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
                    <div className="flex items-center gap-2 shrink-0">
                      {!isExpanded && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                          {group.items.length}
                        </span>
                      )}
                      <ChevronDown 
                        className={`h-4 w-4 transition-all duration-200 shrink-0 ${isExpanded ? "rotate-180" : "rotate-0"} ${!open ? "opacity-0 w-0" : "opacity-100"}`} 
                      />
                    </div>
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
                          <SidebarMenuItem key={item.title} className="group/item">
                            <div className="flex items-center gap-1">
                              <SidebarMenuButton asChild isActive={isActive} className="flex-1">
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
                              {open && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    togglePin(item.url);
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-accent rounded transition-all"
                                  title={isPinned(item.url) ? "Unpin page" : "Pin page"}
                                >
                                  <Star 
                                    className={`h-3.5 w-3.5 ${isPinned(item.url) ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-primary'}`} 
                                  />
                                </button>
                              )}
                            </div>
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
