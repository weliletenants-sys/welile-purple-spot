import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, LogOut, User, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        
        // Wait a moment to check if an update was found
        setTimeout(() => {
          setIsCheckingUpdate(false);
          toast({
            title: "✅ Update Check Complete",
            description: "You're running the latest version. If an update was found, you'll be prompted to install it.",
            duration: 4000,
          });
        }, 2000);
      } catch (error) {
        setIsCheckingUpdate(false);
        toast({
          title: "❌ Update Check Failed",
          description: "Could not check for updates. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      setIsCheckingUpdate(false);
      toast({
        title: "Not Supported",
        description: "Update checking is not available in this browser.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
        <LogIn className="h-4 w-4 mr-2" />
        Login
      </Button>
    );
  }

  const userInitial = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.email}
            </p>
            {isAdmin && (
              <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Administrator
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/agent-management")}>
            <User className="mr-2 h-4 w-4" />
            <span>Agent Management</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCheckForUpdates} disabled={isCheckingUpdate}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          <span>{isCheckingUpdate ? 'Checking...' : 'Check for Updates'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
