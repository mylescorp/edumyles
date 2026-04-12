"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search, ShoppingCart, Store, Wallet } from "lucide-react";

type ResellerProduct = {
  _id: string;
  schoolId: string;
  schoolName: string;
  schoolStatus: string;
  name: string;
  description?: string;
  priceCents: number;
  stock: number;
  category?: string;
  status: string;
  quantitySold: number;
  revenueCents: number;
  inventoryValueCents: number;
};

function formatMoneyFromCents(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

function badgeVariant(status: string) {
  if (["active", "converted"].includes(status)) return "default";
  if (["draft", "trial", "contacted"].includes(status)) return "secondary";
  return "outline";
}

export default function ResellerProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const products = useQuery((api as any)["modules/reseller/queries/products"].getProducts, {}) as
    | ResellerProduct[]
    | undefined;

  const allProducts = products ?? [];
  const filteredProducts = useMemo(
    () =>
      allProducts.filter((product) => {
        const matchesSearch = [
          product.name,
          product.description ?? "",
          product.schoolName,
          product.category ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory = category === "all" || (product.category ?? "uncategorized") === category;
        const matchesStatus = status === "all" || product.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [allProducts, search, category, status]
  );

  const stats = useMemo(
    () => ({
      total: allProducts.length,
      active: allProducts.filter((product) => product.status === "active").length,
      inventoryValueCents: allProducts.reduce((sum, product) => sum + product.inventoryValueCents, 0),
      revenueCents: allProducts.reduce((sum, product) => sum + product.revenueCents, 0),
    }),
    [allProducts]
  );

  const categories = Array.from(
    new Set(allProducts.map((product) => product.category ?? "uncategorized"))
  ).sort();
  const statuses = Array.from(new Set(allProducts.map((product) => product.status))).sort();

  if (!products) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Live product catalog aggregated from the schools assigned to your reseller account."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Store className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-2xl font-semibold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-semibold">{formatMoneyFromCents(stats.inventoryValueCents)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-semibold">{formatMoneyFromCents(stats.revenueCents)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Products</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product, description, or school..."
            className="max-w-xl"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {statuses.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="There are no live reseller-linked products matching the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">School</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Price</th>
                    <th className="py-3 pr-4 font-medium">Stock</th>
                    <th className="py-3 pr-4 font-medium">Sold</th>
                    <th className="py-3 pr-4 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.description ?? "No description"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{product.schoolName}</p>
                          <Badge variant={badgeVariant(product.schoolStatus)}>
                            {product.schoolStatus.replaceAll("_", " ")}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 pr-4">{product.category ?? "uncategorized"}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={badgeVariant(product.status)}>
                          {product.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">{formatMoneyFromCents(product.priceCents)}</td>
                      <td className="py-4 pr-4">{product.stock}</td>
                      <td className="py-4 pr-4">{product.quantitySold}</td>
                      <td className="py-4 pr-4">{formatMoneyFromCents(product.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
