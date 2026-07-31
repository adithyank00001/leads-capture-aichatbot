"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteLeadDialogProps = {
  leadId: string | null;
  leadName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (leadId: string) => Promise<void>;
  isDeleting: boolean;
};

export function DeleteLeadDialog({
  leadId,
  leadName,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteLeadDialogProps) {
  async function handleConfirm() {
    if (!leadId) {
      return;
    }

    await onConfirm(leadId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete lead?</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            {leadName ? <strong>{leadName}</strong> : "this lead"} and all chat
            messages. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={isDeleting || !leadId}
          >
            {isDeleting ? "Deleting…" : "Delete lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
