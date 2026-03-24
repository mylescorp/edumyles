"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface Tenant {
  _id: string;
  tenantId: string;
  name: string;
  status: string;
}

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
  tenant: Tenant | null;
  onSuccess?: () => void;
}

export function SuspendDialog({
  open,
  onOpenChange,
  sessionToken,
  tenant,
  onSuccess,
}: SuspendDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suspendTenant = useMutation(api.platform.tenants.mutations.suspendTenant);
  const activateTenant = useMutation(api.platform.tenants.mutations.activateTenant);

  const isSuspending = tenant?.status !== "suspended";

  const handleConfirm = async () => {
    if (!tenant) return;
    if (isSuspending && !reason.trim()) {
      setError("Please provide a reason for suspending this tenant.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isSuspending) {
        await suspendTenant({
          sessionToken,
          tenantId: tenant.tenantId,
          reason: reason.trim(),
        });
      } else {
        await activateTenant({
          sessionToken,
          tenantId: tenant.tenantId,
        });
      }

      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message?.replace(/^[A-Z_]+:\s*/, "") ?? "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError(null);
    onOpenChange(false);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuspending ? (
              <>
                <AlertTriangle className="h-5 w-5 text-em-danger" />
                Suspend Tenant
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-em-success" />
                Activate Tenant
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuspending
              ? `You are about to suspend "${tenant.name}". Users of this school will lose access until the tenant is reactivated.`
              : `You are about to reactivate "${tenant.name}". All users will regain access.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {isSuspending && (
            <div className="space-y-1">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g. Non-payment of subscription fees"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                rows={3}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          {!isSuspending && error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isSuspending ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={!isSuspending ? "bg-em-success hover:bg-em-success/90" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isSuspending ? "Suspending..." : "Activating..."}
              </>
            ) : (
              isSuspending ? "Suspend Tenant" : "Activate Tenant"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
