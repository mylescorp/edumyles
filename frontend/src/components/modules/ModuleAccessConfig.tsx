"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RoleAccess = {
  role: string;
  accessLevel: "full" | "read_only" | "restricted" | "none";
  allowedFeatures: string[];
};

type Feature = {
  key: string;
  label: string;
  description?: string;
};

type Props = {
  roleAccess: RoleAccess[];
  features: Feature[];
  onChange: (next: RoleAccess[]) => void;
};

export function ModuleAccessConfig({ roleAccess, features, onChange }: Props) {
  const featureMap = useMemo(() => new Map(features.map((feature) => [feature.key, feature])), [features]);

  function updateRole(role: string, next: Partial<RoleAccess>) {
    onChange(
      roleAccess.map((entry) => (entry.role === role ? { ...entry, ...next } : entry))
    );
  }

  function toggleFeature(role: string, featureKey: string, checked: boolean) {
    const current = roleAccess.find((entry) => entry.role === role);
    if (!current) return;
    const allowedFeatures = checked
      ? [...new Set([...current.allowedFeatures, featureKey])]
      : current.allowedFeatures.filter((key) => key !== featureKey);
    updateRole(role, { allowedFeatures });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {roleAccess.map((entry) => (
        <Card key={entry.role}>
          <CardHeader>
            <CardTitle className="capitalize">{entry.role.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Access level</Label>
              <Select
                value={entry.accessLevel}
                onValueChange={(value: RoleAccess["accessLevel"]) =>
                  updateRole(entry.role, { accessLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="read_only">Read Only</SelectItem>
                  <SelectItem value="restricted">Custom</SelectItem>
                  <SelectItem value="none">No Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entry.accessLevel === "restricted" ? (
              <div className="space-y-3">
                <Label>Allowed features</Label>
                {features.map((feature) => (
                  <label key={feature.key} className="flex items-start gap-3">
                    <Checkbox
                      checked={entry.allowedFeatures.includes(feature.key)}
                      onCheckedChange={(checked) =>
                        toggleFeature(entry.role, feature.key, Boolean(checked))
                      }
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {featureMap.get(feature.key)?.label ?? feature.key}
                      </div>
                      {feature.description ? (
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
