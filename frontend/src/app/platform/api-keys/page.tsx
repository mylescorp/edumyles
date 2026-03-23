"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Shield,
  Clock,
  Activity,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const PERMISSION_OPTIONS = [
  "read:tenants", "write:tenants", "read:users", "write:users",
  "read:tickets", "write:tickets", "read:analytics", "read:billing",
  "write:billing", "read:crm", "write:crm",
];

export default function ApiKeysPage() {
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState("90");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const keys = usePlatformQuery(
    api.platform.apiKeys.queries.listApiKeys,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const createKey = useMutation(api.platform.apiKeys.mutations.createApiKey);
  const revokeKey = useMutation(api.platform.apiKeys.mutations.revokeApiKey);
  const rotateKey = useMutation(api.platform.apiKeys.mutations.rotateApiKey);

  const handleCreate = async () => {
    if (!sessionToken || !newKeyName || selectedPermissions.length === 0) return;
    try {
      const result = await createKey({
        sessionToken,
        name: newKeyName,
        permissions: selectedPermissions,
        expiresInDays: parseInt(expiryDays),
      });
      setNewlyCreatedKey(result.apiKey);
      setNewKeyName("");
      setSelectedPermissions([]);
    } catch (error) {
      console.error("Failed to create key:", error);
    }
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!keys) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="API Key Management"
        description="Create and manage API keys for programmatic access"
        actions={
          <Button onClick={() => { setIsCreateOpen(true); setNewlyCreatedKey(null); setShowKey(false); }}>
            <Plus className="h-4 w-4 mr-2" /> Create API Key
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{keys.length}</p>
                <p className="text-sm text-muted-foreground">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{keys.filter((k: any) => k.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {keys.filter((k: any) => k.expiresAt && k.expiresAt < Date.now() + 604800000).length}
                </p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No API keys created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((apiKey: any) => (
                <div key={apiKey._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{apiKey.name}</p>
                        <Badge variant={apiKey.isActive ? "default" : "destructive"}>
                          {apiKey.isActive ? "Active" : "Revoked"}
                        </Badge>
                      </div>
                      <code className="text-sm text-muted-foreground">{apiKey.key}</code>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {apiKey.permissions?.map((p: string) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span><Clock className="h-3 w-3 inline mr-1" />Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                        {apiKey.expiresAt && (
                          <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                        )}
                        {apiKey.lastUsedAt && (
                          <span>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.isActive && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!sessionToken) return;
                              try {
                                const result = await rotateKey({ sessionToken, keyId: apiKey._id });
                                setNewlyCreatedKey(result.apiKey);
                                setIsCreateOpen(true);
                              } catch {}
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" /> Rotate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!sessionToken) return;
                              await revokeKey({ sessionToken, keyId: apiKey._id });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{newlyCreatedKey ? "API Key Created" : "Create API Key"}</DialogTitle>
          </DialogHeader>
          {newlyCreatedKey ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Copy this key now. You won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white rounded border text-sm font-mono">
                    {showKey ? newlyCreatedKey : "•".repeat(40)}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(newlyCreatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => { setIsCreateOpen(false); setNewlyCreatedKey(null); }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g., Production API Key" />
              </div>
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded"
                      />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!newKeyName || selectedPermissions.length === 0}>
                Generate API Key
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
