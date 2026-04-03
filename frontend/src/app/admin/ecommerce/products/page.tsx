"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, Package, AlertTriangle, ShoppingBag, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

type Product = {
  _id: string;
  name: string;
  priceCents: number;
  stock: number;
  category?: string;
  status: string;
  description?: string;
  lowStock?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  active:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  out_of_stock:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  draft:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function EcommerceProductsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const products = useQuery(
    api.modules.ecommerce.queries.listProducts,
    sessionToken
      ? {
          sessionToken,
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        }
      : "skip"
  );

  const productList = (products ?? []) as Product[];

  const categories = useMemo(() => {
    return [...new Set(productList.map((p) => p.category).filter(Boolean))].sort() as string[];
  }, [productList]);

  const stats = useMemo(() => ({
    total:      productList.length,
    active:     productList.filter((p) => p.status === "active").length,
    lowStock:   productList.filter((p) => p.stock <= 5 || p.lowStock).length,
    outOfStock: productList.filter((p) => p.stock === 0 || p.status === "out_of_stock").length,
  }), [productList]);

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category ? (
        <Badge variant="outline">{row.category}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    },
    {
      key: "priceCents",
      header: "Price",
      sortable: true,
      cell: (row) => formatCurrency(row.priceCents / 100, "KES"),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {(row.stock <= 5 || row.lowStock) && row.stock > 0 && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className={row.stock === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            {row.stock}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge className={`${STATUS_COLORS[row.status] ?? STATUS_COLORS.draft} border-0 capitalize`}>
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
  ];

  if (isLoading || products === undefined) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your school store product catalogue"
        actions={
          <Link href="/admin/ecommerce/products/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: "eCommerce", href: "/admin/ecommerce" },
          { label: "Products" },
        ]}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <ShoppingBag className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={productList}
        columns={columns}
        searchable
        searchPlaceholder="Search products…"
        searchKey={(row) => `${row.name} ${row.category ?? ""} ${row.description ?? ""}`}
        emptyMessage="No products found. Add your first product to get started."
      />
    </div>
  );
}
