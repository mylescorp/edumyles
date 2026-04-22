"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformAdminInviteForm } from "@/app/platform/users/PlatformAdminInviteForm";

type InviteStaffModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
};

export function InviteStaffModal({
  open,
  onOpenChange,
  sessionToken,
}: InviteStaffModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Invite Platform Staff</DialogTitle>
          <DialogDescription>
            Assign the right role, review access posture, and send a platform invitation without
            leaving the user registry.
          </DialogDescription>
        </DialogHeader>
        <PlatformAdminInviteForm
          mode="dialog"
          sessionToken={sessionToken}
          onCancel={() => onOpenChange(false)}
          onComplete={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
