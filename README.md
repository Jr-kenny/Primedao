# PrimeDAO: Private, Real-Time Governance on Solana

PrimeDAO is a voting app for communities that need two things at the same time:
- fast, transparent vote totals
- private individual choices

Most governance tools force a tradeoff: either everyone sees wallets and voting behavior, or results are delayed. PrimeDAO uses Arcium to remove that tradeoff.

## What We Built

PrimeDAO runs on Solana Devnet and integrates an Anchor program with Arcium-backed encrypted voting.

Core user flow:
1. Admin initializes the platform once.
2. Anyone can create a proposal with multiple options and a voting window.
3. Voters submit encrypted votes.
4. Tallies update in near real-time as votes arrive.
5. Individual voter preference remains private.

Current program integration in the frontend:
- `initialize()`
- `create_proposal(title, description, options, voting_period)`
- `cast_vote(computation_offset, option_index, voter_part*_enc, pubkey, nonce)`
- `close_proposal()`

## Why Arcium Matters Here

Arcium is the privacy layer that makes this governance UX practical.

In PrimeDAO, Arcium is used to:
- fetch the MXE encryption public key
- derive a shared secret client-side
- encrypt voter-linked data before the transaction is sent
- execute privacy-preserving compute flow without exposing voter intent in plaintext

### Privacy Benefits

- Voter preference privacy: no clear-text vote option tied to the wallet in transaction data.
- Reduced coercion risk: social pressure and retaliation become harder when ballot intent is hidden.
- Auditability with confidentiality: proposals and aggregate counts stay visible while individual intent stays private.

## UX Principles

The app is designed so privacy does not feel like extra friction:
- familiar wallet-connect + vote flow
- live totals in a simple format like `Yes: 14v, No: 11v`
- time remaining and total participation surfaced clearly
- no need for users to manage encryption manually

## Technical Implementation

Frontend stack:
- React + TypeScript + Vite
- `@coral-xyz/anchor`
- `@solana/web3.js`
- `@solana/wallet-adapter-react`
- `@arcium-hq/client`

Key technical choices:
- IDL-driven Anchor client (`public/idl/primedao.json`)
- deterministic PDA derivation for proposals, vote records, and Arcium-related accounts
- robust MXE key lookup with retries and fallback account resolution
- live poll refresh loop for near real-time tally UI

## Project Structure

- `src/lib/voting-client.ts`: on-chain client + Arcium encryption flow
- `src/hooks/usePolls.ts`: proposal loading/refresh + create flow
- `src/hooks/useArciumVoting.ts`: vote submission path
- `src/pages/Dao.tsx`: main DAO UX
- `public/idl/primedao.json`: PrimeDAO program IDL

## Configuration

Create `.env` in project root:

```bash
VITE_PROGRAM_ID=BNQXm38ecbMHG8fVNBPL9ZgmXyERpMJxFZkfD7cKE2Fm
VITE_NETWORK=https://api.devnet.solana.com
VITE_CLUSTER_OFFSET=456

VITE_MXE_ACCOUNT=ExSHkJHLvxEiUP3qfhEhMq29h33zoTxH79uLAkAAaTPE
VITE_MEMPOOL_ACCOUNT=Ex7BD8o8PK1y2eXDd38Jgujj93uHygrZeWXDeGAHmHtN
VITE_EXECUTING_POOL=4mcrgNZzJwwKrE3wXMHfepT8htSBmGqBzDYPJijWooog
VITE_CLUSTER_ACCOUNT=DzaQCyfybroycrNqE5Gk7LhSbWD2qfCics6qptBFbr95

# MXE program id (also accepts VITE_ARCIUM_PROGRAM_ID for backward compatibility)
VITE_MXE_PROGRAM_ID=ARC1VVo9KxbizP36EGgsSd6B3VpLwE1eSgaGNZyhj1MN
```

Optional overrides (normally derived at runtime):
- `VITE_COMP_DEF_ACCOUNT`
- `VITE_COMPUTATION_ACCOUNT`

## Local Development

```bash
pnpm install
pnpm dev
```

Open the DAO app route and connect a Devnet wallet.

## Common Failure Modes (and What They Mean)

- `Arcium MXE setup issue ... does not exist`
  - The configured MXE account does not exist on the selected network.

- `Arcium MXE is not ready for encrypted voting yet`
  - MXE utility keys (x25519) are not initialized yet, or deployment state is incomplete.

- `Account does not exist or has no data <pubkey>`
  - A required account (often derived MXE/canonical account) has not been created for this deployment.

## Judging Criteria Alignment

### Innovation
PrimeDAO combines live governance visibility with encrypted voter intent, avoiding the usual privacy/transparency tradeoff.

### Technical Implementation
The app integrates Solana + Anchor + Arcium end-to-end, including encrypted vote submission, PDA-driven account resolution, and operational error handling for deployment state.

### User Experience
The voting flow stays simple while strong privacy runs under the hood. Live tallies and countdowns keep decisions understandable in real time.

### Impact
Private-by-default governance helps DAOs, teams, and communities make sensitive decisions without discouraging participation.

### Clarity
The product is explicit about what is public (proposal metadata, aggregate totals) and what stays private (individual vote intent and voter-option linkage).
