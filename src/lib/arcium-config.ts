import { PublicKey } from "@solana/web3.js";

function maybePublicKey(value?: string): PublicKey | undefined {
  if (!value) return undefined;
  return new PublicKey(value);
}

function maybeNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const ARCIUM_CONFIG = {
  programId: new PublicKey(
    import.meta.env.VITE_PROGRAM_ID ??
      "BNQXm38ecbMHG8fVNBPL9ZgmXyERpMJxFZkfD7cKE2Fm"
  ),
  network: "devnet" as const,
  rpcUrl: import.meta.env.VITE_NETWORK ?? "https://api.devnet.solana.com",
  arcium: {
    // MXE program id (backward compatible with old var name)
    mxeProgramId: maybePublicKey(
      import.meta.env.VITE_MXE_PROGRAM_ID ??
        import.meta.env.VITE_ARCIUM_PROGRAM_ID
    ),
    clusterOffset: maybeNumber(import.meta.env.VITE_CLUSTER_OFFSET),
    mxeAccount: maybePublicKey(import.meta.env.VITE_MXE_ACCOUNT),
    mempoolAccount: maybePublicKey(import.meta.env.VITE_MEMPOOL_ACCOUNT),
    executingPool: maybePublicKey(import.meta.env.VITE_EXECUTING_POOL),
    computationAccount: maybePublicKey(import.meta.env.VITE_COMPUTATION_ACCOUNT),
    compDefAccount: maybePublicKey(import.meta.env.VITE_COMP_DEF_ACCOUNT),
    clusterAccount: maybePublicKey(import.meta.env.VITE_CLUSTER_ACCOUNT),
    // Override if your circuit name differs.
    compDefCircuitName:
      import.meta.env.VITE_COMP_DEF_CIRCUIT_NAME ?? "verify_and_encrypt_vote",
  },
};
