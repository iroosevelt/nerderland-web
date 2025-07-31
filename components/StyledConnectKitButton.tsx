// components/StyledConnectKitButton.tsx
"use client";

import { ConnectKitButton } from "connectkit";

export const StyledConnectKitButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        return (
          <button
            onClick={show}
            className="bg-black text-[#FFF200] px-4 py-2 text-sm font-bold border border-[#FFF200] hover:bg-[#FFF200] hover:text-black transition-colors w-full"
          >
            {isConnected
              ? ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`
              : isConnecting
              ? "Connecting..."
              : "Connect Wallet"}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
