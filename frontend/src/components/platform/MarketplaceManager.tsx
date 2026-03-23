"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
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
  Square,
  LineChart,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  User,
  Code,
  GitBranch,
  Lock,
  Unlock,
  BookOpen,
  GraduationCap,
  Briefcase,
  Brain,
  Library,
  Bus,
  Building,
  CreditCard,
  MessageSquare,
  FileCheck,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from "recharts";

interface Module {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  version: string;
  status: string;
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
  approvedAt: number;
  approvedBy: string;
  icon: string;
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
    icon: "GraduationCap",
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
    icon: "Briefcase",
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
    icon: "Brain",
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
    approvedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    approvedBy: "admin@edumyles.co.ke",
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
    icon: "Library",
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
    icon: "Bus",
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

// Analytics data
const ANALYTICS_DATA = {
  downloadTrends: [
    { month: "Jan", downloads: 450, newUsers: 89 },
    { month: "Feb", downloads: 680, newUsers: 124 },
    { month: "Mar", downloads: 920, newUsers: 156 },
    { month: "Apr", downloads: 1150, newUsers: 198 },
    { month: "May", downloads: 1380, newUsers: 234 },
    { month: "Jun", downloads: 1620, newUsers: 267 }
  ],
  categoryDistribution: [
    { category: "Core", value: 45, color: "blue" },
    { category: "Advanced", value: 30, color: "green" },
    { category: "Innovation", value: 15, color: "purple" },
    { category: "Integration", value: 10, color: "orange" }
  ],
  tierDistribution: [
    { tier: "Free", count: 120, revenue: 0 },
    { tier: "Starter", count: 280, revenue: 280000 },
    { tier: "Growth", count: 450, revenue: 1350000 },
    { tier: "Pro", count: 320, revenue: 1600000 },
    { tier: "Enterprise", count: 85, revenue: 1275000 }
  ],
  geographicData: [
    { country: "Kenya", users: 2847, percentage: 65 },
    { country: "Uganda", users: 892, percentage: 20 },
    { country: "Tanzania", users: 523, percentage: 12 },
    { country: "Rwanda", users: 178, percentage: 4 },
    { country: "Others", users: 87, percentage: 2 }
  ],
  developerMetrics: [
    { developer: "Mylesoft Team", modules: 3, downloads: 2890, rating: 4.7 },
    { developer: "Mylesoft Partners", modules: 2, downloads: 1456, rating: 4.5 },
    { developer: "EduAI Labs", modules: 1, downloads: 156, rating: 4.9 },
    { developer: "LibraryTech Solutions", modules: 1, downloads: 567, rating: 4.5 },
    { developer: "Transit Solutions", modules: 1, downloads: 234, rating: 3.8 }
  ]
};

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Module>>({});
  const [newModuleData, setNewModuleData] = useState<Partial<Module>>({
    name: "",
    description: "",
    category: "Core",
    tier: "free",
    version: "1.0.0",
    status: "pending",
    developer: "",
    downloads: 0,
    rating: 0,
    reviews: 0,
    price: 0,
    features: [""],
    requirements: [""],
    documentation: "",
    support: "",
    icon: "Package",
    metadata: {
      tags: [],
      compatibility: ["v3.0"],
      dependencies: [],
      size: "0MB",
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  });

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

  const seedRegistry = () => {
    const additionalModules: Module[] = [
      {
        id: "6",
        moduleId: "billing-system",
        name: "Advanced Billing System",
        description: "Comprehensive billing and payment processing with M-Pesa integration",
        category: "Core",
        tier: "growth",
        version: "4.0.0",
        status: "active",
        developer: "Mylesoft Team",
        downloads: 2100,
        rating: 4.7,
        reviews: 145,
        price: 0,
        icon: "CreditCard",
        features: [
          "M-Pesa integration",
          "Automated invoicing",
          "Payment reminders",
          "Financial reporting",
          "Multi-currency support"
        ],
        requirements: [
          "EduMyles Platform v3.0+",
          "M-Pesa Business API",
          "SSL certificate"
        ],
        documentation: "https://docs.edumyles.co.ke/billing",
        support: "billing@edumyles.co.ke",
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        approvedAt: Date.now() - 55 * 24 * 60 * 60 * 1000,
        approvedBy: "admin@edumyles.co.ke",
        metadata: {
          tags: ["billing", "payments", "m-pesa", "invoicing"],
          compatibility: ["v3.0", "v3.1", "v3.2"],
          dependencies: ["communications"],
          size: "38MB",
          lastUpdated: "2024-03-07"
        }
      },
      {
        id: "7",
        moduleId: "communications-hub",
        name: "Communications Hub",
        description: "Multi-channel communication system with SMS, email, and in-app messaging",
        category: "Core",
        tier: "starter",
        version: "2.5.0",
        status: "active",
        developer: "Mylesoft Team",
        downloads: 3200,
        rating: 4.9,
        reviews: 234,
        price: 0,
        icon: "MessageSquare",
        features: [
          "SMS notifications",
          "Email campaigns",
          "In-app messaging",
          "Parent communication",
          "Template management"
        ],
        requirements: [
          "EduMyles Platform v3.0+",
          "SMS gateway API",
          "Email service"
        ],
        documentation: "https://docs.edumyles.co.ke/communications",
        support: "comms@edumyles.co.ke",
        createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        approvedAt: Date.now() - 145 * 24 * 60 * 60 * 1000,
        approvedBy: "admin@edumyles.co.ke",
        metadata: {
          tags: ["communications", "sms", "email", "messaging"],
          compatibility: ["v3.0", "v3.1", "v3.2"],
          dependencies: [],
          size: "42MB",
          lastUpdated: "2024-02-20"
        }
      },
      {
        id: "8",
        moduleId: "exam-system",
        name: "Examination Management System",
        description: "Complete examination workflow with online and offline capabilities",
        category: "Advanced",
        tier: "pro",
        version: "3.2.0",
        status: "active",
        developer: "EduExam Solutions",
        downloads: 890,
        rating: 4.6,
        reviews: 78,
        price: 6000,
        icon: "FileCheck",
        features: [
          "Online examinations",
          "Automated grading",
          "Question bank management",
          "Result analytics",
          "Offline mode support"
        ],
        requirements: [
          "EduMyles Platform v3.1+",
          "Pro tier subscription",
          "Secure exam environment"
        ],
        documentation: "https://docs.edumyles.co.ke/exams",
        support: "exams@edumyles.co.ke",
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
        approvedAt: Date.now() - 85 * 24 * 60 * 60 * 1000,
        approvedBy: "admin@edumyles.co.ke",
        metadata: {
          tags: ["exams", "assessment", "grading", "analytics"],
          compatibility: ["v3.1", "v3.2"],
          dependencies: ["academics", "billing"],
          size: "55MB",
          lastUpdated: "2024-02-28"
        }
      }
    ];
    
    setModules([...modules, ...additionalModules]);
    
    // Show success message
    toast.success(`Successfully seeded ${additionalModules.length} new modules to the registry!`);
  };

  const createNewModule = () => {
    if (!newModuleData.name || !newModuleData.description || !newModuleData.developer) {
      toast.error("Please fill in all required fields (Name, Description, Developer)");
      return;
    }

    const newModule: Module = {
      id: (modules.length + 1).toString(),
      moduleId: newModuleData.name?.toLowerCase().replace(/\s+/g, '-') || "new-module",
      name: newModuleData.name || "",
      description: newModuleData.description || "",
      category: newModuleData.category || "Core",
      tier: newModuleData.tier || "free",
      version: newModuleData.version || "1.0.0",
      status: "pending",
      developer: newModuleData.developer || "",
      downloads: 0,
      rating: 0,
      reviews: 0,
      price: newModuleData.price || 0,
      features: newModuleData.features?.filter(f => f.trim() !== "") || [],
      requirements: newModuleData.requirements?.filter(r => r.trim() !== "") || [],
      documentation: newModuleData.documentation || "",
      support: newModuleData.support || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      approvedAt: 0,
      approvedBy: "",
      icon: newModuleData.icon || "Package",
      metadata: {
        tags: newModuleData.metadata?.tags || [],
        compatibility: newModuleData.metadata?.compatibility || ["v3.0"],
        dependencies: newModuleData.metadata?.dependencies || [],
        size: newModuleData.metadata?.size || "0MB",
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    setModules([...modules, newModule]);
    setShowCreateForm(false);
    
    // Reset form
    setNewModuleData({
      name: "",
      description: "",
      category: "Core",
      tier: "free",
      version: "1.0.0",
      status: "pending",
      developer: "",
      downloads: 0,
      rating: 0,
      reviews: 0,
      price: 0,
      features: [""],
      requirements: [""],
      documentation: "",
      support: "",
      icon: "Package",
      metadata: {
        tags: [],
        compatibility: ["v3.0"],
        dependencies: [],
        size: "0MB",
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    });

    toast.success(`Module "${newModule.name}" has been created and is pending approval!`);
  };

  const updateNewModuleField = (field: string, value: any) => {
    if (field.startsWith("metadata.")) {
      const metadataField = field.replace("metadata.", "");
      setNewModuleData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else if (field.startsWith("features.")) {
      const index = parseInt(field.split(".")[1]);
      const newFeatures = [...(newModuleData.features || [])];
      newFeatures[index] = value;
      setNewModuleData(prev => ({ ...prev, features: newFeatures }));
    } else if (field.startsWith("requirements.")) {
      const index = parseInt(field.split(".")[1]);
      const newRequirements = [...(newModuleData.requirements || [])];
      newRequirements[index] = value;
      setNewModuleData(prev => ({ ...prev, requirements: newRequirements }));
    } else {
      setNewModuleData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addNewFeature = () => {
    setNewModuleData(prev => ({
      ...prev,
      features: [...(prev.features || []), ""]
    }));
  };

  const removeNewFeature = (index: number) => {
    setNewModuleData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const addNewRequirement = () => {
    setNewModuleData(prev => ({
      ...prev,
      requirements: [...(prev.requirements || []), ""]
    }));
  };

  const removeNewRequirement = (index: number) => {
    setNewModuleData(prev => ({
      ...prev,
      requirements: (prev.requirements || []).filter((_, i) => i !== index)
    }));
  };

  const getModuleIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      GraduationCap,
      Briefcase,
      Brain,
      Library,
      Bus,
      CreditCard,
      MessageSquare,
      FileCheck,
      Building,
      Shield,
      Zap,
      BookOpen,
      Award,
      Target
    };
    return icons[iconName] || Package;
  };

  const openEditModal = (module: Module) => {
    setEditingModule(module);
    setEditFormData({
      ...module,
      features: [...module.features],
      requirements: [...module.requirements],
      metadata: { ...module.metadata }
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingModule(null);
    setEditFormData({});
  };

  const saveModuleChanges = () => {
    if (!editingModule) return;
    
    const updatedModules = modules.map(module => 
      module.id === editingModule.id 
        ? { 
            ...editFormData as Module,
            id: module.id,
            moduleId: module.moduleId,
            updatedAt: Date.now()
          }
        : module
    );
    
    setModules(updatedModules);
    closeEditModal();
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

  const renderModuleCard = (module: Module) => {
  const ModuleIcon = getModuleIcon(module.icon);
  return (
    <Card key={module.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-em-accent/20 to-em-accent/10 rounded-lg flex items-center justify-center">
                <ModuleIcon className="h-6 w-6 text-em-accent" />
              </div>
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
                <p className="text-muted-foreground text-sm">{module.description}</p>
              </div>
            </div>
            
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
            <Button variant="ghost" size="sm" onClick={() => openEditModal(module)}>
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
};

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            {(modules.reduce((sum, m) => sum + m.rating, 0) / modules.length).toFixed(1)}
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
          <Button variant="outline" onClick={seedRegistry}>
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
          
          {/* Download Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Download Trends & User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={ANALYTICS_DATA.downloadTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="downloads" stroke="#3b82f6" strokeWidth={2} name="Downloads" />
                    <Line yAxisId="right" type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} name="New Users" />
                  </RechartsLineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {ANALYTICS_DATA.downloadTrends.map((data, index) => (
                    <div key={index} className="text-center p-2 border rounded">
                      <div className="text-sm font-medium">{data.month}</div>
                      <div className="text-lg font-bold text-blue-600">{data.downloads}</div>
                      <div className="text-xs text-muted-foreground">+{data.newUsers} new</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Distribution - Real Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={ANALYTICS_DATA.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ANALYTICS_DATA.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Revenue Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tier Revenue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ANALYTICS_DATA.tierDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (KES)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution - Treemap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <Treemap
                    data={ANALYTICS_DATA.geographicData}
                    dataKey="users"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="#3b82f6"
                  >
                    <Tooltip content={({ payload }) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="font-medium">{data.country}</p>
                            <p className="text-sm">Users: {data.users.toLocaleString()}</p>
                            <p className="text-sm">Percentage: {data.percentage}%</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                  </Treemap>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Developer Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Developer Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={ANALYTICS_DATA.developerMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="developer" />
                    <PolarRadiusAxis />
                    <Radar name="Modules" dataKey="modules" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Downloads" dataKey="downloads" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Radar name="Rating" dataKey="rating" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Developer Rankings</h4>
                  {ANALYTICS_DATA.developerMetrics.map((dev, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-em-accent rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{dev.developer}</div>
                          <div className="text-sm text-muted-foreground">{dev.modules} modules</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{dev.rating}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{dev.downloads.toLocaleString()} downloads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ANALYTICS_DATA.downloadTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newUsers" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Revenue Growth" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Module Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Module Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-muted-foreground">Active Modules</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">4.7</div>
                      <div className="text-sm text-muted-foreground">Avg Rating</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">87%</div>
                      <div className="text-sm text-muted-foreground">User Satisfaction</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">156</div>
                      <div className="text-sm text-muted-foreground">Daily Active Users</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Marketplace Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "New module installed", module: "AI Tutor Assistant", time: "2 mins ago", type: "install" },
                  { action: "Module updated", module: "Academics Module V2", time: "15 mins ago", type: "update" },
                  { action: "New review", module: "HR Management Suite", time: "1 hour ago", type: "review" },
                  { action: "Module downloaded", module: "Communications Hub", time: "2 hours ago", type: "download" },
                  { action: "New module submitted", module: "Exam System Pro", time: "3 hours ago", type: "submit" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'install' ? 'bg-green-500' :
                        activity.type === 'update' ? 'bg-blue-500' :
                        activity.type === 'review' ? 'bg-yellow-500' :
                        activity.type === 'download' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.module}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
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

      {/* Add Module Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Module
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newModuleName">Module Name *</Label>
                      <Input
                        id="newModuleName"
                        value={newModuleData.name || ""}
                        onChange={(e) => updateNewModuleField("name", e.target.value)}
                        placeholder="Enter module name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleVersion">Version</Label>
                      <Input
                        id="newModuleVersion"
                        value={newModuleData.version || ""}
                        onChange={(e) => updateNewModuleField("version", e.target.value)}
                        className="font-mono"
                        placeholder="1.0.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleCategory">Category</Label>
                      <Select value={newModuleData.category} onValueChange={(value) => updateNewModuleField("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.filter(cat => cat !== "All").map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleTier">Tier</Label>
                      <Select value={newModuleData.tier} onValueChange={(value) => updateNewModuleField("tier", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.filter(tier => tier !== "All").map((tier) => (
                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModulePrice">Price (KES)</Label>
                      <Input
                        id="newModulePrice"
                        type="number"
                        value={newModuleData.price || 0}
                        onChange={(e) => updateNewModuleField("price", parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleDeveloper">Developer *</Label>
                      <Input
                        id="newModuleDeveloper"
                        value={newModuleData.developer || ""}
                        onChange={(e) => updateNewModuleField("developer", e.target.value)}
                        placeholder="Enter developer name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newModuleDescription">Description *</Label>
                    <Textarea
                      id="newModuleDescription"
                      value={newModuleData.description || ""}
                      onChange={(e) => updateNewModuleField("description", e.target.value)}
                      rows={3}
                      placeholder="Enter module description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newModuleDocumentation">Documentation URL</Label>
                      <Input
                        id="newModuleDocumentation"
                        value={newModuleData.documentation || ""}
                        onChange={(e) => updateNewModuleField("documentation", e.target.value)}
                        placeholder="https://docs.example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleSupport">Support Email</Label>
                      <Input
                        id="newModuleSupport"
                        value={newModuleData.support || ""}
                        onChange={(e) => updateNewModuleField("support", e.target.value)}
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Module Features</Label>
                    <Button variant="outline" size="sm" onClick={addNewFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {(newModuleData.features || []).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateNewModuleField(`features.${index}`, e.target.value)}
                          placeholder="Enter feature description"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeNewFeature(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="requirements" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>System Requirements</Label>
                    <Button variant="outline" size="sm" onClick={addNewRequirement}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Requirement
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {(newModuleData.requirements || []).map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={requirement}
                          onChange={(e) => updateNewModuleField(`requirements.${index}`, e.target.value)}
                          placeholder="Enter requirement"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeNewRequirement(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newModuleSize">Module Size</Label>
                      <Input
                        id="newModuleSize"
                        value={newModuleData.metadata?.size || ""}
                        onChange={(e) => updateNewModuleField("metadata.size", e.target.value)}
                        placeholder="e.g. 45MB"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newModuleTags">Tags (comma-separated)</Label>
                      <Input
                        id="newModuleTags"
                        value={newModuleData.metadata?.tags?.join(", ") || ""}
                        onChange={(e) => updateNewModuleField("metadata.tags", e.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newModuleCompatibility">Compatibility (comma-separated)</Label>
                      <Input
                        id="newModuleCompatibility"
                        value={newModuleData.metadata?.compatibility?.join(", ") || ""}
                        onChange={(e) => updateNewModuleField("metadata.compatibility", e.target.value.split(",").map(version => version.trim()).filter(Boolean))}
                        placeholder="v3.0, v3.1, v3.2"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newModuleDependencies">Dependencies (comma-separated)</Label>
                      <Input
                        id="newModuleDependencies"
                        value={newModuleData.metadata?.dependencies?.join(", ") || ""}
                        onChange={(e) => updateNewModuleField("metadata.dependencies", e.target.value.split(",").map(dep => dep.trim()).filter(Boolean))}
                        placeholder="module1, module2"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModal && editingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Module: {editingModule.name}
                </span>
                <Button variant="ghost" size="sm" onClick={closeEditModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">Module Name</Label>
                    <Input
                      id="moduleName"
                      value={editFormData.name || ""}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moduleVersion">Version</Label>
                    <Input
                      id="moduleVersion"
                      value={editFormData.version || ""}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, version: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="moduleDescription">Description</Label>
                  <Textarea
                    id="moduleDescription"
                    value={editFormData.description || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button onClick={saveModuleChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
