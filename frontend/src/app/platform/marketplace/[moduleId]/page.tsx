"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Users,
  Download,
  Star,
  Settings,
  Save,
  Edit,
  Trash2,
  Eye,
  Shield,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  FileText,
  Database,
  RefreshCw
} from "lucide-react";

// Mock module data for demonstration
const MOCK_MODULES: any = {
  "academics-v2": {
    moduleId: "academics-v2",
    name: "Academics Module V2",
    description: "Enhanced academics management with AI-powered grading and analytics",
    category: "Core",
    tier: "growth",
    version: "2.1.0",
    status: "active",
    developer: "Mylesoft Team",
    downloads: 1250,
    rating: 4.8,
    reviews: 89,
    price: 0,
    features: [
      "AI-powered grading assistant",
      "Advanced analytics dashboard",
      "Automated report generation",
      "Parent portal integration",
      "Mobile app support"
    ],
    requirements: [
      "EduMyles Platform v3.0+",
      "Minimum 2GB RAM",
      "SSL certificate"
    ],
    documentation: "https://docs.edumyles.co.ke/academics-v2",
    support: "support@edumyles.co.ke",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    approvedAt: Date.now() - 85 * 24 * 60 * 60 * 1000,
    approvedBy: "admin@edumyles.co.ke",
    metadata: {
      tags: ["academics", "ai", "analytics", "grading"],
      compatibility: ["v3.0", "v3.1", "v3.2"],
      dependencies: ["communications", "billing"],
      size: "45MB",
      lastUpdated: "2024-03-05"
    }
  }
};

export default function PlatformModuleEditPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [editVersion, setEditVersion] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Use mock data for now
  const mod = MOCK_MODULES[moduleId as keyof typeof MOCK_MODULES];

  useEffect(() => {
    if (mod?.version) {
      setEditVersion(mod.version);
    }
    if (mod?.status) {
      setEditStatus(mod.status);
    }
  }, [mod]);

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!mod) {
    return (
      <div className="py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
        <p className="text-muted-foreground">
          Module "{moduleId}" was not found in the registry.
        </p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true);
    setEditStatus(newStatus);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVersionSave = async () => {
    if (!editVersion || editVersion === mod.version) return;
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Version updated to: ${editVersion}`);
    } catch (error) {
      console.error("Failed to update version:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-em-success/10 text-em-success border-em-success/20";
      case "beta": return "bg-purple-100 text-purple-700 border-purple-200";
      case "deprecated": return "bg-red-100 text-red-700 border-red-200";
      case "pending": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free": return "bg-gray-100 text-gray-700 border-gray-200";
      case "starter": return "bg-blue-100 text-blue-700 border-blue-200";
      case "growth": return "bg-green-100 text-green-700 border-green-200";
      case "pro": return "bg-em-accent/10 text-em-accent-dark border-em-accent/20";
      case "enterprise": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mod.name}
        description={`Manage module: ${moduleId}`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: mod.name },
        ]}
      />

      {/* Module Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{mod.downloads.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{mod.rating}</div>
            <div className="text-sm text-muted-foreground">Rating ({mod.reviews} reviews)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{mod.metadata.size}</div>
            <div className="text-sm text-muted-foreground">Module Size</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{mod.developer}</div>
            <div className="text-sm text-muted-foreground">Developer</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Details Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Module ID</Label>
                  <p className="font-mono text-sm">{mod.moduleId}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{mod.name}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{mod.description}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Category</Label>
                  <Badge variant="outline" className="capitalize">{mod.category}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Required Tier</Label>
                  <Badge className={getTierColor(mod.tier)}>{mod.tier}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mod.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-em-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mod.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mod.metadata.compatibility.map((version: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {version}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Download Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mr-2" />
                Download trends chart would be implemented here
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">+23%</div>
                <div className="text-sm text-muted-foreground">Monthly Growth</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">47</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">4.2h</div>
                <div className="text-sm text-muted-foreground">Avg. Session</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Badge className={getStatusColor(mod.status)}>{mod.status}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Change Status</Label>
                  <Select value={editStatus} onValueChange={handleStatusChange} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deprecated modules cannot be installed by new tenants.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Version</Label>
                  <p className="font-mono text-sm">{mod.version}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Update Version</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="font-mono"
                    />
                    <Button
                      onClick={handleVersionSave}
                      disabled={isSaving || editVersion === mod.version}
                      size="sm"
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Module Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Module
                </Button>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Module
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Rebuild Index
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium">Security Status: Verified</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This module has passed security validation and is safe for deployment.
              </p>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="flex flex-wrap gap-2">
                  {mod.metadata.dependencies.map((dep: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Last Security Scan</Label>
                <p className="text-sm text-muted-foreground">
                  March 5, 2024 - No vulnerabilities detected
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Always review module dependencies and ensure they meet your security requirements before deployment.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
