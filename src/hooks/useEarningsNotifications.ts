import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface EarningsNotificationProps {
  agentName?: string;
  agentPhone?: string;
  enabled?: boolean;
}

export const useEarningsNotifications = ({
  agentName,
  agentPhone,
  enabled = true,
}: EarningsNotificationProps) => {
  const processedEarnings = useRef(new Set<string>());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!enabled || (!agentName && !agentPhone)) return;

    // Mark initial load complete after a short delay
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 2000);

    const channel = supabase
      .channel(`earnings-notifications-${agentName || agentPhone}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_earnings",
          filter: agentName 
            ? `agent_name=eq.${agentName}`
            : `agent_phone=eq.${agentPhone}`,
        },
        (payload) => {
          // Skip notifications during initial load
          if (isInitialLoad.current) return;

          const earning = payload.new;
          const earningId = earning.id;

          // Prevent duplicate notifications
          if (processedEarnings.current.has(earningId)) return;
          processedEarnings.current.add(earningId);

          // Don't notify for withdrawals
          if (earning.earning_type === "withdrawal") return;

          const amount = Number(earning.amount);
          const earningType = earning.earning_type;

          // Show notification based on earning type
          showEarningNotification(earningType, amount);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [agentName, agentPhone, enabled]);

  const showEarningNotification = (type: string, amount: number) => {
    const formattedAmount = `UGX ${amount.toLocaleString()}`;

    switch (type) {
      case "commission":
        toast.success("💰 Commission Earned!", {
          description: `You earned ${formattedAmount} in commission`,
          duration: 5000,
        });
        triggerCelebration();
        break;

      case "signup_bonus":
        toast.success("🎉 Signup Bonus!", {
          description: `You earned ${formattedAmount} for signing up a new tenant`,
          duration: 5000,
        });
        triggerCelebration();
        break;

      case "recording_bonus":
        toast.success("⚡ Recording Bonus!", {
          description: `You earned ${formattedAmount} for recording a payment`,
          duration: 4000,
        });
        break;

      case "data_entry":
        toast.success("📝 Data Entry Reward!", {
          description: `You earned ${formattedAmount} for data entry`,
          duration: 4000,
        });
        break;

      case "pipeline_bonus":
        toast.success("🚀 Pipeline Bonus!", {
          description: `You earned ${formattedAmount} for adding a pipeline tenant`,
          duration: 5000,
          className: "bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/50",
        });
        triggerPipelineCelebration();
        break;

      case "verification_reward":
        toast.success("✅ Verification Reward!", {
          description: `You earned ${formattedAmount} for verification`,
          duration: 4000,
        });
        break;

      case "referral_bonus":
        toast.success("🤝 Referral Bonus!", {
          description: `You earned ${formattedAmount} for a referral`,
          duration: 5000,
        });
        triggerCelebration();
        break;

      case "quality_bonus":
        toast.success("⭐ Quality Bonus!", {
          description: `You earned ${formattedAmount} for quality work`,
          duration: 5000,
        });
        triggerCelebration();
        break;

      case "completion_reward":
        toast.success("🎯 Completion Reward!", {
          description: `You earned ${formattedAmount} for completion`,
          duration: 5000,
        });
        triggerCelebration();
        break;

      case "special_incentive":
        toast.success("✨ Special Incentive!", {
          description: `You earned ${formattedAmount} as a special incentive`,
          duration: 6000,
          className: "bg-gradient-to-r from-yellow-500/10 to-orange-600/10 border-yellow-500/50",
        });
        triggerSpecialCelebration();
        break;

      default:
        toast.success("💵 Reward Earned!", {
          description: `You earned ${formattedAmount}`,
          duration: 4000,
        });
        break;
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#7E3AF2", "#E74694", "#F59E0B"],
    });
  };

  const triggerPipelineCelebration = () => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#A855F7", "#EC4899", "#8B5CF6"],
      shapes: ["circle"],
    });
  };

  const triggerSpecialCelebration = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 2,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ["#FFD700", "#FFA500", "#FF6347"],
      });
    }, 100);
  };
};
