import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poll } from "@/types/poll";

interface VotingInterfaceProps {
  poll: Poll | null;
  isVoting: boolean;
  isCheckingVoteStatus: boolean;
  hasVoted: boolean;
  isWalletConnected: boolean;
  onVote: (optionIndex: number) => void;
}

export const VotingInterface = ({
  poll,
  isVoting,
  isCheckingVoteStatus,
  hasVoted,
  isWalletConnected,
  onVote,
}: VotingInterfaceProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (!poll) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">Select a poll to vote</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedOption !== null) {
      onVote(selectedOption);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-lg text-center">
        Cast Your Vote
      </h2>

      <p className="text-center text-muted-foreground text-sm">{poll.title}</p>

      {poll.description && (
        <p className="text-center text-muted-foreground text-xs bg-muted/30 rounded-lg p-3">
          {poll.description}
        </p>
      )}

      {!hasVoted && (
        <div className="flex flex-wrap justify-center gap-4">
          {poll.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => !hasVoted && setSelectedOption(index)}
              disabled={hasVoted || isVoting || isCheckingVoteStatus}
              whileHover={!hasVoted ? { scale: 1.05 } : {}}
              whileTap={!hasVoted ? { scale: 0.95 } : {}}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedOption === index
                    ? "border-accent bg-accent"
                    : "border-muted-foreground/40 hover:border-foreground/60"
                } ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {selectedOption === index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-3 w-3 rounded-full bg-accent-foreground"
                  />
                )}
              </div>
              <span className="text-sm font-display">{option}</span>
            </motion.button>
          ))}
        </div>
      )}

      {hasVoted && (
        <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
          Vote received. Your selected option is encrypted and remains private.
        </div>
      )}

      {/* Privacy Message */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3 text-accent" />
          <span>Your choice is encrypted via Arcium MPC</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        className="w-full gap-2 font-display font-semibold py-6 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={
          selectedOption === null ||
          !isWalletConnected ||
          isVoting ||
          isCheckingVoteStatus ||
          hasVoted
        }
        onClick={handleSubmit}
      >
        {isVoting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Encrypting on Arcium Network...
          </>
        ) : hasVoted ? (
          <>
            <Lock className="h-4 w-4" />
            Already Voted
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Submit
          </>
        )}
      </Button>

      {!isWalletConnected && (
        <p className="text-center text-xs text-muted-foreground">
          Connect your wallet to vote
        </p>
      )}
    </div>
  );
};
