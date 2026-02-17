import { useState, useCallback, useEffect } from "react";
import { Poll, CreatePollInput } from "@/types/poll";
import { useWallet } from "@solana/wallet-adapter-react";
import { votingClient, type ProposalView } from "@/lib/voting-client";
import { toast } from "sonner";

function mapProposalToPoll(proposal: ProposalView, creator = "anonymous"): Poll {
  const votes = proposal.options.reduce<Record<string, number>>((acc, option, idx) => {
    acc[option] = proposal.voteCounts[idx] ?? 0;
    return acc;
  }, {});

  const endsAt = new Date(proposal.endTime * 1000);

  return {
    id: proposal.id.toString(),
    title: proposal.title,
    description: proposal.description,
    options: proposal.options,
    createdAt: new Date(endsAt.getTime() - 24 * 60 * 60 * 1000),
    endsAt,
    creator,
    participants: proposal.totalVotes,
    votes,
    status: proposal.isActive && endsAt > new Date() ? "active" : "closed",
  };
}

export const usePolls = () => {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const refreshPolls = useCallback(async () => {
    if (!connected) return;

    try {
      await votingClient.initialize(wallet);
      const chainProposals = await votingClient.getAllProposals();
      const creator = publicKey?.toBase58() ?? "anonymous";
      setPolls(chainProposals.map((proposal) => mapProposalToPoll(proposal, creator)));
    } catch (error) {
      console.error("Failed to refresh polls:", error);
    }
  }, [connected, wallet, publicKey]);

  useEffect(() => {
    if (!connected) {
      setPolls([]);
      return;
    }

    void refreshPolls();

    const intervalId = window.setInterval(() => {
      void refreshPolls();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connected, refreshPolls]);

  const createPoll = useCallback(
    async (input: CreatePollInput): Promise<Poll | null> => {
      if (!publicKey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      setIsCreating(true);
      try {
        toast.info("Creating proposal on-chain...");
        await votingClient.initialize(wallet);
        const payload = {
          title: input.title,
          description: input.description || "",
          options: input.options,
          votingPeriodSeconds: Math.floor(input.durationHours * 60 * 60),
        };

        let result;
        try {
          result = await votingClient.createProposal(payload);
        } catch (createError) {
          const message =
            createError instanceof Error ? createError.message : "Unknown error";
          if (!message.includes("Platform is not initialized")) {
            throw createError;
          }

          toast.info("Initializing platform (one-time admin action)...");
          await votingClient.initializePlatform();
          result = await votingClient.createProposal(payload);
        }

        toast.success("Proposal created on-chain!", {
          description: `TX: ${result.tx.slice(0, 16)}...`,
        });

        const proposal = await votingClient.getProposal(result.proposalId);
        const poll = mapProposalToPoll(proposal, publicKey.toBase58());

        setPolls((prev) => {
          const withoutOld = prev.filter((existing) => existing.id !== poll.id);
          return [poll, ...withoutOld];
        });

        return poll;
      } catch (error) {
        console.error("Failed to create poll:", error);
        toast.error("Failed to create poll", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [publicKey, wallet]
  );

  const getTimeRemaining = useCallback((endsAt: Date): string => {
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  return {
    polls,
    isCreating,
    createPoll,
    getTimeRemaining,
    refreshPolls,
  };
};
