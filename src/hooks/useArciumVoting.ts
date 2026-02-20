import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Poll } from "@/types/poll";
import { votingClient } from "@/lib/voting-client";

export const useArciumVoting = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [isVoting, setIsVoting] = useState(false);
  const [isCheckingVoteStatus, setIsCheckingVoteStatus] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVotedPolls(new Set());
  }, [publicKey?.toBase58()]);

  const refreshVoteStatus = useCallback(
    async (pollId: string): Promise<boolean> => {
      if (!publicKey) return false;

      const proposalId = Number.parseInt(pollId, 10);
      if (!Number.isInteger(proposalId) || proposalId < 0) return false;

      setIsCheckingVoteStatus(true);
      try {
        await votingClient.initialize(wallet);
        const alreadyVoted = await votingClient.hasVoted(proposalId, publicKey);
        setVotedPolls((prev) => {
          const next = new Set(prev);
          if (alreadyVoted) next.add(pollId);
          else next.delete(pollId);
          return next;
        });
        return alreadyVoted;
      } catch {
        return false;
      } finally {
        setIsCheckingVoteStatus(false);
      }
    },
    [publicKey, wallet]
  );

  const submitVote = useCallback(
    async (poll: Poll, optionIndex: number): Promise<boolean> => {
      if (!publicKey) {
        toast.error("Please connect your wallet");
        return false;
      }

      const alreadyVoted =
        votedPolls.has(poll.id) || (await refreshVoteStatus(poll.id));
      if (alreadyVoted) {
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

        const proposalId = Number.parseInt(poll.id, 10);
        if (!Number.isInteger(proposalId) || proposalId < 0) {
          throw new Error(
            `Invalid proposal id "${poll.id}". Refresh polls and try again.`
          );
        }
        const tx = await votingClient.castVote({
          proposalId,
          optionIndex,
          walletPublicKey: publicKey,
        });

        // Mark as voted
        setVotedPolls((prev) => new Set(prev).add(poll.id));

        toast.success("Vote recorded privately!", {
          description: `TX: ${tx.slice(0, 16)}... — Encrypted via Arcium MPC`,
        });

        return true;
      } catch (error) {
        console.error("Vote failed:", error);
        const rawMessage =
          error instanceof Error ? error.message : "Unknown error";
        const isAccountNotInitialized = rawMessage.includes(
          "AccountNotInitialized"
        );
        const message =
          isAccountNotInitialized && rawMessage.includes("comp_def_account")
            ? "Computation definition is not initialized for this deployment yet."
            : isAccountNotInitialized
              ? "This proposal does not exist on the current program deployment. Refresh polls and vote on a newly created proposal."
              : rawMessage;
        toast.error("Failed to submit vote", {
          description: message,
        });
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [publicKey, wallet, votedPolls, refreshVoteStatus]
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
    isCheckingVoteStatus,
    hasVoted,
    refreshVoteStatus,
    isConnected: !!publicKey,
    walletAddress: publicKey?.toBase58(),
  };
};
