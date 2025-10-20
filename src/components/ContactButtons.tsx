import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactButtonsProps {
  phoneNumber: string;
  size?: "sm" | "default" | "lg";
  iconOnly?: boolean;
}

export const ContactButtons = ({ phoneNumber, size = "sm", iconOnly = false }: ContactButtonsProps) => {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Format Ugandan phone number for WhatsApp
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    // If number starts with 0, remove it and add 256
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '256' + formattedNumber.substring(1);
    }
    // If number doesn't start with 256, add it
    else if (!formattedNumber.startsWith('256')) {
      formattedNumber = '256' + formattedNumber;
    }
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  if (iconOnly) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCall}
          className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
        >
          <Phone className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWhatsApp}
          className="h-6 w-6 hover:bg-green-500/10 hover:text-green-600"
        >
          <MessageCircle className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size={size}
        onClick={handleCall}
        className="gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary"
      >
        <Phone className="w-3 h-3" />
        Call
      </Button>
      <Button
        variant="outline"
        size={size}
        onClick={handleWhatsApp}
        className="gap-1 hover:bg-green-500/10 hover:text-green-600 hover:border-green-600"
      >
        <MessageCircle className="w-3 h-3" />
        WhatsApp
      </Button>
    </div>
  );
};
