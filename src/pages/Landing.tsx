import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Lock,
    title: "Encrypted Votes",
    description: "Your vote is encrypted using Arcium's MPC network before it ever touches the chain.",
  },
  {
    icon: EyeOff,
    title: "Zero Knowledge",
    description: "Nobody — not even validators — can see individual votes during the polling period.",
  },
  {
    icon: Shield,
    title: "Verifiable Results",
    description: "Final tallies are computed on encrypted data and verified on-chain with proof of integrity.",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="relative container mx-auto px-6 pt-20 pb-32">
          <nav className="flex items-center justify-between mb-24">
            <div className="flex items-center">
              <BrandLogo className="h-10 md:h-12 text-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dao")}
              className="font-mono text-xs"
            >
              Launch App
            </Button>
          </nav>

          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
              Powered by Arcium Network
            </p>
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] mb-6">
              Private voting
              <br />
              for <span className="gradient-text">on-chain</span> DAOs
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Cast your vote without revealing your choice. Arcium's encrypted
              computation ensures true ballot privacy while maintaining
              fully verifiable results.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/dao")}
              className="group gap-2 font-display font-semibold text-base px-8 py-6 animate-pulse-glow"
            >
              Enter dApp
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass-card rounded-xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            >
              <feature.icon className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 pb-24">
        <h2 className="font-display font-bold text-2xl mb-8 text-center">
          How it works
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {["Connect Wallet", "Cast Encrypted Vote", "Results Revealed On-chain"].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-mono text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="font-display font-medium text-sm">{step}</span>
                </div>
                {i < 2 && (
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            PrimeDAO © 2026
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Built on Arcium
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
