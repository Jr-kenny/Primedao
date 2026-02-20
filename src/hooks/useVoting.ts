import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { votingClient } from "@/lib/voting-client";
import { toast } from "sonner";

export function useVoting() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(
    async (proposalId: number, optionIndex: number) => {
      if (!wallet.publicKey) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        toast.info("Encrypting your vote via Arcium MPC...");
        await votingClient.initialize(wallet);
        const tx = await votingClient.castVote({
          proposalId,
          optionIndex,
          walletPublicKey: wallet.publicKey,
        });
        toast.success("Vote cast privately!", {
          description: `TX: ${tx.slice(0, 16)}...`,
        });
        return tx;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Vote failed";
        setError(msg);
        toast.error("Vote failed", { description: msg });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  const createProposal = useCallback(
    async (
      title: string,
      description: string,
      options: string[],
      votingPeriodSeconds: number
    ) => {
      if (!wallet.publicKey) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        toast.info("Creating proposal on-chain...");
        await votingClient.initialize(wallet);
        const result = await votingClient.createProposal({
          title,
          description,
          options,
          votingPeriodSeconds,
        });
        toast.success("Proposal created!", {
          description: `TX: ${result.tx.slice(0, 16)}...`,
        });
        return result.tx;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Create failed";
        setError(msg);
        toast.error("Failed to create proposal", { description: msg });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  const initializePlatform = useCallback(async () => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);
    try {
      await votingClient.initialize(wallet);
      const tx = await votingClient.initializePlatform();
      toast.success("Platform initialized", {
        description: `TX: ${tx.slice(0, 16)}...`,
      });
      return tx;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Initialization failed";
      setError(msg);
      toast.error("Initialization failed", { description: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const closeProposal = useCallback(
    async (proposalId: number) => {
      if (!wallet.publicKey) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        await votingClient.initialize(wallet);
        const tx = await votingClient.closeProposal(proposalId);
        toast.success("Proposal closed", {
          description: `TX: ${tx.slice(0, 16)}...`,
        });
        return tx;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Close failed";
        setError(msg);
        toast.error("Close failed", { description: msg });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  return { vote, createProposal, initializePlatform, closeProposal, loading, error };
}
