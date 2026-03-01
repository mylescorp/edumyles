"use client";

import { useState, useMemo } from "react";
import { ModuleCard } from "./ModuleCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModuleData {
  moduleId: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  status: string;
  availableForTier: boolean;
}

interface ModuleGridProps {
  modules: ModuleData[];
  installedModuleIds: string[];
  onInstall: (moduleId: string) => void;
  onUninstall: (moduleId: string) => void;
}

export function ModuleGrid({
  modules,
  installedModuleIds,
  onInstall,
  onUninstall,
}: ModuleGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set(modules.map((m) => m.category));
    return ["all", ...Array.from(cats)];
  }, [modules]);

  const filtered = useMemo(() => {
    let result = modules;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(lower) ||
          m.description.toLowerCase().includes(lower) ||
          m.moduleId.toLowerCase().includes(lower)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    return result;
  }, [modules, search, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search modules..."
          className="max-w-sm"
        />
        <Tabs
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          className="w-auto"
        >
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => (
          <ModuleCard
            key={mod.moduleId}
            moduleId={mod.moduleId}
            name={mod.name}
            description={mod.description}
            tier={mod.tier}
            category={mod.category}
            status={mod.status}
            isInstalled={installedModuleIds.includes(mod.moduleId)}
            availableForTier={mod.availableForTier}
            onInstall={() => onInstall(mod.moduleId)}
            onUninstall={() => onUninstall(mod.moduleId)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No modules match your search.
        </div>
      )}
    </div>
  );
}
