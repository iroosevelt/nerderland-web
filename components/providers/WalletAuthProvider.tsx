"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useRef, useCallback } from "react";
import { useUserProfile } from "@/stores/useUserProfile";
import { generateSessionId, validateSession } from "@/lib/auth/session";

export function WalletAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    setConnectionState,
    clearUser,
    user,
    setSessionId,
    updateActivity,
    isSessionValid,
  } = useUserProfile();

  // Fixed: Provide initial value for useRef
  const prevAddress = useRef<string | undefined>(undefined);
  const sessionCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const activityCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const setSecureCookie = useCallback(
    (name: string, value: string, maxAge: number = 7 * 24 * 60 * 60) => {
      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict${
        isSecure ? "; Secure" : ""
      }`;
    },
    []
  );

  const deleteCookie = useCallback((name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }, []);

  const initializeSession = useCallback(
    async (walletAddress: string) => {
      try {
        const sessionId = generateSessionId();
        const isValid = await validateSession(sessionId, walletAddress);

        if (isValid) {
          setSessionId(sessionId);
          setSecureCookie("session-id", sessionId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Session initialization failed:", error);
        return false;
      }
    },
    [setSessionId, setSecureCookie]
  );

  // Security: Detect address changes
  useEffect(() => {
    if (prevAddress.current && prevAddress.current !== address && isConnected) {
      console.warn("Wallet address changed - clearing session for security");
      clearUser();
      deleteCookie("wallet-address");
      deleteCookie("session-id");
    }
    prevAddress.current = address;
  }, [address, isConnected, clearUser, deleteCookie]);

  // Connection state management
  useEffect(() => {
    if (isConnecting) {
      setConnectionState("connecting");
    } else if (isConnected && address) {
      initializeSession(address).then((success) => {
        if (success) {
          setConnectionState("connected");
          setSecureCookie("wallet-address", address);
          console.log(
            "Secure session established:",
            address.slice(0, 6) + "..."
          );
        } else {
          setConnectionState("error");
          console.error("Session initialization failed");
        }
      });
    } else {
      setConnectionState("disconnected");
      clearUser();
      deleteCookie("wallet-address");
      deleteCookie("session-id");
      deleteCookie("username");
    }
  }, [
    isConnected,
    isConnecting,
    address,
    setConnectionState,
    clearUser,
    deleteCookie,
    setSecureCookie,
    initializeSession,
  ]);

  // Username cookie sync
  useEffect(() => {
    if (user?.username && isConnected && isSessionValid()) {
      setSecureCookie("username", user.username);
    } else if (!isConnected) {
      deleteCookie("username");
    }
  }, [
    user?.username,
    isConnected,
    isSessionValid,
    setSecureCookie,
    deleteCookie,
  ]);

  // Session validation
  useEffect(() => {
    if (isConnected && address) {
      sessionCheckInterval.current = setInterval(async () => {
        if (!isSessionValid()) {
          console.log("Session expired - logging out");
          disconnect();
          clearUser();
        }
      }, 5 * 60 * 1000);

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
        }
      };
    }
  }, [isConnected, address, isSessionValid, disconnect, clearUser]);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => updateActivity();

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) =>
      document.addEventListener(event, handleActivity, true)
    );

    activityCheckInterval.current = setInterval(handleActivity, 60 * 1000);

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity, true)
      );
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current);
      }
    };
  }, [updateActivity]);

  // Page visibility handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isConnected) {
        if (!isSessionValid()) {
          console.log("Invalid session detected on focus - clearing");
          clearUser();
          disconnect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isConnected, isSessionValid, clearUser, disconnect]);

  // Global disconnect handler
  useEffect(() => {
    const handleManualDisconnect = () => {
      disconnect();
      clearUser();
      deleteCookie("wallet-address");
      deleteCookie("session-id");
      deleteCookie("username");
    };

    window.addEventListener("wallet-disconnect", handleManualDisconnect);
    return () =>
      window.removeEventListener("wallet-disconnect", handleManualDisconnect);
  }, [disconnect, clearUser, deleteCookie]);

  return <>{children}</>;
}
