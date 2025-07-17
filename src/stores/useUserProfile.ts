import { create } from "zustand";

type UserProfile = {
  address: string;
  avatar: string;
  username: string;
  setAddress: (addr: string) => void;
  setAvatar: (avatar: string) => void;
  setUsername: (username: string) => void;
};

export const useUserProfile = create<UserProfile>((set) => ({
  address: "",
  avatar: "little_wea",
  username: "",
  setAddress: (address) => set({ address }),
  setAvatar: (avatar) => set({ avatar }),
  setUsername: (username) => set({ username }),
}));
