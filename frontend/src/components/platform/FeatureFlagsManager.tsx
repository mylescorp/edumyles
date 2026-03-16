"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Flag,
  Shield,
  Users,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Rocket,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  X
} from "lucide-react";

interface FeatureFlagsManagerProps {
  className?: string;
}

const CATEGORIES = ["System", "Features", "Beta", "Customization", "Emergency", "Performance", "Security"];
const PLAN_OPTIONS = ["starter", "growth", "pro", "enterprise"];

export function FeatureFlagsManager({ className = "" }: FeatureFlagsManagerProps) {
  const { sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Backend queries & mutations
  const flags = usePlatformQuery(
    api.platform.featureFlags.queries.listFeatureFlags,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const toggleMutation = useMutation(api.platform.featureFlags.mutations.toggleFeatureFlag);
  const createMutation = useMutation(api.platform.featureFlags.mutations.createFeatureFlag);
  const deleteMutation = useMutation(api.platform.featureFlags.mutations.deleteFeatureFlag);

  // New flag form state
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagDescription, setNewFlagDescription] = useState("");
  const [newFlagType, setNewFlagType] = useState("module");
  const [newFlagEnvironment, setNewFlagEnvironment] = useState("production");
  const [newFlagTargetType, setNewFlagTargetType] = useState("all");
  const [newFlagTargetValue, setNewFlagTargetValue] = useState("");

  const flagList = flags ?? [];

  const filteredFlags = flagList.filter((flag: any) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flag.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || flag.targetType === selectedType ||
      (selectedType === "global" && flag.targetType === "all") ||
      (selectedType === "beta" && flag.environment === "staging") ||
      (selectedType === "tenant" && flag.targetType === "tenants");
    return matchesSearch && matchesType;
  });

  const toggleFlag = async (flagId: Id<"featureFlags">) => {
    if (!sessionToken) return;
    try {
      await toggleMutation({ sessionToken, id: flagId });
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  };

  const deleteFlag = async (flagId: Id<"featureFlags">) => {
    if (!sessionToken) return;
    try {
      await deleteMutation({ sessionToken, id: flagId });
    } catch (err) {
      console.error("Failed to delete flag:", err);
    }
  };

  const createFlag = async () => {
    if (!sessionToken || !newFlagName) return;
    const key = newFlagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let targetValue: any = undefined;
    if (newFlagTargetType === "percentage") {
      targetValue = parseInt(newFlagTargetValue) || 0;
    } else if (newFlagTargetType === "tenants" || newFlagTargetType === "users") {
      targetValue = newFlagTargetValue.split(",").map((s) => s.trim()).filter(Boolean);
    }
    try {
      await createMutation({
        sessionToken,
        name: newFlagName,
        key,
        description: newFlagDescription || undefined,
        enabled: false,
        targetType: newFlagTargetType,
        targetValue,
        environment: newFlagEnvironment,
      });
      setShowCreateForm(false);
      setNewFlagName("");
      setNewFlagDescription("");
      setNewFlagType("module");
      setNewFlagTargetType("all");
      setNewFlagTargetValue("");
    } catch (err) {
      console.error("Failed to create flag:", err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "all": return <Globe className="h-4 w-4" />;
      case "tenants": return <Users className="h-4 w-4" />;
      case "users": return <Users className="h-4 w-4" />;
      case "percentage": return <Rocket className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "all": return "bg-red-100 text-red-700 border-red-200";
      case "tenants": return "bg-green-100 text-green-700 border-green-200";
      case "users": return "bg-blue-100 text-blue-700 border-blue-200";
      case "percentage": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderFlagCard = (flag: any) => (
    <Card key={flag._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{flag.name}</h3>
              <Badge className={getTypeColor(flag.targetType || "all")}>
                {getTypeIcon(flag.targetType || "all")}
                <span className="ml-1 capitalize">{flag.targetType || "all"}</span>
              </Badge>
              <Badge className={flag.enabled ? "bg-em-success/10 text-em-success border-em-success/20" : "bg-gray-100 text-gray-600 border-gray-200"}>
                {flag.enabled ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                <span className="capitalize">{flag.enabled ? "active" : "inactive"}</span>
              </Badge>
              {flag.environment && (
                <Badge variant="outline" className="text-xs">
                  {flag.environment}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-3">{flag.description}</p>
            <div className="text-xs text-muted-foreground">
              Key: <code className="bg-muted px-1 py-0.5 rounded">{flag.key}</code>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFlag(flag._id)}
              className={flag.enabled ? "text-em-success" : "text-muted-foreground"}
            >
              {flag.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteFlag(flag._id)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <span>
            Created: {new Date(flag.createdAt).toLocaleDateString()} {flag.createdBy ? `by ${flag.createdBy}` : ""}
          </span>
          {flag.updatedAt && (
            <span>
              Updated: {new Date(flag.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">Manage feature flags, module toggles, and rollout configurations</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Flag
        </Button>
      </div>

      {/* Alert for Global Flags */}
      {flagList.filter((f: any) => f.targetType === "all" && f.enabled).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Warning:</strong> {flagList.filter((f: any) => f.targetType === "all" && f.enabled).length} global feature flag(s) are currently active. These may affect all users.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Flags</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="tenant">Tenants</TabsTrigger>
          <TabsTrigger value="beta">Beta</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Flags Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFlags.map(renderFlagCard)}
          </div>

          {filteredFlags.length === 0 && (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feature flags found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first feature flag"
                }
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flagList.filter((f: any) => f.targetType === "all" || !f.targetType).map(renderFlagCard)}
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flagList.filter((f: any) => f.targetType === "tenants").map(renderFlagCard)}
          </div>
        </TabsContent>

        <TabsContent value="beta" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flagList.filter((f: any) => f.environment === "staging" || f.targetType === "percentage").map(renderFlagCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Flags Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{flagList.length}</div>
              <div className="text-sm text-muted-foreground">Total Flags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-em-success">
                {flagList.filter((f: any) => f.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {flagList.filter((f: any) => (f.targetType === "all" || !f.targetType) && f.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Global Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {flagList.filter((f: any) => f.environment === "staging" || f.targetType === "percentage").length}
              </div>
              <div className="text-sm text-muted-foreground">Beta Features</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Flag Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Create New Feature Flag</span>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flagName">Flag Name *</Label>
                  <Input
                    id="flagName"
                    placeholder="e.g. New Dashboard Feature"
                    value={newFlagName}
                    onChange={(e) => setNewFlagName(e.target.value)}
                  />
                  {newFlagName && (
                    <p className="text-xs text-muted-foreground">
                      Key: {newFlagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flagEnvironment">Environment</Label>
                  <Select value={newFlagEnvironment} onValueChange={setNewFlagEnvironment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flagDescription">Description</Label>
                <Input
                  id="flagDescription"
                  placeholder="Describe what this flag controls..."
                  value={newFlagDescription}
                  onChange={(e) => setNewFlagDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select value={newFlagTargetType} onValueChange={setNewFlagTargetType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Global)</SelectItem>
                      <SelectItem value="percentage">Percentage Rollout</SelectItem>
                      <SelectItem value="tenants">Specific Tenants</SelectItem>
                      <SelectItem value="users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newFlagTargetType !== "all" && (
                  <div className="space-y-2">
                    <Label>
                      {newFlagTargetType === "percentage"
                        ? "Rollout Percentage (0-100)"
                        : newFlagTargetType === "tenants"
                        ? "Tenant IDs (comma-separated)"
                        : "User IDs (comma-separated)"}
                    </Label>
                    <Input
                      placeholder={
                        newFlagTargetType === "percentage"
                          ? "25"
                          : "id1, id2, id3"
                      }
                      value={newFlagTargetValue}
                      onChange={(e) => setNewFlagTargetValue(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {newFlagTargetType === "all" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Global flags affect all users immediately.</strong> Use with caution and ensure proper testing before activation.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createFlag} disabled={!newFlagName}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flag
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
