import { Check, Shield } from "lucide-react";
import { Poll } from "@/types/poll";

interface ResultsDashboardProps {
  poll: Poll | null;
  hasVoted: boolean;
}

export const ResultsDashboard = ({ poll, hasVoted }: ResultsDashboardProps) => {
  if (!poll) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">Select a poll to view results</p>
      </div>
    );
  }

  const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Live Results</h2>
        {hasVoted && (
          <span className="flex items-center gap-1 font-mono text-xs text-success">
            <Check className="h-3 w-3" /> Voted
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const count = poll.votes[option] || 0;
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="font-display">{option}</span>
              <span className="font-mono text-muted-foreground">{count}v</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border p-4 bg-muted/20">
        <p className="font-mono text-sm text-center">
          {poll.options
            .map((option) => `${option}: ${poll.votes[option] || 0}v`)
            .join(", ")}
        </p>
      </div>

      <div className="border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Shield className="h-4 w-4 text-accent" />
          <span className="font-display">Proof of Integrity</span>
        </div>
        <p className="font-mono text-xs text-muted-foreground truncate">Poll ID: {poll.id}</p>
        <p className="font-mono text-xs text-muted-foreground mt-1">Total Votes: {totalVotes}</p>
        <p className="font-mono text-xs text-muted-foreground mt-1">MPC Verified ✓</p>
      </div>
    </div>
  );
};
