"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Package, Star, Search, Download, RefreshCw,
  TrendingUp, CreditCard, MessageSquare, BarChart3,
  GraduationCap, Shield, Plug, Cpu, Heart,
  Building, BookOpen, ChevronRight, Sparkles,
  Clock, Users, DollarSign, Eye, Award,
  CheckCircle, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  academic_tools: <GraduationCap className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  finance_fees: <CreditCard className="h-5 w-5" />,
  analytics_bi: <BarChart3 className="h-5 w-5" />,
  content_packs: <BookOpen className="h-5 w-5" />,
  integrations: <Plug className="h-5 w-5" />,
  ai_automation: <Cpu className="h-5 w-5" />,
  accessibility: <Heart className="h-5 w-5" />,
  administration: <Building className="h-5 w-5" />,
  security_compliance: <Shield className="h-5 w-5" />,
};

const PRICING_LABELS: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  one_time: "One-Time",
  monthly: "Monthly",
  annual: "Annual",
  per_student: "Per Student",
  per_user: "Per User",
  free_trial: "Free Trial",
};

function formatPrice(priceCents: number | undefined, currency: string = "KES") {
  if (!priceCents) return "Free";
  return `${currency} ${(priceCents / 100).toLocaleString()}`;
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
      <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({reviews})</span>
    </div>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPricing, setSelectedPricing] = useState("all");
  const [sortBy, setSortBy] = useState<string>("relevance");

  // Queries
  const marketplaceHome = usePlatformQuery(
    api.platform.marketplace.getMarketplaceHome,
    { sessionToken: sessionToken || "" }
  ) as any;

  const browseResult = usePlatformQuery(
    api.platform.marketplace.browseModules,
    {
      sessionToken: sessionToken || "",
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      search: searchQuery || undefined,
      pricingModel: selectedPricing !== "all" ? selectedPricing : undefined,
      sortBy: sortBy as any,
      limit: 24,
    }
  ) as any;

  const overview = usePlatformQuery(
    api.platform.marketplace.getMarketplaceOverview,
    { sessionToken: sessionToken || "" }
  ) as any;

  // Modules to display
  const modules = browseResult?.modules || [];
  const stats = marketplaceHome?.stats || { totalModules: 0, totalInstalls: 0, averageRating: 0, totalPublishers: 0 };
  const categories = marketplaceHome?.categories || [];
  const newModules = marketplaceHome?.newAndNoteworthy || [];
  const topRated = marketplaceHome?.topRated || [];
  const trending = marketplaceHome?.trending || [];
  const recentActivity = marketplaceHome?.recentActivity || [];

  // ── Module Card ──────────────────────────────────────────────────────
  const ModuleCard = ({ mod }: { mod: any }) => (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group border-border/60 hover:border-primary/30"
      onClick={() => router.push(`/platform/marketplace/${mod.moduleId}`)}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {CATEGORY_ICONS[mod.category] || <Package className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                {mod.name}
              </h3>
              <p className="text-xs text-muted-foreground">{mod.publisherName}</p>
            </div>
          </div>
          {mod.isFeatured && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />Featured
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {mod.shortDescription}
        </p>

        <div className="flex items-center justify-between">
          <StarRating rating={mod.averageRating} reviews={mod.totalReviews} />
        </div>

        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />{mod.totalInstalls.toLocaleString()}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {PRICING_LABELS[mod.pricingModel] || mod.pricingModel}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-primary">
            {formatPrice(mod.priceCents, mod.currency)}
          </span>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-1.5">
          {mod.isVerified && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" />Verified
            </Badge>
          )}
          {mod.isSecurityReviewed && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-2.5 w-2.5 mr-0.5" />Secure
            </Badge>
          )}
          {mod.isGdprCompliant && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
              GDPR
            </Badge>
          )}
        </div>

        {/* Compatible plans */}
        {mod.compatiblePlans?.length > 0 && (
          <div className="flex items-center gap-1">
            {mod.compatiblePlans.slice(0, 3).map((plan: string) => (
              <Badge key={plan} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {plan}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Module Row (for lists) ───────────────────────────────────────────
  const ModuleRow = ({ mod }: { mod: any }) => (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => router.push(`/platform/marketplace/${mod.moduleId}`)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {CATEGORY_ICONS[mod.category] || <Package className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{mod.name}</h4>
            {mod.isVerified && <CheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{mod.publisherName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <StarRating rating={mod.averageRating} reviews={mod.totalReviews} />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Download className="h-3 w-3" />{mod.totalInstalls.toLocaleString()}
        </span>
        <span className="text-sm font-semibold w-24 text-right">
          {formatPrice(mod.priceCents, mod.currency)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );

  // ── Discover Tab ─────────────────────────────────────────────────────
  const DiscoverTab = () => (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <p className="text-xs text-muted-foreground">Available Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Download className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.totalInstalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Installs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.totalPublishers}</div>
            <p className="text-xs text-muted-foreground">Publishers</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tiles */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat: any) => (
            <Card
              key={cat.slug}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => {
                setSelectedCategory(cat.slug);
                setActiveTab("browse");
              }}
            >
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[cat.slug] || <Package className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.moduleCount} modules</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New & Noteworthy */}
      {newModules.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" /> New & Noteworthy
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setSortBy("newest"); setActiveTab("browse"); }}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newModules.slice(0, 4).map((mod: any) => (
              <ModuleCard key={mod.moduleId} mod={mod} />
            ))}
          </div>
        </div>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" /> Top Rated
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setSortBy("highest_rated"); setActiveTab("browse"); }}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topRated.slice(0, 4).map((mod: any) => (
              <ModuleCard key={mod.moduleId} mod={mod} />
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Trending This Week
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setSortBy("most_installed"); setActiveTab("browse"); }}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {trending.slice(0, 5).map((mod: any) => (
              <ModuleRow key={mod.moduleId} mod={mod} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Marketplace Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {activity.type === "install" && <Download className="h-4 w-4 text-blue-600 shrink-0" />}
                    {activity.type === "review" && <Star className="h-4 w-4 text-yellow-600 shrink-0" />}
                    {activity.type === "submission" && <Package className="h-4 w-4 text-purple-600 shrink-0" />}
                    {activity.type === "approval" && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                    {activity.type === "uninstall" && <RefreshCw className="h-4 w-4 text-red-600 shrink-0" />}
                    {activity.type === "purchase" && <DollarSign className="h-4 w-4 text-green-600 shrink-0" />}
                    {!["install", "review", "submission", "approval", "uninstall", "purchase"].includes(activity.type) && (
                      <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-medium capitalize">{activity.type.replace("_", " ")}</span>
                      {activity.moduleName && (
                        <span className="text-muted-foreground"> — {activity.moduleName}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {activity.tenantName && <span className="mr-2">{activity.tenantName}</span>}
                    {formatRelativeTime(activity.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalModules === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Marketplace is Ready</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              No modules have been published yet. Start by registering as a publisher
              and submitting your first module, or seed the categories to prepare the storefront.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/platform/marketplace/developer")}>
                Register as Publisher
              </Button>
              <Button variant="outline" onClick={() => router.push("/platform/marketplace/admin")}>
                Admin Controls
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Browse Tab ───────────────────────────────────────────────────────
  const BrowseTab = () => (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules by name, description, tag, or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPricing} onValueChange={setSelectedPricing}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Pricing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricing</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="freemium">Freemium</SelectItem>
            <SelectItem value="one_time">One-Time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="per_student">Per Student</SelectItem>
            <SelectItem value="free_trial">Free Trial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="most_installed">Most Installed</SelectItem>
            <SelectItem value="highest_rated">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="alphabetical">A - Z</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {browseResult?.total || 0} module{(browseResult?.total || 0) !== 1 ? "s" : ""} found
        </p>
        {selectedCategory !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("all")}>
            Clear category filter
          </Button>
        )}
      </div>

      {/* Module Grid */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((mod: any) => (
            <ModuleCard key={mod.moduleId} mod={mod} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No modules found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? `No modules match "${searchQuery}". Try a different search term or clear filters.`
                : "No modules are available in this category yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Admin Overview Tab ───────────────────────────────────────────────
  const AdminTab = () => {
    const ov = overview?.overview || {};
    return (
      <div className="space-y-6">
        {/* Admin KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Total Modules</p>
              <div className="text-xl font-bold">{ov.totalModules || 0}</div>
              <p className="text-xs text-muted-foreground">{ov.publishedModules || 0} published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Pending Review</p>
              <div className="text-xl font-bold text-orange-600">{ov.pendingReview || 0}</div>
              <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => router.push("/platform/marketplace/admin")}>
                Review now
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Publishers</p>
              <div className="text-xl font-bold">{ov.totalPublishers || 0}</div>
              <p className="text-xs text-muted-foreground">{ov.activePublishers || 0} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Revenue</p>
              <div className="text-xl font-bold">
                KES {((ov.totalRevenueCents || 0) / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                KES {((ov.totalCommissionCents || 0) / 100).toLocaleString()} commission
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Open Disputes</p>
              <div className={`text-xl font-bold ${(ov.openDisputes || 0) > 0 ? "text-red-600" : ""}`}>
                {ov.openDisputes || 0}
              </div>
              <p className="text-xs text-muted-foreground">{ov.pendingReviews || 0} pending reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories + Top Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(overview?.categories || []).map((cat: any) => (
                <div key={cat.slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[cat.slug] || <Package className="h-4 w-4" />}
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{cat.moduleCount} modules</span>
                    <span>{cat.installCount} installs</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(overview?.topModules || []).map((mod: any) => (
                <div
                  key={mod.moduleId}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-1 rounded"
                  onClick={() => router.push(`/platform/marketplace/${mod.moduleId}`)}
                >
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[mod.category] || <Package className="h-4 w-4" />}
                    <div>
                      <p className="text-sm font-medium">{mod.name}</p>
                      <p className="text-xs text-muted-foreground">{mod.publisherName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{mod.totalInstalls} installs</p>
                    <StarRating rating={mod.averageRating} reviews={mod.totalReviews} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push("/platform/marketplace/admin")}>
            <Shield className="h-5 w-5" />
            <span className="text-xs">Admin Panel</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push("/platform/marketplace/developer")}>
            <Cpu className="h-5 w-5" />
            <span className="text-xs">Developer Portal</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push("/platform/marketplace/reviews")}>
            <Star className="h-5 w-5" />
            <span className="text-xs">Moderate Reviews</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push("/platform/marketplace/admin")}>
            <Eye className="h-5 w-5" />
            <span className="text-xs">View All Installs</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Marketplace"
        description="Discover, install, and manage modules to extend your EduMyles platform"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="admin">Admin Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4">
          <DiscoverTab />
        </TabsContent>
        <TabsContent value="browse" className="mt-4">
          <BrowseTab />
        </TabsContent>
        <TabsContent value="admin" className="mt-4">
          <AdminTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
