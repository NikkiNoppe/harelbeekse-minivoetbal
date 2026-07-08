import { useToast } from "@/hooks/use-toast";

export const usePlayerLockToast = (
  isLocked: boolean,
  lockMessage: string | null,
) => {
  const { toast } = useToast();

  const showLockWarning = () => {
    if (!isLocked) return;

    toast({
      title: "Spelerslijst vergrendeld",
      description:
        lockMessage ?? "Wijzigingen aan de spelerslijst zijn momenteel niet toegestaan.",
      variant: "destructive",
    });
  };

  return { showLockWarning };
};
