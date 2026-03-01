"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TierBadge } from "./TierBadge";
import { Download, Trash2 } from "lucide-react";

interface InstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  moduleId: string;
  requiredTier: string;
  action: "install" | "uninstall";
  onConfirm: () => void;
  isLoading?: boolean;
  dependencyWarning?: string;
}

export function InstallDialog({
  open,
  onOpenChange,
  moduleName,
  moduleId,
  requiredTier,
  action,
  onConfirm,
  isLoading = false,
  dependencyWarning,
}: InstallDialogProps) {
  const isInstall = action === "install";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isInstall ? "Install Module" : "Uninstall Module"}
          </DialogTitle>
          <DialogDescription>
            {isInstall
              ? `Install "${moduleName}" for your school? This will enable all features included in this module.`
              : `Uninstall "${moduleName}" from your school? This will disable all features included in this module. Your data will be preserved.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Module</span>
            <span className="font-medium">{moduleName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required Tier</span>
            <TierBadge tier={requiredTier} />
          </div>
          {dependencyWarning && (
            <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              {dependencyWarning}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={isInstall ? "default" : "destructive"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              "Processing..."
            ) : isInstall ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Install
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
