"use client";

import { Wallet } from "lucide-react";
import { AdminFeatureUnavailable } from "@/components/admin/AdminFeatureUnavailable";

export default function WalletsPage() {
  return (
    <AdminFeatureUnavailable
      title="Wallets"
      description="Review wallet balances, statuses, and user accounts"
      icon={Wallet}
      sectionHref="/admin/ewallet"
      sectionLabel="E-Wallet"
    />
  );
}
