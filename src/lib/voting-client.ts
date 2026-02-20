import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  type AccountInfo,
} from "@solana/web3.js";
import { x25519 } from "@noble/curves/ed25519";
import {
  getArciumProgramId,
  getClockAccAddress,
  getFeePoolAccAddress,
  getMXEAccAddress,
  getMXEPublicKey,
  RescueCipher,
} from "@arcium-hq/client";
import { ARCIUM_CONFIG } from "./arcium-config";

let cachedIdl: any = null;

async function loadIdl() {
  if (cachedIdl) return cachedIdl;
  const res = await fetch("/idl/primedao.json");
  if (!res.ok) {
    throw new Error(
      "Failed to load IDL. Make sure public/idl/primedao.json exists."
    );
  }
  cachedIdl = await res.json();
  cachedIdl.address = ARCIUM_CONFIG.programId.toBase58();
  return cachedIdl;
}

function deserializeLE(buffer: Uint8Array): bigint {
  let result = BigInt(0);
  for (let i = 0; i < buffer.length; i++) {
    result += BigInt(buffer[i]) << BigInt(8 * i);
  }
  return result;
}

function toNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as BN).toNumber();
  }
  return Number(value ?? 0);
}

function toU8Array(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return Uint8Array.from(value);
  return null;
}

function toX25519Key(value: unknown): Uint8Array | null {
  const bytes = toU8Array(value);
  if (!bytes || bytes.length !== 32) return null;
  return bytes;
}

function ensureCiphertext32(values: number[], label: string): number[] {
  if (values.length !== 32) {
    throw new Error(`Invalid ${label} length: expected 32, got ${values.length}`);
  }
  return values;
}

async function getMXEPublicKeyWithRetry(
  provider: AnchorProvider,
  mxeProgramId: PublicKey,
  attempts = 10,
  delayMs = 1000
): Promise<Uint8Array | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const key = await getMXEPublicKey(provider, mxeProgramId);
      if (key && key.length === 32) return key;
    } catch {
      // Retry on transient/missing-account SDK lookup failures.
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

function getMxeX25519Key(mxeAccount: any): Uint8Array | null {
  const utilityPubkeys = mxeAccount.utilityPubkeys;
  const candidates: unknown[] = [];

  if (utilityPubkeys?.set) {
    const setValue = utilityPubkeys.set;
    if (Array.isArray(setValue)) {
      candidates.push(setValue[0]?.x25519Pubkey, setValue[0]?.x25519_pubkey);
    }
    candidates.push(setValue.x25519Pubkey, setValue.x25519_pubkey);
  }

  if (utilityPubkeys?.unset) {
    const unsetValue = utilityPubkeys.unset;
    if (Array.isArray(unsetValue)) {
      const maybeUtilityKeyset = unsetValue[0];
      const maybeFlags = unsetValue[1];
      if (!Array.isArray(maybeFlags) || maybeFlags.every(Boolean)) {
        candidates.push(
          maybeUtilityKeyset?.x25519Pubkey,
          maybeUtilityKeyset?.x25519_pubkey
        );
      }
    }
    candidates.push(unsetValue.x25519Pubkey, unsetValue.x25519_pubkey);
  }

  candidates.push(mxeAccount.x25519Pubkey, mxeAccount.x25519_pubkey);

  for (const candidate of candidates) {
    const key = toX25519Key(candidate);
    if (key) return key;
  }

  return null;
}

function toU32Seed(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

function generateComputationOffset(): number {
  // Avoid PDA collisions by combining millisecond time with a random suffix.
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

async function getCompDefOffsetFromCircuitName(
  circuitName: string
): Promise<number> {
  const encodedName = new TextEncoder().encode(circuitName);
  const digest = await crypto.subtle.digest("SHA-256", encodedName);
  const offsetBytes = new Uint8Array(digest).slice(0, 4);
  const view = new DataView(
    offsetBytes.buffer,
    offsetBytes.byteOffset,
    offsetBytes.byteLength
  );
  return view.getUint32(0, true);
}

export interface ProposalView {
  id: number;
  title: string;
  description: string;
  options: string[];
  voteCounts: number[];
  endTime: number;
  isActive: boolean;
  totalVotes: number;
  publicKey: PublicKey;
}

interface CreateProposalInput {
  title: string;
  description: string;
  options: string[];
  votingPeriodSeconds: number;
}

interface CastVoteInput {
  proposalId: number;
  optionIndex: number;
  walletPublicKey: PublicKey;
  computationOffset?: number;
}

export class VotingClient {
  private connection: Connection;
  private program: Program | null = null;

  constructor() {
    this.connection = new Connection(ARCIUM_CONFIG.rpcUrl, "confirmed");
  }

  private getProgram(): Program {
    if (!this.program) throw new Error("Client not initialized");
    return this.program;
  }

  private getPlatformPda(): PublicKey {
    const [platformPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      ARCIUM_CONFIG.programId
    );
    return platformPda;
  }

  private getProposalPda(proposalId: number): PublicKey {
    const seed = new BN(proposalId).toArrayLike(Buffer, "le", 8);
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), seed],
      ARCIUM_CONFIG.programId
    );
    return proposalPda;
  }

  private getVoteRecordPda(proposalPda: PublicKey, voter: PublicKey): PublicKey {
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), proposalPda.toBuffer(), voter.toBuffer()],
      ARCIUM_CONFIG.programId
    );
    return voteRecordPda;
  }

  private getArciumProgramKey(): PublicKey {
    return getArciumProgramId();
  }

  private deriveArciumPda(seeds: Buffer[]): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      seeds,
      this.getArciumProgramKey()
    );
    return pda;
  }

  private normalizeProposal(account: any, proposalPda: PublicKey): ProposalView {
    return {
      id: toNum(account.id),
      title: account.title,
      description: account.description,
      options: account.options,
      voteCounts: account.voteCounts.map((count: unknown) => toNum(count)),
      endTime: toNum(account.endTime),
      isActive: Boolean(account.isActive),
      totalVotes: toNum(account.totalVotes),
      publicKey: proposalPda,
    };
  }

  async initialize(wallet: any) {
    const provider = new AnchorProvider(this.connection, wallet as any, {
      commitment: "confirmed",
    });
    const idl = await loadIdl();
    this.program = new Program(idl as any, provider as any);
  }

  async initializePlatform() {
    const program = this.getProgram();
    const authority = program.provider.publicKey;
    if (!authority) throw new Error("Wallet authority is required");

    const platformPda = this.getPlatformPda();

    return program.methods
      .initialize()
      .accounts({
        platform: platformPda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async createProposal(input: CreateProposalInput) {
    const program = this.getProgram();

    const platformPda = this.getPlatformPda();
    let platform: any;
    try {
      platform = await (program.account as any).platform.fetch(platformPda);
    } catch {
      throw new Error(
        "Platform is not initialized yet. Run initializePlatform() once with the admin wallet."
      );
    }
    const proposalId = toNum(platform.proposalCount);
    const proposalPda = this.getProposalPda(proposalId);

    const tx = await program.methods
      .createProposal(
        input.title,
        input.description,
        input.options,
        new BN(input.votingPeriodSeconds)
      )
      .accounts({
        platform: platformPda,
        proposal: proposalPda,
        creator: program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, proposalId };
  }

  async castVote(input: CastVoteInput) {
    const program = this.getProgram();

    const proposalPda = this.getProposalPda(input.proposalId);
    const voteRecordPda = this.getVoteRecordPda(proposalPda, input.walletPublicKey);

    const {
      mxeAccount,
      mempoolAccount,
      executingPool,
      computationAccount,
      compDefAccount,
      clusterAccount,
      clusterOffset,
      compDefCircuitName,
    } = ARCIUM_CONFIG.arcium;
    const missingAccountVars = [!mxeAccount && "VITE_MXE_ACCOUNT"].filter(
      Boolean
    );

    if (missingAccountVars.length > 0) {
      throw new Error(
        `Missing Arcium account env vars: ${missingAccountVars.join(", ")}`
      );
    }

    let mxeAccountToUse = mxeAccount;
    let mxeAccountData: any;
    try {
      mxeAccountData = await (program.account as any).mxeAccount.fetch(
        mxeAccountToUse
      );
    } catch {
      throw new Error(
        `Arcium MXE setup issue: configured MXE account ${mxeAccountToUse.toBase58()} does not exist on this network. Check VITE_MXE_ACCOUNT and deployment status.`
      );
    }

    let mxeProgramId: PublicKey =
      mxeAccountData.mxeProgramId ??
      mxeAccountData.mxe_program_id ??
      ARCIUM_CONFIG.programId ??
      ARCIUM_CONFIG.arcium.mxeProgramId;
    if (!mxeProgramId) {
      throw new Error("MXE account is missing mxeProgramId");
    }

    let mxePublicKey = getMxeX25519Key(mxeAccountData);

    // Fallback 1: try canonical MXE account for the MXE program ID
    let canonicalFetchError: string | null = null;
    if (!mxePublicKey) {
      const canonicalMxeAccount = getMXEAccAddress(mxeProgramId);
      if (!canonicalMxeAccount.equals(mxeAccountToUse)) {
        try {
          const canonicalData = await (program.account as any).mxeAccount.fetch(
            canonicalMxeAccount
          );
          const canonicalKey = getMxeX25519Key(canonicalData);
          if (canonicalKey) {
            mxeAccountToUse = canonicalMxeAccount;
            mxeAccountData = canonicalData;
            mxePublicKey = canonicalKey;
            mxeProgramId =
              mxeAccountData.mxeProgramId ??
              mxeAccountData.mxe_program_id ??
              ARCIUM_CONFIG.programId ??
              ARCIUM_CONFIG.arcium.mxeProgramId;
          }
        } catch {
          canonicalFetchError = `Derived MXE account ${canonicalMxeAccount.toBase58()} does not exist`;
        }
      }
    }

    // Fallback 2: ask Arcium SDK helper (handles account layout differences)
    if (!mxePublicKey) {
      const sdkKey = await getMXEPublicKeyWithRetry(
        program.provider as AnchorProvider,
        mxeProgramId
      );
      if (sdkKey) {
        mxePublicKey = sdkKey;
      }
    }

    if (!mxePublicKey) {
      throw new Error(
        `Arcium MXE is not ready for encrypted voting yet. No valid 32-byte x25519 key was found for MXE account ${mxeAccountToUse.toBase58()} (MXE program ${mxeProgramId.toBase58()}). ${canonicalFetchError ? `${canonicalFetchError}. ` : ""}Run/verify MXE initialization and computation-definition setup, then retry.`
      );
    }

    if (mxePublicKey.length !== 32) {
      throw new Error(
        `Invalid MXE x25519 key length: expected 32, got ${mxePublicKey.length}`
      );
    }

    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const voterBytes = input.walletPublicKey.toBytes();

    const voterPartValues = [0, 8, 16, 24].map((offset) =>
      deserializeLE(voterBytes.slice(offset, offset + 8))
    );
    const encryptedVoterParts = voterPartValues.map((partValue, index) =>
      ensureCiphertext32(
        Array.from(cipher.encrypt([partValue], nonce)[0]),
        `voter_part${index + 1}_enc`
      )
    );
    const proposalIdEnc = ensureCiphertext32(
      Array.from(cipher.encrypt([BigInt(input.proposalId)], nonce)[0]),
      "proposal_id_enc"
    );
    const optionIndexEnc = ensureCiphertext32(
      Array.from(cipher.encrypt([BigInt(input.optionIndex)], nonce)[0]),
      "option_index_enc"
    );

    const computationOffset = input.computationOffset ?? generateComputationOffset();
    const computationOffsetBn = new BN(computationOffset);

    if (
      clusterOffset === undefined &&
      (!mempoolAccount ||
        !executingPool ||
        !clusterAccount ||
        !computationAccount)
    ) {
      throw new Error(
        "Missing VITE_CLUSTER_OFFSET or explicit VITE_MEMPOOL_ACCOUNT/VITE_EXECUTING_POOL/VITE_CLUSTER_ACCOUNT/VITE_COMPUTATION_ACCOUNT."
      );
    }

    const effectiveClusterOffset = clusterOffset ?? 0;
    const derivedMempool =
      mempoolAccount ??
      this.deriveArciumPda([
        Buffer.from("Mempool"),
        toU32Seed(effectiveClusterOffset),
      ]);
    const derivedExecutingPool =
      executingPool ??
      this.deriveArciumPda([
        Buffer.from("Execpool"),
        toU32Seed(effectiveClusterOffset),
      ]);
    const derivedCluster =
      clusterAccount ??
      this.deriveArciumPda([
        Buffer.from("Cluster"),
        toU32Seed(effectiveClusterOffset),
      ]);
    const derivedComputation =
      computationAccount ??
      this.deriveArciumPda([
        Buffer.from("ComputationAccount"),
        toU32Seed(effectiveClusterOffset),
        computationOffsetBn.toArrayLike(Buffer, "le", 8),
      ]);

    const compDefOffset = await getCompDefOffsetFromCircuitName(
      compDefCircuitName
    );
    const derivedCompDef =
      compDefAccount ??
      this.deriveArciumPda([
        Buffer.from("ComputationDefinitionAccount"),
        mxeProgramId.toBuffer(),
        toU32Seed(compDefOffset),
      ]);
    const compDefInfo = await this.connection.getAccountInfo(derivedCompDef);
    if (!compDefInfo) {
      throw new Error(
        `Computation definition account ${derivedCompDef.toBase58()} is not initialized. Run init_verify_vote_comp_def once with the deployer authority wallet, then retry voting.`
      );
    }

    const arciumProgram = this.getArciumProgramKey();
    const [signPdaAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("ArciumSignerAccount")],
      ARCIUM_CONFIG.programId
    );

    const accounts: Record<string, PublicKey> = {
      proposal: proposalPda,
      payer: input.walletPublicKey,
      voter: input.walletPublicKey,
      voteRecord: voteRecordPda,
      signPdaAccount,
      mxeAccount: mxeAccountToUse,
      mempoolAccount: derivedMempool,
      executingPool: derivedExecutingPool,
      computationAccount: derivedComputation,
      compDefAccount: derivedCompDef,
      clusterAccount: derivedCluster,
      poolAccount: getFeePoolAccAddress(),
      clockAccount: getClockAccAddress(),
      systemProgram: SystemProgram.programId,
      arciumProgram,
    };

    return program.methods
      .castVote(
        computationOffsetBn,
        input.optionIndex,
        encryptedVoterParts[0],
        encryptedVoterParts[1],
        encryptedVoterParts[2],
        encryptedVoterParts[3],
        proposalIdEnc,
        optionIndexEnc,
        Array.from(publicKey),
        new BN(deserializeLE(nonce).toString())
      )
      .accounts(accounts)
      .rpc();
  }

  async closeProposal(proposalId: number) {
    const program = this.getProgram();
    const proposalPda = this.getProposalPda(proposalId);

    return program.methods
      .closeProposal()
      .accounts({
        proposal: proposalPda,
        authority: program.provider.publicKey,
      })
      .rpc();
  }

  async hasVoted(proposalId: number, voter: PublicKey): Promise<boolean> {
    const proposalPda = this.getProposalPda(proposalId);
    const voteRecordPda = this.getVoteRecordPda(proposalPda, voter);
    const voteRecordInfo = await this.connection.getAccountInfo(voteRecordPda);
    return voteRecordInfo !== null;
  }

  async getPlatform() {
    const program = this.getProgram();
    const platformPda = this.getPlatformPda();
    const account = await (program.account as any).platform.fetch(platformPda);

    return {
      authority: account.authority as PublicKey,
      proposalCount: toNum(account.proposalCount),
      publicKey: platformPda,
    };
  }

  async getProposal(proposalId: number): Promise<ProposalView> {
    const program = this.getProgram();
    const proposalPda = this.getProposalPda(proposalId);
    const account = await (program.account as any).proposal.fetch(proposalPda);
    return this.normalizeProposal(account, proposalPda);
  }

  async getAllProposals(): Promise<ProposalView[]> {
    const { proposalCount } = await this.getPlatform();
    if (proposalCount <= 0) return [];

    const proposals = await Promise.all(
      [...Array(proposalCount).keys()].map(async (id) => {
        try {
          return await this.getProposal(id);
        } catch {
          return null;
        }
      })
    );

    return proposals
      .filter((proposal): proposal is ProposalView => proposal !== null)
      .sort((a, b) => b.id - a.id);
  }

  subscribeToProposal(
    proposalId: number,
    onUpdate: (proposal: ProposalView) => void
  ): number {
    const program = this.getProgram();
    const proposalPda = this.getProposalPda(proposalId);

    return this.connection.onAccountChange(
      proposalPda,
      async (accountInfo: AccountInfo<Buffer>) => {
        const decoded = (program.coder.accounts as any).decode(
          "Proposal",
          accountInfo.data
        );
        onUpdate(this.normalizeProposal(decoded, proposalPda));
      },
      "confirmed"
    );
  }

  unsubscribe(subscriptionId: number) {
    return this.connection.removeAccountChangeListener(subscriptionId);
  }
}

export const votingClient = new VotingClient();
