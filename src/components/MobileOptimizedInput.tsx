import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { ComponentProps } from "react";

interface MobileOptimizedInputProps extends ComponentProps<typeof Input> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const MobileOptimizedInput = ({ 
  icon,
  iconPosition = "left",
  className,
  ...props 
}: MobileOptimizedInputProps) => {
  return (
    <div className="relative flex-1">
      {icon && iconPosition === "left" && (
        <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
      <Input
        {...props}
        className={cn(
          "text-sm sm:text-base",
          "h-10 sm:h-11",
          "tap-target",
          icon && iconPosition === "left" && "pl-8 sm:pl-9",
          icon && iconPosition === "right" && "pr-8 sm:pr-9",
          className
        )}
      />
      {icon && iconPosition === "right" && (
        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
};
