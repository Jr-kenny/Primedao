import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreatePollInput } from "@/types/poll";

interface CreatePollModalProps {
  onCreatePoll: (input: CreatePollInput) => Promise<any>;
  isCreating: boolean;
  isWalletConnected: boolean;
}

export const CreatePollModal = ({
  onCreatePoll,
  isCreating,
  isWalletConnected,
}: CreatePollModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["Yes", "No"]);
  const [durationHours, setDurationHours] = useState(72);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!title.trim() || options.some((o) => !o.trim())) return;

    const result = await onCreatePoll({
      title: title.trim(),
      description: description.trim() || undefined,
      options: options.map((o) => o.trim()),
      durationHours,
    });

    if (result) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOptions(["Yes", "No"]);
    setDurationHours(72);
  };

  const isValid = title.trim() && options.every((o) => o.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 font-display font-semibold rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={!isWalletConnected}
        >
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Create New Poll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-display">
              Poll Title
            </Label>
            <Input
              id="title"
              placeholder="Should the DAO fund Project X?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/30 border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-display">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="Provide context for voters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/30 border-border"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="font-display">Voting Options</Label>
            <AnimatePresence>
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="bg-muted/30 border-border flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {options.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </Button>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="font-display flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </Label>
            <div className="flex gap-2">
              {[24, 48, 72, 168].map((hours) => (
                <Button
                  key={hours}
                  type="button"
                  variant={durationHours === hours ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDurationHours(hours)}
                  className={
                    durationHours === hours
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  {hours < 48
                    ? `${hours}h`
                    : `${Math.floor(hours / 24)}d`}
                </Button>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-accent/10 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              🔐 Votes are encrypted via Arcium MPC. Live option totals update
              in real time while individual voter identity stays private.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isCreating}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-display"
          >
            {isCreating ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
