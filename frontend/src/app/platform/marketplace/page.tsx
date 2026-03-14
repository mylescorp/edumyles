"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ShoppingCart, CreditCard, Smartphone, Building2, CheckCircle, XCircle, Clock, Tag, Star, Info } from "lucide-react";

interface Module {
  _id: string;
  moduleId: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  status: string;
  version: string;
  pricing: {
    monthly: number;
    quarterly?: number;
    annual?: number;
    currency: string;
  };
  features: string[];
  dependencies: string[];
  documentation: string;
  support: {
    email: string;
    phone: string;
    responseTime: string;
  };
  availableForTier?: boolean;
}

interface Subscription {
  _id: string;
  moduleId: string;
  billingCycle: string;
  status: string;
  activatedAt: number;
  expiresAt: number;
  cancelledAt?: number;
  cancelReason?: string;
  autoRenew: boolean;
  features: string[];
  module?: Module;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
}

export default function MarketplacePage() {
  const { sessionToken } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [couponCode, setCouponCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get available modules
  const { data: modules, isLoading: modulesLoading } = useQuery(
    api.modules.marketplace.getAvailableForTier,
    {},
    !!sessionToken
  );

  // Get tenant subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery(
    api.platform.marketplace.payments.getTenantSubscriptions,
    { sessionToken },
    !!sessionToken
  );

  // Payment mutations
  const initiatePayment = useMutation(api.platform.marketplace.payments.initiatePayment);
  const cancelSubscription = useMutation(api.platform.marketplace.payments.cancelSubscription);

  // Filter modules
  const filteredModules = modules?.filter(module => {
    const categoryMatch = selectedCategory === "all" || module.category === selectedCategory;
    const tierMatch = selectedTier === "all" || module.tier === selectedTier;
    return categoryMatch && tierMatch;
  }) || [];

  // Calculate pricing
  const calculatePricing = (module: Module, cycle: string) => {
    const basePrice = module.pricing.monthly;
    let multiplier = 1;
    let discount = 0;

    if (cycle === "quarterly") {
      multiplier = 3;
      discount = 0.1;
    } else if (cycle === "annual") {
      multiplier = 12;
      discount = 0.2;
    }

    const total = basePrice * multiplier * (1 - discount);
    const saved = basePrice * multiplier * discount;

    return {
      basePrice,
      total,
      saved,
      discount: discount * 100,
    };
  };

  // Handle module purchase
  const handlePurchase = async () => {
    if (!selectedModule || !sessionToken) return;

    setIsProcessing(true);
    try {
      const result = await initiatePayment({
        moduleId: selectedModule.moduleId,
        paymentMethod,
        billingCycle,
        couponCode: couponCode || undefined,
        sessionToken,
      });

      // Redirect to payment URL
      if (result.paymentUrl) {
        window.open(result.paymentUrl, "_blank");
      }

      setIsPurchaseDialogOpen(false);
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (subscriptionId: string, reason: string) => {
    if (!sessionToken) return;

    try {
      await cancelSubscription({
        subscriptionId,
        reason,
        sessionToken,
      });
    } catch (error: any) {
      console.error("Cancellation failed:", error);
    }
  };

  const pricing = selectedModule ? calculatePricing(selectedModule, billingCycle) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Module Marketplace</h1>
          <p className="text-gray-600 mt-1">Extend your platform with powerful modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" />
            {subscriptions?.length || 0} Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Modules</TabsTrigger>
          <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="academics">Academics</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="communications">Communications</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="integrations">Integrations</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module._id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription className="mt-1">{module.description}</CardDescription>
                    </div>
                    <Badge variant={module.tier === "free" ? "secondary" : "default"}>
                      {module.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{module.category}</Badge>
                    <Badge variant="outline">v{module.version}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {module.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                      {module.features.length > 3 && (
                        <li className="text-gray-500">+{module.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(module.pricing.monthly, module.pricing.currency)}
                        <span className="text-sm text-gray-500">/month</span>
                      </p>
                      {module.pricing.quarterly && (
                        <p className="text-xs text-green-600">
                          Save 10% on quarterly
                        </p>
                      )}
                    </div>
                    {module.availableForTier && (
                      <Button
                        onClick={() => {
                          setSelectedModule(module);
                          setIsPurchaseDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Purchase
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions?.map((subscription) => (
              <Card key={subscription._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subscription.module?.name}</CardTitle>
                      <CardDescription>{subscription.module?.description}</CardDescription>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Billing Cycle:</span>
                      <span className="font-medium">{subscription.billingCycle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Activated:</span>
                      <span>{formatRelativeTime(subscription.activatedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expires:</span>
                      <span className={subscription.isExpiringSoon ? "text-orange-600" : ""}>
                        {formatRelativeTime(subscription.expiresAt)}
                      </span>
                    </div>
                    {subscription.isExpiringSoon && (
                      <Alert>
                        <Clock className="w-4 h-4" />
                        <AlertDescription>
                          Subscription expires in {subscription.daysUntilExpiry} days
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Active Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {subscription.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {subscription.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{subscription.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Auto-renew:</span>
                      <Badge variant={subscription.autoRenew ? "default" : "secondary"}>
                        {subscription.autoRenew ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {subscription.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelSubscription(subscription._id, "User requested cancellation")}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Purchase Module</DialogTitle>
            <DialogDescription>
              Complete your purchase of {selectedModule?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedModule && (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{selectedModule.name}</h3>
                    <p className="text-sm text-gray-600">{selectedModule.description}</p>
                  </div>

                  <div>
                    <Label>Billing Cycle</Label>
                    <RadioGroup value={billingCycle} onValueChange={setBillingCycle}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">
                          Monthly - {formatCurrency(selectedModule.pricing.monthly, selectedModule.pricing.currency)}
                        </Label>
                      </div>
                      {selectedModule.pricing.quarterly && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="quarterly" id="quarterly" />
                          <Label htmlFor="quarterly">
                            Quarterly - {formatCurrency(selectedModule.pricing.quarterly, selectedModule.pricing.currency)}
                            <span className="text-green-600 ml-2">Save 10%</span>
                          </Label>
                        </div>
                      )}
                      {selectedModule.pricing.annual && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="annual" id="annual" />
                          <Label htmlFor="annual">
                            Annual - {formatCurrency(selectedModule.pricing.annual, selectedModule.pricing.currency)}
                            <span className="text-green-600 ml-2">Save 20%</span>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mpesa" id="mpesa" />
                        <Label htmlFor="mpesa" className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          M-Pesa
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Bank Transfer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                    <Input
                      id="coupon"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>

                  {pricing && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(pricing.basePrice * (billingCycle === "monthly" ? 1 : billingCycle === "quarterly" ? 3 : 12), selectedModule.pricing.currency)}</span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({pricing.discount}%):</span>
                          <span>-{formatCurrency(pricing.saved, selectedModule.pricing.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(pricing.total, selectedModule.pricing.currency)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  Globe,
  Link,
  Key,
  Database,
  Cloud,
  DollarSign,
  FileText,
  TestTube,
  Plug,
  Cpu,
  Wifi,
  Lock,
  Mail,
  Phone,
  Building,
  School,
  Briefcase,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  BookOpen,
  Video,
  Headphones,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

interface Integration {
  _id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  type: string;
  version: string;
  documentation: string;
  configuration: Record<string, any>;
  pricing: {
    model: string;
    currency?: string;
    amount?: number;
    unit?: string;
    features: string[];
  };
  requirements: string[];
  capabilities: string[];
  isActive: boolean;
  popularity: number;
  rating: number;
  reviews: number;
  installs: number;
  createdAt: number;
  updatedAt: number;
}

interface InstalledIntegration {
  _id: string;
  tenantId: string;
  tenantName: string;
  integrationId: string;
  integrationName: string;
  category: string;
  provider: string;
  version: string;
  status: string;
  configuration: Record<string, any>;
  settings: {
    autoSync: boolean;
    syncFrequency: string;
    notifications: boolean;
    logging: boolean;
  };
  lastSync: number;
  nextSync: number;
  usage: {
    totalCalls: number;
    lastMonthCalls: number;
    errorRate: number;
    avgResponseTime: number;
  };
  installedAt: number;
  installedBy: string;
  updatedAt: number;
  health: {
    status: string;
    lastCheck: number;
    uptime: number;
    issues: string[];
  };
}

export default function MarketplacePage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Mock data - replace with actual queries
  const marketplaceOverview = {
    overview: {
      totalIntegrations: 8,
      activeIntegrations: 8,
      totalInstalls: 8967,
      activeInstalls: 6234,
      totalTemplates: 3,
      publicTemplates: 3,
      averageRating: 4.6,
      totalReviews: 1234,
    },
    categories: [
      {
        category: "payment",
        integrations: 1,
        installs: 892,
        averageRating: 4.8,
        popular: true,
      },
      {
        category: "communication",
        integrations: 1,
        installs: 654,
        averageRating: 4.6,
        popular: true,
      },
      {
        category: "analytics",
        integrations: 1,
        installs: 1567,
        averageRating: 4.7,
        popular: true,
      },
      {
        category: "storage",
        integrations: 1,
        installs: 2897,
        averageRating: 4.9,
        popular: true,
      },
      {
        category: "crm",
        integrations: 1,
        installs: 892,
        averageRating: 4.5,
        popular: false,
      },
      {
        category: "education",
        integrations: 1,
        installs: 234,
        averageRating: 4.4,
        popular: false,
      },
      {
        category: "security",
        integrations: 1,
        installs: 1678,
        averageRating: 4.7,
        popular: true,
      },
      {
        category: "productivity",
        integrations: 1,
        installs: 789,
        averageRating: 4.6,
        popular: false,
      },
    ],
    topIntegrations: [
      {
        integrationId: "integration_1",
        name: "Stripe Payment Gateway",
        provider: "Stripe",
        category: "payment",
        installs: 892,
        rating: 4.8,
        reviews: 1247,
        revenue: 15420.50,
        trend: "increasing",
      },
      {
        integrationId: "integration_4",
        name: "Amazon S3 Storage",
        provider: "Amazon Web Services",
        category: "storage",
        installs: 2897,
        rating: 4.9,
        reviews: 3421,
        revenue: 28970.00,
        trend: "stable",
      },
      {
        integrationId: "integration_3",
        name: "Google Analytics 4",
        provider: "Google",
        category: "analytics",
        installs: 1567,
        rating: 4.7,
        reviews: 2156,
        revenue: 0.00,
        trend: "increasing",
      },
    ],
    recentActivity: [
      {
        type: "install",
        integrationName: "Stripe Payment Gateway",
        tenantName: "Eldoret Academy",
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        user: "admin@eldoretacademy.edu",
      },
      {
        type: "template_download",
        templateName: "Payment Processing Bundle",
        tenantName: "Nakuru High School",
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        user: "tech@nakuruhigh.edu",
      },
      {
        type: "update",
        integrationName: "SendGrid Email Service",
        tenantName: "Thika Girls School",
        timestamp: Date.now() - 6 * 60 * 60 * 1000,
        user: "admin@thikagirls.edu",
      },
      {
        type: "test",
        integrationName: "Google Analytics 4",
        tenantName: "Mombasa International School",
        timestamp: Date.now() - 8 * 60 * 60 * 1000,
        user: "analytics@mombasainternational.edu",
      },
    ],
  };

  const availableIntegrations: Integration[] = [
    {
      _id: "integration_1",
      name: "Stripe Payment Gateway",
      description: "Secure payment processing with support for multiple currencies and payment methods",
      category: "payment",
      provider: "Stripe",
      type: "api",
      version: "v2024-03-20",
      documentation: "https://stripe.com/docs/api",
      configuration: {
        apiKey: "string",
        webhookSecret: "string",
        defaultCurrency: "string",
      },
      pricing: {
        model: "usage_based",
        currency: "USD",
        amount: 0.029,
        unit: "per_transaction",
        features: ["Credit cards", "Bank transfers", "Digital wallets", "Recurring billing"],
      },
      requirements: ["SSL certificate", "Webhook endpoint", "PCI compliance"],
      capabilities: ["Payment processing", "Subscription management", "Dispute handling", "Fraud detection"],
      isActive: true,
      popularity: 95,
      rating: 4.8,
      reviews: 1247,
      installs: 892,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      _id: "integration_2",
      name: "SendGrid Email Service",
      description: "Reliable email delivery with advanced analytics and template management",
      category: "communication",
      provider: "SendGrid",
      type: "api",
      version: "v3.0",
      documentation: "https://sendgrid.com/docs/api-reference/",
      configuration: {
        apiKey: "string",
        fromEmail: "string",
        defaultTemplate: "string",
      },
      pricing: {
        model: "freemium",
        currency: "USD",
        amount: 15.00,
        unit: "per_month",
        features: ["100 free emails/day", "Template library", "Analytics", "A/B testing"],
      },
      requirements: ["Verified domain", "API key", "From address"],
      capabilities: ["Email sending", "Template management", "Analytics", "Automation"],
      isActive: true,
      popularity: 88,
      rating: 4.6,
      reviews: 892,
      installs: 654,
      createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
    {
      _id: "integration_3",
      name: "Google Analytics 4",
      description: "Advanced web analytics and user behavior tracking",
      category: "analytics",
      provider: "Google",
      type: "api",
      version: "v1beta",
      documentation: "https://developers.google.com/analytics",
      configuration: {
        measurementId: "string",
        apiSecret: "string",
        streamId: "string",
      },
      pricing: {
        model: "free",
        features: ["Real-time analytics", "Custom reports", "User segmentation", "Conversion tracking"],
      },
      requirements: ["Google account", "GA4 property", "Measurement ID"],
      capabilities: ["Event tracking", "User analytics", "Conversion analysis", "Custom reports"],
      isActive: true,
      popularity: 92,
      rating: 4.7,
      reviews: 2156,
      installs: 1567,
      createdAt: Date.now() - 240 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    },
  ];

  const installedIntegrations: InstalledIntegration[] = [
    {
      _id: "install_1",
      tenantId: "tenant_1",
      tenantName: "Nairobi Academy",
      integrationId: "integration_1",
      integrationName: "Stripe Payment Gateway",
      category: "payment",
      provider: "Stripe",
      version: "v2024-03-20",
      status: "active",
      configuration: {
        apiKey: "sk_test_...masked",
        webhookSecret: "whsec_...masked",
        defaultCurrency: "USD",
      },
      settings: {
        autoSync: true,
        syncFrequency: "realtime",
        notifications: true,
        logging: true,
      },
      lastSync: Date.now() - 15 * 60 * 1000,
      nextSync: Date.now() + 45 * 60 * 1000,
      usage: {
        totalCalls: 1247,
        lastMonthCalls: 342,
        errorRate: 0.02,
        avgResponseTime: 145,
      },
      installedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      installedBy: "admin@nairobiacademy.edu",
      updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      health: {
        status: "healthy",
        lastCheck: Date.now() - 5 * 60 * 1000,
        uptime: 99.8,
        issues: [],
      },
    },
    {
      _id: "install_2",
      tenantId: "tenant_1",
      tenantName: "Nairobi Academy",
      integrationId: "integration_2",
      integrationName: "SendGrid Email Service",
      category: "communication",
      provider: "SendGrid",
      version: "v3.0",
      status: "active",
      configuration: {
        apiKey: "SG.123...masked",
        fromEmail: "noreply@nairobiacademy.edu",
        defaultTemplate: "welcome",
      },
      settings: {
        autoSync: true,
        syncFrequency: "hourly",
        notifications: true,
        logging: true,
      },
      lastSync: Date.now() - 30 * 60 * 1000,
      nextSync: Date.now() + 30 * 60 * 1000,
      usage: {
        totalCalls: 892,
        lastMonthCalls: 234,
        errorRate: 0.01,
        avgResponseTime: 89,
      },
      installedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      installedBy: "admin@nairobiacademy.edu",
      updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      health: {
        status: "healthy",
        lastCheck: Date.now() - 10 * 60 * 1000,
        uptime: 99.9,
        issues: [],
      },
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment": return <CreditCard className="h-4 w-4" />;
      case "communication": return <MessageSquare className="h-4 w-4" />;
      case "analytics": return <BarChart3 className="h-4 w-4" />;
      case "storage": return <HardDrive className="h-4 w-4" />;
      case "crm": return <Users className="h-4 w-4" />;
      case "education": return <GraduationCap className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      case "productivity": return <Zap className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-700 border-gray-200";
      case "error": return "bg-red-100 text-red-700 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "unhealthy": return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceOverview.overview.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">{marketplaceOverview.overview.activeIntegrations} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceOverview.overview.totalInstalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{marketplaceOverview.overview.activeInstalls} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceOverview.overview.averageRating}</div>
            <p className="text-xs text-muted-foreground">{marketplaceOverview.overview.totalReviews} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceOverview.overview.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">{marketplaceOverview.overview.publicTemplates} public</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketplaceOverview.categories.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(category.category)}
                  <div>
                    <div className="font-medium capitalize">{category.category}</div>
                    <div className="text-sm text-muted-foreground">{category.installs} installs</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm">{category.averageRating}</span>
                  </div>
                  {category.popular && <Badge variant="secondary">Popular</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketplaceOverview.topIntegrations.map((integration) => (
              <div key={integration.integrationId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(integration.category)}
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      <div className="text-sm text-muted-foreground">{integration.provider}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{integration.installs}</div>
                    <div className="text-sm text-muted-foreground">installs</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm">{integration.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketplaceOverview.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {activity.type === "install" && <Download className="h-4 w-4 text-blue-600" />}
                    {activity.type === "template_download" && <FileText className="h-4 w-4 text-green-600" />}
                    {activity.type === "update" && <RefreshCw className="h-4 w-4 text-orange-600" />}
                    {activity.type === "test" && <TestTube className="h-4 w-4 text-purple-600" />}
                    <div>
                      <div className="font-medium capitalize">{activity.type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.integrationName || activity.templateName}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{activity.tenantName}</div>
                  <div className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AvailableIntegrationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              className="pl-10 w-80"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="crm">CRM</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="amazon">Amazon</SelectItem>
              <SelectItem value="salesforce">Salesforce</SelectItem>
              <SelectItem value="auth0">Auth0</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="oauth">OAuth</SelectItem>
              <SelectItem value="sdk">SDK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableIntegrations.map((integration) => (
          <Card key={integration._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(integration.category)}
                  <Badge variant="outline" className="capitalize">{integration.type}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{integration.rating}</span>
                </div>
              </div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{integration.provider}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">{integration.version}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Installs</span>
                  <span className="font-medium">{integration.installs.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pricing</span>
                  <span className="font-medium capitalize">
                    {integration.pricing.model.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reviews</span>
                  <span className="font-medium">{integration.reviews.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress value={integration.popularity} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{integration.popularity}%</span>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setIsInstallDialogOpen(true);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Install
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const InstalledIntegrationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search installed integrations..."
              className="pl-10 w-80"
            />
          </div>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Installed Integrations List */}
      <div className="space-y-4">
        {installedIntegrations.map((installed) => (
          <Card key={installed._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(installed.category)}
                    <h3 className="font-semibold text-lg">{installed.integrationName}</h3>
                    <Badge className={getStatusColor(installed.status)}>
                      {installed.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getHealthIcon(installed.health.status)}
                      <span className="text-sm text-muted-foreground">
                        {installed.health.uptime}% uptime
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Provider</div>
                      <div className="text-muted-foreground">{installed.provider}</div>
                    </div>
                    <div>
                      <div className="font-medium">Version</div>
                      <div className="text-muted-foreground">{installed.version}</div>
                    </div>
                    <div>
                      <div className="font-medium">Last Sync</div>
                      <div className="text-muted-foreground">{formatRelativeTime(installed.lastSync)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Installed</div>
                      <div className="text-muted-foreground">{formatRelativeTime(installed.installedAt)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Calls</div>
                      <div className="text-muted-foreground">{installed.usage.totalCalls.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Last Month</div>
                      <div className="text-muted-foreground">{installed.usage.lastMonthCalls}</div>
                    </div>
                    <div>
                      <div className="font-medium">Error Rate</div>
                      <div className="text-muted-foreground">{(installed.usage.errorRate * 100).toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Avg Response</div>
                      <div className="text-muted-foreground">{installed.usage.avgResponseTime}ms</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch checked={installed.settings.autoSync} />
                    <span className="text-sm">Auto Sync ({installed.settings.syncFrequency})</span>
                    <Switch checked={installed.settings.notifications} />
                    <span className="text-sm">Notifications</span>
                    <Switch checked={installed.settings.logging} />
                    <span className="text-sm">Logging</span>
                  </div>
                  
                  {installed.health.issues.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600">Health Issues:</div>
                      {installed.health.issues.map((issue, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedIntegration(availableIntegrations.find(i => i._id === installed.integrationId) || null);
                      setIsTestDialogOpen(true);
                    }}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Uninstall
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Marketplace 2.0" 
        description="Enhanced marketplace with third-party integrations and templates"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="installed">Installed Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="available">
          <AvailableIntegrationsTab />
        </TabsContent>
        
        <TabsContent value="installed">
          <InstalledIntegrationsTab />
        </TabsContent>
      </Tabs>

      {/* Install Dialog */}
      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Install Integration</DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{selectedIntegration.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(selectedIntegration.category)}
                  <Badge variant="outline">{selectedIntegration.provider}</Badge>
                  <Badge variant="outline">{selectedIntegration.type}</Badge>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Configuration</Label>
                {Object.entries(selectedIntegration.configuration).map(([key, type]) => (
                  <div key={key} className="grid gap-1">
                    <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Input id={key} type={type === 'string' ? 'text' : 'password'} placeholder={`Enter ${key}`} />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Auto Sync</Label>
                  <Switch />
                </div>
                <div className="grid gap-2">
                  <Label>Notifications</Label>
                  <Switch />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Sync Frequency</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsInstallDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsInstallDialogOpen(false)}>
              Install Integration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Integration</DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{selectedIntegration.name}</h3>
                <p className="text-sm text-muted-foreground">Run tests to verify integration connectivity</p>
              </div>
              
              <div className="space-y-2">
                <Button className="w-full">
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connectivity
                </Button>
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Test Authentication
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Data Sync
                </Button>
                <Button variant="outline" className="w-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Webhook
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
