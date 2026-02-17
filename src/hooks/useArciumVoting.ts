import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Poll } from "@/types/poll";
import { votingClient } from "@/lib/voting-client";

export const useArciumVoting = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [isVoting, setIsVoting] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  const submitVote = useCallback(
    async (poll: Poll, optionIndex: number): Promise<boolean> => {
      if (!publicKey) {
        toast.error("Please connect your wallet");
        return false;
      }

      if (votedPolls.has(poll.id)) {
        toast.error("You have already voted on this poll");
        return false;
      }

      setIsVoting(true);

      try {
        // Step 1: Initialize the voting client with the wallet
        toast.info("Initializing Arcium MPC connection...");
        await votingClient.initialize(wallet);

        // Step 2: Encrypt and submit vote via Arcium MXE
        toast.info("Encrypting your vote via Arcium MPC...", {
          description: "x25519 key exchange + RescueCipher encryption",
        });

        const proposalId = parseInt(poll.id, 10) || Date.now();
        const tx = await votingClient.castVote({
          proposalId,
          optionIndex,
          walletPublicKey: publicKey,
          computationOffset: Math.floor(Date.now() / 1000),
        });

        // Mark as voted
        setVotedPolls((prev) => new Set(prev).add(poll.id));

        toast.success("Vote recorded privately!", {
          description: `TX: ${tx.slice(0, 16)}... — Encrypted via Arcium MPC`,
        });

        return true;
      } catch (error) {
        console.error("Vote failed:", error);
        toast.error("Failed to submit vote", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [publicKey, wallet, votedPolls]
  );

  const hasVoted = useCallback(
    (pollId: string): boolean => {
      return votedPolls.has(pollId);
    },
    [votedPolls]
  );

  return {
    submitVote,
    isVoting,
    hasVoted,
    isConnected: !!publicKey,
    walletAddress: publicKey?.toBase58(),
  };
};
