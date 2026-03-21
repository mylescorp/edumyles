"use client";

import { ArrowUpRight } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function TransactionsPage() {
  return (
    <AdminFeatureUnavailable
      title="Wallet Transactions"
      description="Track credits, debits, transfers, and payment activity"
      icon={ArrowUpRight}
      sectionHref="/admin/ewallet"
      sectionLabel="E-Wallet"
    />
  );
}
