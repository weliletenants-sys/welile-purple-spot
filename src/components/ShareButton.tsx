import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
}

export const ShareButton = ({ 
  title = "Welile Tenants Hub",
  text = "Check out the Welile Tenants Hub",
  url = window.location.origin
}: ShareButtonProps) => {
  const handleShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success("Shared successfully!");
      } catch (error: any) {
        // User cancelled the share
        if (error.name !== 'AbortError') {
          console.error("Error sharing:", error);
          fallbackToWhatsApp();
        }
      }
    } else {
      // Fallback to WhatsApp direct link
      fallbackToWhatsApp();
    }
  };

  const fallbackToWhatsApp = () => {
    const message = encodeURIComponent(`${text} ${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
};
