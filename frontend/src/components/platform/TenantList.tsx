"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Building2,
  Mail,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  PauseCircle,
  FlaskConical,
  X,
  Plus,
  Eye,
  Edit2,
  Ban,
  PlayCircle,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/formatters";
import { buildCsv } from "@/lib/csv";
import { formatTenantHostname } from "@/lib/domains";
import Link from "next/link";
import { TenantDialog } from "@/app/platform/tenants/TenantDialog";
import { SuspendDialog } from "@/app/platform/tenants/SuspendDialog";

interface Tenant {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  county: string;
  country: string;
  createdAt: number;
  modules?: string[];
  userCount?: number;
  lastActive?: number;
}

interface TenantListProps {
  tenants: Tenant[];
  isLoading?: boolean;
  className?: string;
  sessionToken?: string | null;
}

// Filter options
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

const PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const COUNTY_OPTIONS = [
  { value: "all", label: "All Counties" },
  { value: "nairobi", label: "Nairobi" },
  { value: "mombasa", label: "Mombasa" },
  { value: "kisumu", label: "Kisumu" },
  { value: "nakuru", label: "Nakuru" },
  { value: "kiambu", label: "Kiambu" },
  { value: "machakos", label: "Machakos" },
  { value: "kajiado", label: "Kajiado" },
];

const SCHOOL_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "primary", label: "Primary School" },
  { value: "secondary", label: "Secondary School" },
  { value: "mixed", label: "Mixed Day & Boarding" },
  { value: "international", label: "International School" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "created-desc", label: "Created (Newest)" },
  { value: "created-asc", label: "Created (Oldest)" },
  { value: "status-asc", label: "Status (Active first)" },
  { value: "status-desc", label: "Status (Suspended first)" },
];

export function TenantList({ tenants, isLoading = false, className = "", sessionToken }: TenantListProps) {
  const router = useRouter();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [schoolTypeFilter, setSchoolTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [tenantDialogMode, setTenantDialogMode] = useState<"create" | "edit">("create");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);

  const openCreateDialog = () => {
    setSelectedTenant(null);
    setTenantDialogMode("create");
    setTenantDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantDialogMode("edit");
    setTenantDialogOpen(true);
  };

  const openSuspendDialog = (tenant: Tenant) => {
    setSuspendTarget(tenant);
    setSuspendDialogOpen(true);
  };

  // Filter and sort tenants
  const filteredAndSortedTenants = useMemo(() => {
    const filtered = tenants.filter(tenant => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.county.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

      // Plan filter
      const matchesPlan = planFilter === "all" || tenant.plan === planFilter;

      // County filter
      const matchesCounty = countyFilter === "all" || tenant.county === countyFilter;

      // School type filter (placeholder - would need to be added to tenant schema)
      const matchesSchoolType =
        schoolTypeFilter === "all" ||
        ((tenant as Tenant & { schoolType?: string }).schoolType === schoolTypeFilter);

      return matchesSearch && matchesStatus && matchesPlan && matchesCounty && matchesSchoolType;
    });

    // Sort tenants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-desc":
          return b.createdAt - a.createdAt;
        case "created-asc":
          return a.createdAt - b.createdAt;
        case "status-asc":
          return a.status.localeCompare(b.status);
        case "status-desc":
          return b.status.localeCompare(a.status);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [tenants, searchTerm, statusFilter, planFilter, countyFilter, schoolTypeFilter, sortBy]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Subdomain",
      "Plan",
      "Status",
      "County",
      "Country",
      "Created Date",
      "User Count",
      "Modules"
    ];

    const csvData = filteredAndSortedTenants.map(tenant => [
      tenant.name,
      tenant.email,
      tenant.subdomain,
      tenant.plan,
      tenant.status,
      tenant.county,
      tenant.country,
      formatDate(new Date(tenant.createdAt)),
      tenant.userCount || "N/A",
      (tenant.modules || []).join("; ")
    ]);

    const csvContent = buildCsv([headers, ...csvData]);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tenants_export_${formatDate(new Date())}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPlanFilter("all");
    setCountyFilter("all");
    setSchoolTypeFilter("all");
    setSortBy("created-desc");
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (planFilter !== "all") count++;
    if (countyFilter !== "all") count++;
    if (schoolTypeFilter !== "all") count++;
    if (searchTerm !== "") count++;
    return count;
  }, [statusFilter, planFilter, countyFilter, schoolTypeFilter, searchTerm]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Bar */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants by name, email, subdomain, or county..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            {/* Add Tenant */}
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </Badge>
              )}
              {planFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Plan: {planFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPlanFilter("all")} />
                </Badge>
              )}
              {countyFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  County: {countyFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCountyFilter("all")} />
                </Badge>
              )}
              {schoolTypeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Type: {schoolTypeFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSchoolTypeFilter("all")} />
                </Badge>
              )}
              {searchTerm !== "" && (
                <Badge variant="secondary" className="gap-1">
                  Search: &quot;{searchTerm}&quot;
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plan</label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">County</label>
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">School Type</label>
                <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedTenants.length} of {tenants.length} tenants
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Tenant List */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading tenants...</p>
            </div>
          ) : filteredAndSortedTenants.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {activeFilterCount > 0 
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first tenant"
                }
              </p>
              {activeFilterCount === 0 && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredAndSortedTenants.map((tenant) => (
                <div key={tenant._id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium truncate">{tenant.name}</h3>
                        <StatusBadge status={tenant.status} />
                        <PlanBadge plan={tenant.plan} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{tenant.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{formatTenantHostname(tenant.subdomain)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{tenant.county}, {tenant.country}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(new Date(tenant.createdAt))}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{tenant.userCount || 0} users</span>
                        </div>
                      </div>

                      {/* Modules */}
                      {tenant.modules && tenant.modules.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-muted-foreground">Modules:</span>
                          <div className="flex flex-wrap gap-1">
                            {tenant.modules.slice(0, 3).map((module) => (
                              <Badge key={module} variant="secondary" className="text-xs">
                                {module}
                              </Badge>
                            ))}
                            {tenant.modules.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tenant.modules.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/platform/tenants/${tenant.tenantId}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.status === "suspended" ? (
                            <DropdownMenuItem
                              onClick={() => openSuspendDialog(tenant)}
                              className="text-em-success focus:text-em-success"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => openSuspendDialog(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Tenant Dialog */}
      <TenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        sessionToken={sessionToken ?? ""}
        tenant={selectedTenant}
        mode={tenantDialogMode}
      />

      {/* Suspend / Activate Dialog */}
      <SuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        sessionToken={sessionToken ?? ""}
        tenant={suspendTarget}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colorClass = status === "active"
    ? "bg-em-success-bg/10 text-em-success border-em-success/20"
    : status === "trial"
      ? "bg-em-info-bg/10 text-em-info border-em-info/20"
      : status === "archived"
        ? "bg-slate-500/10 text-slate-700 border-slate-200"
        : "bg-em-danger-bg/10 text-em-danger border-em-danger/20";

  return (
    <Badge variant="outline" className={colorClass}>
      {status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "trial" && <FlaskConical className="h-3 w-3 mr-1" />}
      {status === "suspended" && <PauseCircle className="h-3 w-3 mr-1" />}
      {status === "archived" && <Ban className="h-3 w-3 mr-1" />}
      {status}
    </Badge>
  );
}

// Plan Badge Component
function PlanBadge({ plan }: { plan: string }) {
  const colorClass = plan === "enterprise"
    ? "bg-purple-500/10 text-purple-700 border-purple-200"
    : plan === "pro"
      ? "bg-em-accent-bg/10 text-em-accent-dark border-em-accent/20"
      : plan === "growth"
        ? "bg-em-info-bg/10 text-em-info border-em-info/20"
        : "bg-em-success-bg/10 text-em-success border-em-success/20";

  return (
    <Badge variant="outline" className={colorClass}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}
