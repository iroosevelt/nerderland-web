"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/stores/useUserProfile";
import { useWalletUser } from "@/hooks/useWalletUser";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ProfileHeader } from "./ProfileHeader";

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

interface AdminSidebarProps {
  userData: {
    user: {
      id: number;
      username: string | null;
      email: string | null;
      avatar_url: string | null;
      nerdy_points: number | null;
      level: number | null;
      created_at: Date | null;
      wallet_address: string;
      dob: string | null;
      formatted_created_at: string;
    };
    stats: {
      stories: number;
      boards: number;
    };
  };
}

export function AdminSidebar({ userData }: AdminSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: userData.user.username || "",
    email: userData.user.email || "",
    dob: userData.user.dob || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  const { setUser } = useUserProfile();
  const { checkUsernameAvailability } = useWalletUser();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const checkUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (username === userData.user.username) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    try {
      const result = await checkUsernameAvailability(username);

      if (result.available) {
        setUsernameStatus("available");
        setUsernameMessage(result.message || "Available");
      } else {
        if (result.error) {
          if (result.error.includes("2 and 20 characters")) {
            setUsernameStatus("invalid");
            setUsernameMessage("Username must be 2-20 characters");
          } else if (
            result.error.includes("letters, numbers, and underscores")
          ) {
            setUsernameStatus("invalid");
            setUsernameMessage(
              "Only letters, numbers, and underscores allowed"
            );
          } else if (result.error.includes("start or end with an underscore")) {
            setUsernameStatus("invalid");
            setUsernameMessage("Cannot start or end with underscore");
          } else if (result.error === "Reserved") {
            setUsernameStatus("invalid");
            setUsernameMessage("This username is reserved");
          } else {
            setUsernameStatus("taken");
            setUsernameMessage(result.message || "Already taken");
          }
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(result.message || "Already taken");
        }
      }
    } catch {
      setUsernameStatus("error");
      setUsernameMessage("Error checking username availability");
    }
  };

  const handleUsernameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, username: value }));
    checkUsername(value);
  };

  useEffect(() => {
    if (!isEditing) {
      setUsernameStatus("idle");
      setUsernameMessage("");
    }
  }, [isEditing]);

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case "available":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "taken":
      case "invalid":
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case "available":
        return "text-green-400";
      case "taken":
      case "invalid":
      case "error":
        return "text-red-400";
      case "checking":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (
      usernameStatus === "taken" ||
      usernameStatus === "invalid" ||
      usernameStatus === "error"
    ) {
      toast.error("Please fix username issues before saving");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          dob: formData.dob,
          address: userData.user.wallet_address,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUser(result.user);
        setIsEditing(false);
        setUsernameStatus("idle");
        setUsernameMessage("");
        toast.success("Profile updated successfully");

        if (result.user.username !== userData.user.username) {
          router.push(`/${result.user.username}`);
        }
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUser(null);
    toast.success("Wallet disconnected");
    window.location.href = "/";
  };


  return (
    <div className="w-full lg:w-[350px] bg-black/50 ml-auto p-3 px-6 border-b lg:border-b-0 lg:border-l border-white/10 flex-shrink-0 overflow-y-auto lg:order-2">
      <ProfileHeader
        username={userData.user.username}
        level={userData.user.level || 1}
        nerdy_points={userData.user.nerdy_points || 0}
        formatted_created_at={userData.user.formatted_created_at}
        stats={userData.stats}
      >
        {isEditing ? (
          <div className="space-y-3 sm:space-y-4 w-full">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full bg-black border border-white/20 px-2 sm:px-3 py-2 pr-8 sm:pr-10 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
                  placeholder="Enter username"
                  maxLength={20}
                />
                <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                  {getUsernameStatusIcon()}
                </div>
              </div>
              {usernameMessage && (
                <p
                  className={`text-xs mt-1 flex items-center gap-1 ${getUsernameStatusColor()}`}
                >
                  {usernameMessage}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 break-all">
                nerderland.com/{formData.username || "username"}
              </p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-black border border-white/20 px-2 sm:px-3 py-2 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Date of Birth (optional)
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className="w-full bg-black border border-white/20 px-2 sm:px-3 py-2 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={
                isLoading ||
                usernameStatus === "checking" ||
                usernameStatus === "taken" ||
                usernameStatus === "invalid" ||
                usernameStatus === "error"
              }
              className="bg-[var(--color-yellow)] text-black hover:bg-[var(--color-yellow)] disabled:opacity-50 w-full rounded-none text-xs sm:text-sm"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : null}
      </ProfileHeader>

      <div className="flex flex-col sm:flex-row gap-2 w-full mt-3">
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          className="border-white/20 text-xs sm:text-sm rounded-none flex-1"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
        <Button
          onClick={handleDisconnect}
          className="text-xs sm:text-sm rounded-none bg-[var(--color-blue)] hover:bg-[var(--color-blue)] text-[var(--color-yellow)] flex-1"
        >
          Disconnect
        </Button>
      </div>

      {/* <div className="mt-8 sm:mt-12 border-t border-red-500/20 pt-6 sm:pt-8">
        <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-4">
          Danger Zone
        </h3>
        <Button
          onClick={handleDeleteAccount}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-sm w-full sm:w-auto"
        >
          Delete Account
        </Button>
      </div> */}
    </div>
  );
}
