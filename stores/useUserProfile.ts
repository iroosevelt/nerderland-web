// stores/useUserProfile.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

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

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

type UserProfileStore = {
  // Core state
  user: WalletUser | null;
  connectionState: ConnectionState;
  isLoading: boolean;
  sessionId: string | null;
  lastActivity: number;

  // Rate limiting cache
  rateLimitCache: Map<string, { count: number; resetTime: number }>;

  // Actions
  setUser: (user: WalletUser | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  updateUserField: (field: keyof WalletUser, value: any) => void;
  updateActivity: () => void;
  setSessionId: (sessionId: string | null) => void;

  // Rate limiting
  checkRateLimit: (key: string, limit: number, windowMs: number) => boolean;

  // Computed values
  isConnected: () => boolean;
  hasUsername: () => boolean;
  isOwner: (username: string) => boolean;
  isSessionValid: () => boolean;
};

// Session timeout: 24 hours
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export const useUserProfile = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      connectionState: "disconnected",
      isLoading: false,
      sessionId: null,
      lastActivity: Date.now(),
      rateLimitCache: new Map(),

      // Core actions
      setUser: (user) => {
        set({
          user,
          connectionState: user ? "connected" : "disconnected",
          isLoading: false,
          lastActivity: Date.now(),
        });
      },

      setConnectionState: (connectionState) => {
        set((state) => {
          const newState = { connectionState };
          if (connectionState === "disconnected") {
            return { ...newState, user: null, sessionId: null };
          }
          return newState;
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      clearUser: () => {
        set({
          user: null,
          connectionState: "disconnected",
          isLoading: false,
          sessionId: null,
          lastActivity: Date.now(),
        });
        // Clear sensitive data from storage
        localStorage.removeItem("wallet-address");
        sessionStorage.clear();
      },

      updateUserField: (field, value) => {
        set((state) => ({
          user: state.user ? { ...state.user, [field]: value } : null,
          lastActivity: Date.now(),
        }));
      },

      updateActivity: () => set({ lastActivity: Date.now() }),

      setSessionId: (sessionId) => set({ sessionId }),

      // Rate limiting implementation
      checkRateLimit: (key, limit, windowMs) => {
        const now = Date.now();
        const cache = get().rateLimitCache;
        const record = cache.get(key);

        if (!record || now > record.resetTime) {
          // Create new record or reset expired one
          cache.set(key, { count: 1, resetTime: now + windowMs });
          set({ rateLimitCache: new Map(cache) });
          return true;
        }

        if (record.count >= limit) {
          return false; // Rate limit exceeded
        }

        // Increment count
        record.count++;
        cache.set(key, record);
        set({ rateLimitCache: new Map(cache) });
        return true;
      },

      // Computed values
      isConnected: () => get().connectionState === "connected",
      hasUsername: () => !!get().user?.username,
      isOwner: (username) => get().user?.username === username,
      isSessionValid: () => {
        const { lastActivity, sessionId } = get();
        return !!(sessionId && Date.now() - lastActivity < SESSION_TIMEOUT);
      },
    }),
    {
      name: "user-profile",
      partialize: (state) => ({
        user: state.user,
        sessionId: state.sessionId,
        lastActivity: state.lastActivity,
      }),
    }
  )
);

// Selector hooks for performance
export const useUser = () => useUserProfile((state) => state.user);
export const useConnectionState = () =>
  useUserProfile((state) => state.connectionState);
export const useIsConnected = () =>
  useUserProfile((state) => state.isConnected());
export const useHasUsername = () =>
  useUserProfile((state) => state.hasUsername());
export const useIsLoading = () => useUserProfile((state) => state.isLoading);
