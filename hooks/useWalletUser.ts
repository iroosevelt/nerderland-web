// hooks/useWalletUser.ts

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateWalletUser } from "@/lib/auth/walletUser";
import { useEffect, useCallback } from "react";
import { useUserProfile } from "@/stores/useUserProfile";

// Updated user type to match the exact database schema
export type WalletUser = {
  id: number;
  wallet_address: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  nerdy_points: number | null;
  level: number | null;
  created_at: Date | null;
  dob: string | null;
};

export const useWalletUser = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { user: globalUser, setUser: setGlobalUser } = useUserProfile();

  const fetchUser = useCallback(async (): Promise<WalletUser | null> => {
    if (!address || !isConnected) return null;

    try {
      const user = await getOrCreateWalletUser(address);
      return user;
    } catch (error) {
      console.error("Error fetching wallet user:", error);
      return null;
    }
  }, [address, isConnected]);

  const { data, refetch, isLoading, error, isError } = useQuery({
    queryKey: ["walletUser", address],
    queryFn: fetchUser,
    enabled: !!address && isConnected,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Sync with global state
  useEffect(() => {
    if (data && data !== globalUser) {
      setGlobalUser(data);
    } else if (!isConnected && !isConnecting) {
      setGlobalUser(null);
    }
  }, [data, globalUser, setGlobalUser, isConnected, isConnecting]);

  // Update profile function
  const updateProfile = useCallback(
    async (updates: Partial<WalletUser>) => {
      if (!address || !data) return null;

      try {
        const response = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updates,
            address,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile");
        }

        const result = await response.json();

        if (result.success) {
          // Refetch user data to get updated info
          await refetch();
          return result.user;
        } else {
          throw new Error(result.error || "Update failed");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
    },
    [address, data, refetch]
  );

  // Check username availability - simplified without rate limiting
  const checkUsernameAvailability = useCallback(async (username: string) => {
    try {
      const response = await fetch("/api/username/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      // Return the result from the API (contains available, username, message, error)
      return result;
    } catch (networkError) {
      console.error("Network error checking username:", networkError);
      return {
        available: false,
        error: "Network error. Please check your connection.",
      };
    }
  }, []);

  return {
    user: data || globalUser,
    isLoading: isLoading || isConnecting,
    isConnected,
    isError,
    error,
    mutate: refetch,
    updateProfile,
    checkUsernameAvailability,
    // Helper methods
    hasUsername: !!(data?.username || globalUser?.username),
    isOwner: (username: string) => {
      const userUsername = data?.username || globalUser?.username;
      return userUsername === username;
    },
  };
};
