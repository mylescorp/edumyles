"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Plus, Package, AlertTriangle, ShoppingBag, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { createProductSchema } from "@shared/validators";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "0",
    stock: "0",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);

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
  const updateProduct = useMutation(api.modules.ecommerce.mutations.updateProduct);
  const deleteProduct = useMutation(api.modules.ecommerce.mutations.deleteProduct);

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
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedProduct(row);
            setEditForm({
              name: row.name,
              description: row.description ?? "",
              category: row.category ?? "",
              price: (row.priceCents / 100).toFixed(2),
              stock: String(row.stock),
              status: row.status,
            });
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    const parsed = createProductSchema.safeParse({
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      category: editForm.category.trim() || undefined,
      priceCents: Math.round(Number(editForm.price) * 100),
      stock: Number(editForm.stock),
    });

    if (!parsed.success) {
      toast({
        title: "Invalid product details",
        description: parsed.error.issues[0]?.message ?? "Please review the form and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct({
        productId: selectedProduct._id as any,
        ...parsed.data,
        status: editForm.status,
      });
      toast({
        title: "Product updated",
        description: "Catalog changes have been saved.",
      });
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Unable to update product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      await deleteProduct({ productId: selectedProduct._id as any });
      toast({
        title: "Product deleted",
        description: "The product has been removed from the catalog.",
      });
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Unable to delete product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name ?? "Manage Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name-edit">Product Name</Label>
              <Input
                id="product-name-edit"
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description-edit">Description</Label>
              <Textarea
                id="product-description-edit"
                value={editForm.description}
                onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-category-edit">Category</Label>
                <Input
                  id="product-category-edit"
                  value={editForm.category}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price-edit">Price (KES)</Label>
                <Input
                  id="product-price-edit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-stock-edit">Stock</Label>
                <Input
                  id="product-stock-edit"
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, stock: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-status-edit">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger id="product-status-edit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isSaving}>
                Delete Product
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveProduct} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
