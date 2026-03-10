"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package,
  Users,
  TrendingUp,
  Settings,
  Download,
  Upload,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Shield,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  BarChart3,
  FileText,
  Database,
  RefreshCw,
  X,
  Save,
  Ban,
  CheckSquare,
  Square
} from "lucide-react";

interface Module {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  version: string;
  status: "active" | "beta" | "deprecated" | "pending";
  developer: string;
  downloads: number;
  rating: number;
  reviews: number;
  price: number;
  features: string[];
  requirements: string[];
  documentation: string;
  support: string;
  createdAt: number;
  updatedAt: number;
  approvedAt?: number;
  approvedBy?: string;
  metadata: {
    tags: string[];
    compatibility: string[];
    dependencies: string[];
    size: string;
    lastUpdated: string;
  };
}

interface MarketplaceManagerProps {
  className?: string;
}

const MOCK_MODULES: Module[] = [
  {
    id: "1",
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
  },
  {
    id: "2",
    moduleId: "hr-management",
    name: "HR Management Suite",
    description: "Complete HR solution for educational institutions with payroll integration",
    category: "Advanced",
    tier: "pro",
    version: "1.5.2",
    status: "active",
    developer: "Mylesoft Partners",
    downloads: 890,
    rating: 4.6,
    reviews: 67,
    price: 5000,
    features: [
      "Staff management and records",
      "Payroll processing",
      "Leave management system",
      "Performance reviews",
      "Attendance tracking"
    ],
    requirements: [
      "EduMyles Platform v3.1+",
      "Pro tier subscription",
      "M-Pesa integration"
    ],
    documentation: "https://docs.edumyles.co.ke/hr-suite",
    support: "hr-support@edumyles.co.ke",
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    approvedAt: Date.now() - 115 * 24 * 60 * 60 * 1000,
    approvedBy: "admin@edumyles.co.ke",
    metadata: {
      tags: ["hr", "payroll", "staff", "management"],
      compatibility: ["v3.1", "v3.2"],
      dependencies: ["billing", "communications"],
      size: "32MB",
      lastUpdated: "2024-03-01"
    }
  },
  {
    id: "3",
    moduleId: "ai-tutor",
    name: "AI Tutor Assistant",
    description: "Intelligent tutoring system with personalized learning paths",
    category: "Innovation",
    tier: "enterprise",
    version: "0.9.0",
    status: "beta",
    developer: "EduAI Labs",
    downloads: 156,
    rating: 4.9,
    reviews: 12,
    price: 15000,
    features: [
      "Personalized learning paths",
      "Real-time student assistance",
      "Progress tracking",
      "Adaptive difficulty",
      "Multi-language support"
    ],
    requirements: [
      "EduMyles Platform v3.2+",
      "Enterprise tier subscription",
      "High-speed internet",
      "GPU-enabled server"
    ],
    documentation: "https://docs.edumyles.co.ke/ai-tutor",
    support: "ai-support@edumyles.co.ke",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    metadata: {
      tags: ["ai", "tutoring", "beta", "innovation"],
      compatibility: ["v3.2"],
      dependencies: ["academics", "analytics"],
      size: "128MB",
      lastUpdated: "2024-03-08"
    }
  },
  {
    id: "4",
    moduleId: "library-system",
    name: "Digital Library System",
    description: "Complete library management with digital catalog and circulation",
    category: "Advanced",
    tier: "growth",
    version: "3.0.1",
    status: "active",
    developer: "LibraryTech Solutions",
    downloads: 567,
    rating: 4.5,
    reviews: 34,
    price: 3000,
    features: [
      "Digital catalog management",
      "Book circulation tracking",
      "E-book integration",
      "Fine management",
      "Reporting and analytics"
    ],
    requirements: [
      "EduMyles Platform v3.0+",
      "Growth tier subscription",
      "Barcode scanner support"
    ],
    documentation: "https://docs.edumyles.co.ke/library-system",
    support: "library-support@edumyles.co.ke",
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    approvedAt: Date.now() - 175 * 24 * 60 * 60 * 1000,
    approvedBy: "admin@edumyles.co.ke",
    metadata: {
      tags: ["library", "catalog", "circulation", "e-books"],
      compatibility: ["v3.0", "v3.1", "v3.2"],
      dependencies: ["billing"],
      size: "28MB",
      lastUpdated: "2024-02-25"
    }
  },
  {
    id: "5",
    moduleId: "transport-manager",
    name: "Transport Manager",
    description: "School transport management with route optimization and tracking",
    category: "Advanced",
    tier: "pro",
    version: "2.2.0",
    status: "deprecated",
    developer: "Transit Solutions",
    downloads: 234,
    rating: 3.8,
    reviews: 18,
    price: 4000,
    features: [
      "Route planning and optimization",
      "Vehicle tracking",
      "Driver management",
      "Fee collection",
      "Parent notifications"
    ],
    requirements: [
      "EduMyles Platform v2.8+",
      "GPS integration",
      "Mobile app"
    ],
    documentation: "https://docs.edumyles.co.ke/transport-v2",
    support: "transport-support@edumyles.co.ke",
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    approvedAt: Date.now() - 360 * 24 * 60 * 60 * 1000,
    approvedBy: "admin@edumyles.co.ke",
    metadata: {
      tags: ["transport", "routing", "tracking", "deprecated"],
      compatibility: ["v2.8", "v2.9"],
      dependencies: ["communications", "billing"],
      size: "35MB",
      lastUpdated: "2023-09-15"
    }
  }
];

const CATEGORIES = ["All", "Core", "Advanced", "Innovation", "Integration", "Security"];
const TIERS = ["All", "free", "starter", "growth", "pro", "enterprise"];
const STATUSES = ["All", "active", "beta", "deprecated", "pending"];

export function MarketplaceManager({ className = "" }: MarketplaceManagerProps) {
  const [modules, setModules] = useState<Module[]>(MOCK_MODULES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Module[]>([]);

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || module.category === selectedCategory;
    const matchesTier = selectedTier === "All" || module.tier === selectedTier;
    const matchesStatus = selectedStatus === "All" || module.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesTier && matchesStatus;
  });

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

  const renderModuleCard = (module: Module) => (
    <Card key={module.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{module.name}</h3>
              <Badge className={getStatusColor(module.status)}>
                {module.status}
              </Badge>
              <Badge className={getTierColor(module.tier)}>
                {module.tier}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mb-3">{module.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{module.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{module.developer}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{module.downloads}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{module.rating}</span>
                <span className="text-muted-foreground">({module.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{module.price === 0 ? "Free" : `KES ${module.price.toLocaleString()}`}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {module.metadata.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditingModule(module)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <span>v{module.version} • {module.metadata.size}</span>
          <span>Updated: {new Date(module.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold">{modules.length}</div>
          <div className="text-sm text-muted-foreground">Total Modules</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Download className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold">
            {modules.reduce((sum, m) => sum + m.downloads, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Downloads</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold">
            {(modules.reduce((sum, m) => sum + m.rating * m.reviews, 0) / 
              modules.reduce((sum, m) => sum + m.reviews, 0)).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold">
            {modules.filter(m => m.status === "active").length}
          </div>
          <div className="text-sm text-muted-foreground">Active Modules</div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Module Marketplace</h2>
          <p className="text-muted-foreground">Manage modules, registry, approvals, and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Seed Registry
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>{pendingApprovals.length} modules</strong> are pending approval. Review them in the Approvals tab.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="registry">Registry</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredModules.map(renderModuleCard)}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or add a new module to the marketplace
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderAnalytics()}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mr-2" />
                Analytics dashboard would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-muted-foreground">
              All modules are currently approved and active
            </p>
          </div>
        </TabsContent>

        <TabsContent value="registry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Module Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Registry Version</span>
                  <Badge>v3.2.1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Modules</span>
                  <span>{modules.length}</span>
                </div>
                <Separator />
                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Registry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Marketplace Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Approval Settings</h4>
                <div className="flex items-center justify-between">
                  <Label>Require manual approval for new modules</Label>
                  <Checkbox defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-approve updates from trusted developers</Label>
                  <Checkbox defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Notification Settings</h4>
                <div className="flex items-center justify-between">
                  <Label>Email notifications for new submissions</Label>
                  <Checkbox defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notify on module updates</Label>
                  <Checkbox />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
