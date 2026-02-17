import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { Poll } from "@/types/poll";

interface PollListProps {
  polls: Poll[];
  selectedPollId: string | null;
  onSelectPoll: (poll: Poll) => void;
  getTimeRemaining: (endsAt: Date) => string;
}

export const PollList = ({
  polls,
  selectedPollId,
  onSelectPoll,
  getTimeRemaining,
}: PollListProps) => {
  if (polls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No active polls yet.</p>
        <p className="text-xs mt-1">Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {polls.map((poll) => (
        <motion.button
          key={poll.id}
          onClick={() => onSelectPoll(poll)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            selectedPollId === poll.id
              ? "border-accent bg-accent/5"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`h-4 w-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                selectedPollId === poll.id
                  ? "border-accent bg-accent"
                  : "border-muted-foreground/30"
              }`}
            >
              {selectedPollId === poll.id && (
                <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-display text-sm block truncate">
                {poll.title}
              </span>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getTimeRemaining(poll.endsAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {poll.participants}
                </span>
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};
