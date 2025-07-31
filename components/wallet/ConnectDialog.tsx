// components/wallet/ConnectDialog.tsx

"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useWalletUser } from "@/hooks/useWalletUser";
import { useEffect } from "react";
import { StyledConnectKitButton } from "../StyledConnectKitButton";

interface ConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void; // Make this optional
}

export const ConnectDialog = ({
  open,
  onClose,
  onConnected,
}: ConnectDialogProps) => {
  const { isConnected, mutate } = useWalletUser();

  useEffect(() => {
    if (isConnected && open) {
      onClose();
      mutate(); // triggers user creation/fetch
      onConnected?.(); // Call onConnected if provided
    }
  }, [isConnected, open, onClose, onConnected, mutate]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm flex flex-col items-center justify-center text-center">
        <DialogTitle className="font-display">
          Connect to Nerderland
        </DialogTitle>
        <div className="w-fit flex items-center justify-center py-4 px-4">
          <StyledConnectKitButton />
        </div>
      </DialogContent>
    </Dialog>
  );
};
