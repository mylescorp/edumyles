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

  // Show loading state while session is being established
  if (!sessionToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // Get available modules
  const modulesQuery = useQuery(
    api.modules.marketplace?.queries?.getAvailableForTier,
    {},
    !!sessionToken
  );
  const modules = modulesQuery?.data || [
    {
      _id: "mock_1",
      moduleId: "ai_tutor",
      name: "AI Tutor Assistant",
      description: "Advanced AI-powered tutoring system for personalized learning",
      tier: "premium",
      category: "academics",
      status: "active",
      version: "2.1.0",
      pricing: {
        monthly: 2999,
        quarterly: 8097,
        annual: 28788,
        currency: "KES"
      },
      features: [
        "Personalized learning paths",
        "Real-time feedback",
        "Progress tracking",
        "Multi-subject support"
      ],
      dependencies: [],
      documentation: "https://docs.edumyles.com/ai-tutor",
      support: {
        email: "support@edumyles.com",
        phone: "+254-700-123-456",
        responseTime: "24 hours"
      },
      availableForTier: true
    },
    {
      _id: "mock_2",
      moduleId: "finance_manager",
      name: "Finance Manager",
      description: "Comprehensive financial management for educational institutions",
      tier: "basic",
      category: "finance",
      status: "active",
      version: "1.5.0",
      pricing: {
        monthly: 1499,
        quarterly: 4047,
        annual: 14388,
        currency: "KES"
      },
      features: [
        "Fee collection management",
        "Budget tracking",
        "Financial reporting",
        "Payment processing"
      ],
      dependencies: [],
      documentation: "https://docs.edumyles.com/finance-manager",
      support: {
        email: "support@edumyles.com",
        phone: "+254-700-123-456",
        responseTime: "24 hours"
      },
      availableForTier: true
    }
  ];
  const modulesLoading = modulesQuery?.isLoading || false;

  // Get tenant subscriptions - temporarily using installed modules
  const subscriptionsQuery = useQuery(
    api.modules.marketplace?.queries?.getInstalledModules,
    {},
    !!sessionToken
  );
  const subscriptions = subscriptionsQuery?.data || [
    {
      _id: "sub_1",
      moduleId: "ai_tutor",
      billingCycle: "monthly",
      status: "active",
      activatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
      cancelledAt: undefined,
      cancelReason: undefined,
      autoRenew: true,
      features: [
        "Personalized learning paths",
        "Real-time feedback",
        "Progress tracking",
        "Multi-subject support"
      ],
      module: {
        _id: "mock_1",
        moduleId: "ai_tutor",
        name: "AI Tutor Assistant",
        description: "Advanced AI-powered tutoring system for personalized learning",
        tier: "premium",
        category: "academics",
        status: "active",
        version: "2.1.0",
        pricing: {
          monthly: 2999,
          quarterly: 8097,
          annual: 28788,
          currency: "KES"
        },
        features: [
          "Personalized learning paths",
          "Real-time feedback",
          "Progress tracking",
          "Multi-subject support"
        ],
        dependencies: [],
        documentation: "https://docs.edumyles.com/ai-tutor",
        support: {
          email: "support@edumyles.com",
          phone: "+254-700-123-456",
          responseTime: "24 hours"
        },
        availableForTier: true
      },
      daysUntilExpiry: 2,
      isExpiringSoon: true
    }
  ];
  const subscriptionsLoading = subscriptionsQuery?.isLoading || false;

  // Payment mutations - temporarily using marketplace mutations
  const initiatePayment = useMutation(api.modules.marketplace?.mutations?.installModule);
  const cancelSubscription = useMutation(api.modules.marketplace?.mutations?.uninstallModule);

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
                    <RadioGroup>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="monthly" 
                          checked={billingCycle === "monthly"}
                          onClick={() => setBillingCycle("monthly")}
                        />
                        <Label htmlFor="monthly">
                          Monthly - {formatCurrency(selectedModule.pricing.monthly, selectedModule.pricing.currency)}
                        </Label>
                      </div>
                      {selectedModule.pricing.quarterly && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="quarterly" 
                            checked={billingCycle === "quarterly"}
                            onClick={() => setBillingCycle("quarterly")}
                          />
                          <Label htmlFor="quarterly">
                            Quarterly - {formatCurrency(selectedModule.pricing.quarterly, selectedModule.pricing.currency)}
                            <span className="text-green-600 ml-2">Save 10%</span>
                          </Label>
                        </div>
                      )}
                      {selectedModule.pricing.annual && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="annual" 
                            checked={billingCycle === "annual"}
                            onClick={() => setBillingCycle("annual")}
                          />
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
                    <RadioGroup>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="mpesa" 
                          checked={paymentMethod === "mpesa"}
                          onClick={() => setPaymentMethod("mpesa")}
                        />
                        <Label htmlFor="mpesa" className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          M-Pesa
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="card" 
                          checked={paymentMethod === "card"}
                          onClick={() => setPaymentMethod("card")}
                        />
                        <Label htmlFor="card" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="bank_transfer" 
                          checked={paymentMethod === "bank_transfer"}
                          onClick={() => setPaymentMethod("bank_transfer")}
                        />
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
