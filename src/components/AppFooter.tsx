import { useWhatsNew } from "@/hooks/useWhatsNew";

export const AppFooter = () => {
  const { currentVersion } = useWhatsNew();
  
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>Version {currentVersion}</span>
        </div>
      </div>
    </footer>
  );
};
