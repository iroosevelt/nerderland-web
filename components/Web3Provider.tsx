// components/Web3Provider.tsx
"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WalletAuthProvider } from "./providers/WalletAuthProvider";
import { Suspense, useMemo } from "react";
import Loader from "./Loader";

// Memoized config for performance
const createWagmiConfig = () =>
  createConfig(
    getDefaultConfig({
      chains: [mainnet],
      transports: {
        [mainnet.id]: http(
          `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
        ),
      },
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      appName: "Nerderland",
      appDescription: "Nerderland",
      appUrl: "https://nerderland.com",
      appIcon: "https://family.co/logo.png",
    })
  );

// Optimized QueryClient configuration
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });

interface Web3ProviderProps {
  children: React.ReactNode;
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Loader />
    </div>
  );
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  // Memoize expensive computations
  const config = useMemo(createWagmiConfig, []);
  const queryClient = useMemo(createQueryClient, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <WalletAuthProvider>{children}</WalletAuthProvider>
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Suspense>
  );
};
