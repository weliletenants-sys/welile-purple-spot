import { Command } from "lucide-react";

export const KeyboardShortcutsHint = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? "⌘" : "Ctrl";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
        <Command className="h-4 w-4" />
        <span>Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">{modifier}+K</kbd> to search</span>
      </div>
    </div>
  );
};
