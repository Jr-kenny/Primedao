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
    component: "Solana Accounts",
    description: "Program state + PDAs",
    responsibility:
      "Stores proposal and computation state used by the voting program",
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
                Address Visibility
              </p>
              <p className="text-sm text-muted-foreground">
                Your wallet still signs the transaction on Solana, but your
                vote choice is encrypted before submission and is not exposed in
                plaintext.
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
                Computation outputs can be verified through Arcium's
                verification flow (for example, cluster-signed results) before
                they are applied on-chain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
