import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { generateShareImage } from "./ShareCard";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  shareCardId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export const ShareButton = ({
  title = "Welile Tenants Hub",
  text = "Check out the Welile Tenants Hub",
  url = window.location.origin,
  shareCardId,
  variant = "outline",
  size = "sm",
}: ShareButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          toast.error("Failed to share");
        }
      }
    } else {
      toast.error("Sharing not supported on this device");
    }
  };

  const handleDownloadImage = async () => {
    if (!shareCardId) {
      toast.error("Share card not available");
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await generateShareImage(shareCardId, "achievement");
      
      // Download the image
      const link = document.createElement("a");
      link.download = `welile-achievement-${Date.now()}.png`;
      link.href = imageUrl;
      link.click();
      
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${text} ${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleWebShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share via...
        </DropdownMenuItem>
        {shareCardId && (
          <DropdownMenuItem onClick={handleDownloadImage} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Image"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
