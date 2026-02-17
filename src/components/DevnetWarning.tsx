import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const DevnetWarning = () => {
  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-100">
        ⚠️ Devnet Only
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-200">
        This application is configured for Solana Devnet. Please ensure your wallet is connected to 
        <strong> Devnet</strong> before creating proposals or casting votes. Switching to another network 
        will cause transactions to fail.
      </AlertDescription>
    </Alert>
  );
};
