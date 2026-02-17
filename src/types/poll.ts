export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  createdAt: Date;
  endsAt: Date;
  creator: string;
  participants: number;
  votes: Record<string, number>; // Encrypted vote counts per option
  status: "active" | "closed" | "pending";
}

export interface CreatePollInput {
  title: string;
  description?: string;
  options: string[];
  durationHours: number;
}

export interface VoteInput {
  pollId: string;
  optionIndex: number;
  encryptedChoice: Uint8Array;
}

export interface ArciumConfig {
  clusterOffset: number;
  mxeProgramId: string;
}
