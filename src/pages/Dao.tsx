import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { Poll } from "@/types/poll";
import { usePolls } from "@/hooks/usePolls";
import { useArciumVoting } from "@/hooks/useArciumVoting";
import { CreatePollModal } from "@/components/dao/CreatePollModal";
import { PollList } from "@/components/dao/PollList";
import { VotingInterface } from "@/components/dao/VotingInterface";
import { ResultsDashboard } from "@/components/dao/ResultsDashboard";
import { TechnicalSection } from "@/components/dao/TechnicalSection";
import { BrandLogo } from "@/components/BrandLogo";

const Dao = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { polls, isCreating, createPoll, getTimeRemaining, refreshPolls } = usePolls();
  const { submitVote, isVoting, isCheckingVoteStatus, hasVoted, refreshVoteStatus } =
    useArciumVoting();

  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  useEffect(() => {
    if (!selectedPoll) return;
    const updated = polls.find((poll) => poll.id === selectedPoll.id);
    if (updated) setSelectedPoll(updated);
  }, [polls, selectedPoll]);

  useEffect(() => {
    if (!selectedPoll || !connected) return;
    void refreshVoteStatus(selectedPoll.id);
  }, [selectedPoll, connected, refreshVoteStatus]);

  const handleVote = async (optionIndex: number) => {
    if (selectedPoll) {
      await submitVote(selectedPoll, optionIndex);
      await refreshPolls();
    }
  };

  const selectedPollVotes = selectedPoll
    ? Object.values(selectedPoll.votes).reduce((a, b) => a + b, 0)
    : 0;
  const activePollVotes = polls
    .filter((poll) => poll.status === "active")
    .reduce((sum, poll) => sum + Object.values(poll.votes).reduce((a, b) => a + b, 0), 0);
  const totalVotesToDisplay = selectedPoll ? selectedPollVotes : activePollVotes;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <BrandLogo className="h-9 md:h-10 text-foreground" />
          </button>

          <div className="flex items-center gap-4">
            <CreatePollModal
              onCreatePoll={createPoll}
              isCreating={isCreating}
              isWalletConnected={connected}
            />
            <WalletMultiButton className="!bg-muted !text-foreground !font-mono !text-xs !rounded-full !px-6 !h-9" />
          </div>
        </div>

        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Active Polls & Global Stats */}
          <div className="space-y-6">
            {/* Active Polls */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">
                Active Polls
              </h2>
              <PollList
                polls={polls}
                selectedPollId={selectedPoll?.id || null}
                onSelectPoll={setSelectedPoll}
                getTimeRemaining={getTimeRemaining}
              />
            </div>

            {/* Global Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">
                Network Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Active Polls:
                  </span>
                  <span className="font-mono font-semibold">{polls.length}</span>
                </div>
                {selectedPoll && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Selected Poll Votes:
                    </span>
                    <span className="font-mono font-semibold">
                      {totalVotesToDisplay}
                    </span>
                  </div>
                )}
                {selectedPoll && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Time Remaining:
                    </span>
                    <span className="font-mono font-semibold">
                      {getTimeRemaining(selectedPoll.endsAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Column - Voting Interface */}
          <div className="glass-card rounded-2xl p-6">
            <VotingInterface
              poll={selectedPoll}
              isVoting={isVoting}
              isCheckingVoteStatus={isCheckingVoteStatus}
              hasVoted={selectedPoll ? hasVoted(selectedPoll.id) : false}
              isWalletConnected={connected}
              onVote={handleVote}
            />
          </div>

          {/* Right Column - Results Dashboard */}
          <div className="glass-card rounded-2xl p-6">
            <ResultsDashboard
              poll={selectedPoll}
              hasVoted={selectedPoll ? hasVoted(selectedPoll.id) : false}
            />
          </div>
        </div>

        {/* Bottom Section - Technical Info */}
        <div className="glass-card rounded-2xl p-6">
          <TechnicalSection />
        </div>

        <footer className="py-6 text-center text-xs text-muted-foreground">
          Made by{" "}
          <a
            href="https://x.com/Jrken_ny"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            @Jrken_ny
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Dao;
