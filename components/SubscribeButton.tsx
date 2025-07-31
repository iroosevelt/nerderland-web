// components/SubscribeButton.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWalletUser } from "@/hooks/useWalletUser";
import { toast } from "sonner";

interface SubscribeButtonProps {
  targetUserId?: number;
  targetUsername: string;
  initialSubscribed?: boolean;
  size?: "sm" | "lg" | "default";
  className?: string;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export function SubscribeButton({
  targetUserId,
  targetUsername,
  initialSubscribed = false,
  size = "default",
  className = "",
  onSubscriptionChange,
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useWalletUser();

  // Sync with initialSubscribed prop changes
  useEffect(() => {
    setIsSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  // Don't show subscribe button for own profile
  if (
    user?.username === targetUsername ||
    (targetUserId && user?.id === targetUserId)
  ) {
    return null;
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please connect your wallet to subscribe");
      return;
    }

    // Prevent multiple rapid clicks
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    
    // Store the current state before updating
    const previousState = isSubscribed;

    // Update UI immediately for instant feedback
    const newSubscribedState = !isSubscribed;
    setIsSubscribed(newSubscribedState);
    onSubscriptionChange?.(newSubscribedState);

    // Show success message immediately
    toast.success(
      newSubscribedState
        ? `Subscribed to ${targetUsername}!`
        : `Unsubscribed from ${targetUsername}`
    );

    // Make API call in background
    try {
      const method = newSubscribedState ? "POST" : "DELETE";
      const response = await fetch(`/api/users/${targetUsername}/subscribe`, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        // Revert UI state if API call fails
        setIsSubscribed(previousState);
        onSubscriptionChange?.(previousState);

        const error = await response.json();
        if (response.status === 429) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else {
          toast.error(error.error || "Failed to update subscription");
        }
      }
    } catch {
      // Revert UI state if API call fails
      setIsSubscribed(previousState);
      onSubscriptionChange?.(previousState);
      toast.error("Failed to update subscription");
    } finally {
      // Add a small delay to prevent rapid successive requests
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  const baseClasses = "font-medium transition-colors whitespace-nowrap";

  // Custom styling based on subscription state
  const getButtonClasses = () => {
    if (isSubscribed) {
      // Subscribed state: grey border with greyed-out text
      return "!border !border-gray-600 !text-gray-400 !bg-transparent hover:!bg-gray-800/20";
    } else {
      // Subscribe state: active yellow background with black text
      return "!bg-[var(--color-yellow)] hover:!bg-yellow-500 !text-black !border-0";
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`${baseClasses} ${sizeClasses[size]} border-gray-600 text-gray-500 ${className}`}
      >
        Subscribe
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isProcessing}
      variant={isSubscribed ? "outline" : "default"}
      size={size}
      className={`${baseClasses} ${sizeClasses[size]} ${getButtonClasses()} ${className}`}
      style={
        isSubscribed
          ? {
              borderColor: "#6b7280",
              color: "#9ca3af",
              backgroundColor: "transparent",
              opacity: isProcessing ? 0.7 : 1,
            }
          : {
              backgroundColor: "var(--color-yellow)",
              color: "black",
              border: "none",
              opacity: isProcessing ? 0.7 : 1,
            }
      }
    >
      {isSubscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}

export default SubscribeButton;
