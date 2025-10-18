import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { WelileLogo } from "./WelileLogo";
import { Lock } from "lucide-react";

const ACCESS_CODE = "Welile123";

export const AccessCode = ({ onAccessGranted }: { onAccessGranted: () => void }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (code === ACCESS_CODE) {
        localStorage.setItem("welile_access", "granted");
        onAccessGranted();
        toast({
          title: "Access Granted",
          description: "Welcome to Welile Tenants Hub",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid access code. Please try again.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <WelileLogo />
          <h1 className="text-2xl font-bold text-foreground">Access Required</h1>
          <p className="text-muted-foreground text-center">
            Enter the access code to view the tenant management system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter access code"
                required
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Access System"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
