"use client";

import { ShoppingCart } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function OrdersPage() {
  return (
    <AdminFeatureUnavailable
      title="Orders"
      description="Review ecommerce orders and fulfillment activity"
      icon={ShoppingCart}
      sectionHref="/admin/ecommerce"
      sectionLabel="Ecommerce"
    />
  );
}
