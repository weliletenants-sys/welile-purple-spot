import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppShareButtonProps {
  message: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const WhatsAppShareButton = ({
  message,
  variant = "default",
  size = "default",
  className = "",
}: WhatsAppShareButtonProps) => {
  const handleWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    try {
      window.open(whatsappUrl, "_blank");
      toast.success("Opening WhatsApp...");
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      toast.error("Failed to open WhatsApp");
    }
  };

  return (
    <Button
      onClick={handleWhatsAppShare}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      Share on WhatsApp
    </Button>
  );
};
