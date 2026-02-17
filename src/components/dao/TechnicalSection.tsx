import { Lightbulb, Shield, Lock, Cpu } from "lucide-react";

const ARCIUM_COMPONENTS = [
  {
    component: "Arcium MXE",
    description: "Multi-party execution environment",
    responsibility: "Runs encrypted computations across distributed nodes",
  },
  {
    component: "x25519 Key Exchange",
    description: "Elliptic curve Diffie-Hellman",
    responsibility: "Establishes shared secrets for vote encryption",
  },
  {
    component: "RescueCipher",
    description: "ZK-friendly symmetric cipher",
    responsibility: "Encrypts vote data before submission",
  },
  {
    component: "Solana PDA",
    description: "Program Derived Account",
    responsibility: "Stores encrypted vote tallies on-chain",
  },
];

export const TechnicalSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h2 className="font-display font-bold text-lg">
          How Arcium Privacy Works
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-display font-semibold">
                  Component
                </th>
                <th className="text-left py-2 font-display font-semibold">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {ARCIUM_COMPONENTS.map((item, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-3">
                    <div className="font-mono text-sm text-accent">
                      {item.component}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {item.responsibility}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Features */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
            <Shield className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-display font-semibold text-sm mb-1">
                Vote Privacy
              </p>
              <p className="text-sm text-muted-foreground">
                Your vote choice is encrypted locally before leaving your
                browser. Arcium nodes compute the tally without ever seeing
                individual votes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
            <Lock className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-display font-semibold text-sm mb-1">
                Address Anonymity
              </p>
              <p className="text-sm text-muted-foreground">
                Using MPC relayers, your wallet address is never linked to your
                vote on the public ledger.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
            <Cpu className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-display font-semibold text-sm mb-1">
                Verifiable Results
              </p>
              <p className="text-sm text-muted-foreground">
                Final tallies are cryptographically proven correct without
                revealing individual votes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
