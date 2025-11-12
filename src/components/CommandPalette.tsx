import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePageHistory, getHistory, clearHistory } from "@/hooks/usePageHistory";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Upload,
  FileUp,
  LogIn,
  Shield,
  Hourglass,
  ChartLine,
  History,
  Trash2,
} from "lucide-react";

interface PageItem {
  title: string;
  url: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
}

const pages: PageItem[] = [
  // Overview
  { title: "Home", url: "/", icon: Home, group: "Overview" },
  { title: "Executive Dashboard", url: "/executive-dashboard", icon: LayoutDashboard, group: "Overview", keywords: ["stats", "overview", "dashboard"] },
  
  // Agents
  { title: "Agent Dashboard", url: "/agent-dashboard", icon: Users, group: "Agents", keywords: ["agents", "performance", "earnings"] },
  { title: "Agent Management", url: "/agent-management", icon: UserCog, group: "Agents", keywords: ["add agent", "edit agent", "manage agents"] },
  { title: "Agent Performance", url: "/agent-performance", icon: TrendingUp, group: "Agents", keywords: ["performance", "metrics", "analytics"] },
  { title: "Top Performers", url: "/top-performers", icon: Award, group: "Agents", keywords: ["leaderboard", "best agents", "rankings"] },
  
  // Tenants
  { title: "Pipeline Tenants", url: "/pipeline-tenants", icon: Target, group: "Tenants", keywords: ["pending", "prospects", "pipeline"] },
  { title: "Recently Added Tenants", url: "/recently-added", icon: Clock, group: "Tenants", keywords: ["new", "latest", "recent"] },
  { title: "Risk Dashboard", url: "/risk-dashboard", icon: AlertTriangle, group: "Tenants", keywords: ["risk", "overdue", "problem tenants"] },
  { title: "Missed Payments", url: "/missed-payments", icon: DollarSign, group: "Tenants", keywords: ["unpaid", "overdue", "late payments"] },
  
  // Recording
  { title: "Recording Activity", url: "/recording-activity", icon: Activity, group: "Recording", keywords: ["logs", "history", "recordings"] },
  { title: "Monthly Summary", url: "/monthly-summary", icon: FileText, group: "Recording", keywords: ["report", "summary", "monthly"] },
  
  // Service Centers
  { title: "Service Center Analytics", url: "/service-center-analytics", icon: BarChart3, group: "Service Centers", keywords: ["analytics", "performance", "centers"] },
  { title: "Service Center Management", url: "/service-center-management", icon: Building2, group: "Service Centers", keywords: ["manage", "centers", "locations"] },
  { title: "Transfer Analytics", url: "/service-center-transfer-analytics", icon: GitBranch, group: "Service Centers", keywords: ["transfers", "moves", "reassignments"] },
  
  // Analytics
  { title: "Pipeline Analytics", url: "/pipeline-analytics", icon: ChartLine, group: "Analytics", keywords: ["pipeline", "forecasts", "predictions"] },
  { title: "Leaderboard", url: "/leaderboard", icon: Award, group: "Analytics", keywords: ["rankings", "top", "leaders"] },
  
  // Management
  { title: "Landlord Management", url: "/landlord-management", icon: Building2, group: "Management", keywords: ["landlords", "owners", "properties"] },
  { title: "Withdrawal History", url: "/withdrawal-history", icon: Wallet, group: "Management", keywords: ["withdrawals", "payouts", "payments"] },
  
  // Admin & Tools
  { title: "Bulk Add Tenants", url: "/bulk-add", icon: Upload, group: "Tools", keywords: ["import", "bulk", "add multiple"] },
  { title: "Auto Import", url: "/auto-import", icon: FileUp, group: "Tools", keywords: ["import", "upload", "excel"] },
  { title: "Admin Dashboard", url: "/admin-dashboard", icon: Shield, group: "Admin", keywords: ["admin", "settings", "configuration"] },
  { title: "Agent Portal", url: "/agent-portal", icon: UserCheck, group: "Agent Portal", keywords: ["portal", "agent view"] },
];

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [recentPages, setRecentPages] = useState(getHistory());
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track page history
  usePageHistory();

  // Update recent pages when dialog opens
  useEffect(() => {
    if (open) {
      setRecentPages(getHistory());
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const handleClearHistory = () => {
    clearHistory();
    setRecentPages([]);
  };

  // Group pages by category
  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.group]) {
      acc[page.group] = [];
    }
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, PageItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (Ctrl/Cmd+K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Recent Pages */}
        {recentPages.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentPages.map((page) => {
                // Find icon for this page
                const pageData = pages.find(p => p.url === page.url);
                const Icon = pageData?.icon || History;
                
                return (
                  <CommandItem
                    key={page.url}
                    value={`recent ${page.title}`}
                    onSelect={() => handleSelect(page.url)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{page.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Recent</span>
                  </CommandItem>
                  );
                })}
                <CommandItem
                  value="clear recent history"
                  onSelect={handleClearHistory}
                  className="flex items-center gap-3 cursor-pointer text-destructive"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>Clear recent history</span>
                </CommandItem>
              </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        {/* All Pages */}
        {Object.entries(groupedPages).map(([group, items], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((page) => (
                <CommandItem
                  key={page.url}
                  value={`${page.title} ${page.keywords?.join(" ") || ""}`}
                  onSelect={() => handleSelect(page.url)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <page.icon className="h-4 w-4 shrink-0" />
                  <span>{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
