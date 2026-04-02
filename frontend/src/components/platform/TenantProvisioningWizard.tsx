"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2,
  CreditCard,
  Globe,
  Package,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap,
  Shield,
  Star,
  TrendingUp,
  Clock,
  CheckSquare,
  Square
} from "lucide-react";

interface TenantProvisioningData {
  // Step 1: School Information
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolCounty: string;
  schoolCountry: string;
  schoolType: string;
  studentCount: string;
  
  // Step 2: Plan/Billing
  plan: string;
  billingCycle: string;
  paymentMethod: string;
  trialPeriod: string;
  
  // Step 3: Slug/Domain
  subdomain: string;
  customDomain: string;
  enableSSL: boolean;
  
  // Step 4: Modules
  selectedModules: string[];
  
  // Step 5: Review/Confirm
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

interface TenantProvisioningWizardProps {
  className?: string;
}

const PLAN_OPTIONS = [
  {
    id: "starter",
    name: "Starter",
    price: "KES 5,000",
    description: "Perfect for small schools getting started",
    features: ["Up to 100 students", "Basic academics", "Email support", "5GB storage"],
    popular: false,
    color: "bg-em-success-bg/10 text-em-success border-em-success/20"
  },
  {
    id: "growth", 
    name: "Growth",
    price: "KES 15,000",
    description: "Ideal for growing schools with advanced needs",
    features: ["Up to 500 students", "Full academics", "Priority support", "20GB storage", "Advanced reporting"],
    popular: true,
    color: "bg-em-info-bg/10 text-em-info border-em-info/20"
  },
  {
    id: "pro",
    name: "Pro", 
    price: "KES 30,000",
    description: "Comprehensive solution for established schools",
    features: ["Up to 2,000 students", "All features", "Dedicated support", "50GB storage", "Custom integrations"],
    popular: false,
    color: "bg-em-accent-bg/10 text-em-accent-dark border-em-accent/20"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solution for large educational institutions",
    features: ["Unlimited students", "All features", "White-glove support", "Unlimited storage", "Custom development"],
    popular: false,
    color: "bg-purple-500/10 text-purple-700 border-purple-200"
  }
];

const MODULE_OPTIONS = [
  {
    id: "academics",
    name: "Academics",
    description: "Student records, grades, timetables, and examinations",
    icon: "📚",
    category: "Core",
    included: true
  },
  {
    id: "communications",
    name: "Communications", 
    description: "Email, SMS, announcements, and parent messaging",
    icon: "📧",
    category: "Core",
    included: true
  },
  {
    id: "billing",
    name: "Billing",
    description: "Fee management, invoicing, payment processing",
    icon: "💳",
    category: "Core",
    included: true
  },
  {
    id: "hr",
    name: "HR Management",
    description: "Staff records, payroll, leave management",
    icon: "👥",
    category: "Advanced",
    included: false
  },
  {
    id: "library",
    name: "Library",
    description: "Book catalog, circulation, inventory management",
    icon: "📖",
    category: "Advanced",
    included: false
  },
  {
    id: "transport",
    name: "Transport",
    description: "Vehicle management, route planning, tracking",
    icon: "🚌",
    category: "Advanced",
    included: false
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Asset tracking, supplies management",
    icon: "📦",
    category: "Advanced",
    included: false
  },
  {
    id: "hostel",
    name: "Hostel",
    description: "Room allocation, visitor management, amenities",
    icon: "🏠",
    category: "Advanced",
    included: false
  }
];

const COUNTY_OPTIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos", "Kajiado", "Kericho",
  "Bungoma", "Kitui", "Meru", "Tharaka-Nithi", "Embu", "Isiolo", "Samburu", "Turkana",
  "West Pokot", "Baringo", "Laikipia", "Nandi", "Uasin Gishu", "Elgeyo Marakwet", "Trans Nzoia",
  "Bomet", "Kakamega", "Vihiga", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira",
  "Taita Taveta", "Kwale", "Kilifi", "Tana River", "Lamu", "Garissa", "Wajir", "Mandera"
];

const SCHOOL_TYPES = [
  "Primary School", "Secondary School", "Mixed Day & Boarding", "International School",
  "Academy", "College", "University", "Vocational Training"
];

export function TenantProvisioningWizard({ className = "" }: TenantProvisioningWizardProps) {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const createTenant = useMutation(api.platform.tenants.mutations.createTenant);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TenantProvisioningData>({
    // Step 1: School Information
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolCounty: "",
    schoolCountry: "KE",
    schoolType: "",
    studentCount: "",
    
    // Step 2: Plan/Billing
    plan: "",
    billingCycle: "monthly",
    paymentMethod: "mpesa",
    trialPeriod: "30",
    
    // Step 3: Slug/Domain
    subdomain: "",
    customDomain: "",
    enableSSL: true,
    
    // Step 4: Modules
    selectedModules: ["academics", "communications", "billing"],
    
    // Step 5: Review/Confirm
    agreedToTerms: false,
    agreedToPrivacy: false,
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof TenantProvisioningData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.schoolName && formData.schoolEmail && formData.schoolCounty && formData.schoolType);
      case 2:
        return !!formData.plan;
      case 3:
        return !!formData.subdomain && /^[a-zA-Z0-9-]+$/.test(formData.subdomain);
      case 4:
        return formData.selectedModules.length > 0;
      case 5:
        return formData.agreedToTerms && formData.agreedToPrivacy;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      setError("Please complete all required fields");
      return;
    }
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError("Please complete all required fields");
      return;
    }

    if (!sessionToken) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map form data to tenant creation format (matching API signature)
      const tenantData = {
        sessionToken,
        name: formData.schoolName,
        subdomain: formData.subdomain,
        email: formData.schoolEmail,
        phone: formData.schoolPhone || "",
        plan: formData.plan as "free" | "starter" | "growth" | "enterprise",
        county: formData.schoolCounty,
        country: formData.schoolCountry || "KE"
      };

      console.log("Creating tenant with data:", tenantData);

      // Call the real API
      const result = await createTenant(tenantData);
      console.log("Tenant created successfully:", result);

      // Provision a real WorkOS Organization for this tenant so users can be
      // added to it and SSO / directory-sync features work correctly.
      try {
        const orgRes = await fetch("/api/tenants/provision-org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken, tenantId: result.tenantId }),
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          console.log("WorkOS organization provisioned:", orgData.workosOrgId);
        } else {
          // Non-fatal — tenant is created; WorkOS org can be provisioned later
          console.warn("WorkOS org provisioning failed (non-fatal):", await orgRes.text());
        }
      } catch (orgErr) {
        console.warn("WorkOS org provisioning error (non-fatal):", orgErr);
      }

      // Redirect to tenants list on success
      router.push("/platform/tenants");
    } catch (err: any) {
      console.error("Tenant creation error:", err);
      setError(err.message || "Failed to create tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">School Information</h3>
              <p className="text-muted-foreground">Tell us about the educational institution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    placeholder="e.g. St. John's Academy"
                    value={formData.schoolName}
                    onChange={(e) => updateFormData("schoolName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email *</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    placeholder="admin@school.edu"
                    value={formData.schoolEmail}
                    onChange={(e) => updateFormData("schoolEmail", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">Phone Number</Label>
                  <Input
                    id="schoolPhone"
                    placeholder="+254 712 345 678"
                    value={formData.schoolPhone}
                    onChange={(e) => updateFormData("schoolPhone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType">School Type *</Label>
                  <Select value={formData.schoolType} onValueChange={(value) => updateFormData("schoolType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Physical Address</Label>
                  <Input
                    id="schoolAddress"
                    placeholder="123 Education Road, Nairobi"
                    value={formData.schoolAddress}
                    onChange={(e) => updateFormData("schoolAddress", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolCounty">County *</Label>
                  <Select value={formData.schoolCounty} onValueChange={(value) => updateFormData("schoolCounty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTY_OPTIONS.map((county) => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentCount">Expected Student Count</Label>
                  <Select value={formData.studentCount} onValueChange={(value) => updateFormData("studentCount", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50 students</SelectItem>
                      <SelectItem value="51-100">51-100 students</SelectItem>
                      <SelectItem value="101-250">101-250 students</SelectItem>
                      <SelectItem value="251-500">251-500 students</SelectItem>
                      <SelectItem value="501-1000">501-1000 students</SelectItem>
                      <SelectItem value="1000+">1000+ students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Plan</h3>
              <p className="text-muted-foreground">Select the plan that best fits your school's needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLAN_OPTIONS.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    formData.plan === plan.id 
                      ? "ring-2 ring-primary border-primary" 
                      : "hover:border-primary/50"
                  } ${plan.popular ? "relative" : ""}`}
                  onClick={() => updateFormData("plan", plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-em-accent text-em-accent-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-3">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">{plan.price}</div>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-em-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={formData.billingCycle} onValueChange={(value) => updateFormData("billingCycle", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (5% off)</SelectItem>
                    <SelectItem value="annually">Annually (15% off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData("paymentMethod", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trial Period</Label>
                <Select value={formData.trialPeriod} onValueChange={(value) => updateFormData("trialPeriod", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Domain Configuration</h3>
              <p className="text-muted-foreground">Set up your school's online presence</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="subdomain"
                      placeholder="stjohns"
                      value={formData.subdomain}
                      onChange={(e) => updateFormData("subdomain", e.target.value.toLowerCase())}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">.edumyles.co.ke</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will be your school's unique URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                  <Input
                    id="customDomain"
                    placeholder="www.stjohnsacademy.sc.ke"
                    value={formData.customDomain}
                    onChange={(e) => updateFormData("customDomain", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use your own domain for professional appearance
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableSSL"
                    checked={formData.enableSSL}
                    onCheckedChange={(checked) => updateFormData("enableSSL", checked)}
                  />
                  <Label htmlFor="enableSSL" className="flex items-center cursor-pointer">
                    <Shield className="h-4 w-4 mr-2 text-em-success" />
                    Enable SSL Certificate (Recommended)
                  </Label>
                </div>
              </div>

              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  Your subdomain will be ready immediately. Custom domains require DNS configuration which we'll guide you through.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Modules</h3>
              <p className="text-muted-foreground">Choose the modules you want to enable for your school</p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-em-success" />
                  Core Modules (Included)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULE_OPTIONS.filter(m => m.category === "Core").map((module) => (
                    <Card key={module.id} className="cursor-pointer border-em-success/20 bg-em-success-bg/5">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{module.icon}</div>
                          <div className="flex-1">
                            <h5 className="font-medium">{module.name}</h5>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                            <Badge variant="secondary" className="mt-2 text-xs">Included</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-em-accent-dark" />
                  Advanced Modules (Add-on)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULE_OPTIONS.filter(m => m.category === "Advanced").map((module) => (
                    <Card 
                      key={module.id} 
                      className={`cursor-pointer transition-all ${
                        formData.selectedModules.includes(module.id)
                          ? "ring-2 ring-em-accent border-em-accent"
                          : "hover:border-em-accent/50"
                      }`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{module.icon}</div>
                          <div className="flex-1">
                            <h5 className="font-medium">{module.name}</h5>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                            <div className="mt-2">
                              {formData.selectedModules.includes(module.id) ? (
                                <Badge className="bg-em-accent text-em-accent-foreground text-xs">
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  Selected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Square className="h-3 w-3 mr-1" />
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
              <p className="text-muted-foreground">Please review your information before creating your account</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">School Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">School Name:</span>
                      <span className="font-medium">{formData.schoolName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{formData.schoolEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{formData.schoolPhone || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{formData.schoolType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">County:</span>
                      <span className="font-medium">{formData.schoolCounty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">{formData.studentCount || "Not specified"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Plan & Billing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">{PLAN_OPTIONS.find(p => p.id === formData.plan)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{PLAN_OPTIONS.find(p => p.id === formData.plan)?.price}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing:</span>
                      <span className="font-medium capitalize">{formData.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium capitalize">{formData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trial:</span>
                      <span className="font-medium">{formData.trialPeriod} days</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Domain & Modules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdomain:</span>
                    <span className="font-medium">{formData.subdomain}.edumyles.co.ke</span>
                  </div>
                  {formData.customDomain && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custom Domain:</span>
                      <span className="font-medium">{formData.customDomain}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SSL Certificate:</span>
                    <span className="font-medium">{formData.enableSSL ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Selected Modules:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.selectedModules.map((moduleId) => {
                        const selectedModule = MODULE_OPTIONS.find(m => m.id === moduleId);
                        return (
                          <Badge key={moduleId} variant="secondary" className="text-xs">
                            {selectedModule?.icon} {selectedModule?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => updateFormData("agreedToTerms", checked)}
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreedToPrivacy"
                    checked={formData.agreedToPrivacy}
                    onCheckedChange={(checked) => updateFormData("agreedToPrivacy", checked)}
                  />
                  <Label htmlFor="agreedToPrivacy" className="text-sm">
                    I agree to the <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
          <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "bg-em-success text-em-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
          ))}
        </div>

        {currentStep === totalSteps ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !validateStep(currentStep)}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        ) : (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
}
