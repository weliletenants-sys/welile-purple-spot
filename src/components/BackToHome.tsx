import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const BackToHome = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate("/")}
      className="fixed top-4 left-4 z-50 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg border-primary/20 hover:border-primary"
    >
      <Home className="h-4 w-4" />
      Home
    </Button>
  );
};
