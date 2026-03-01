"use client";

/** Zoho One department-style pill tab navigation */

interface Tab {
  key: string;
  label: string;
}

interface PillTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function PillTabs({ tabs, activeTab, onTabChange }: PillTabsProps) {
  return (
    <div className="pill-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
          className={activeTab === tab.key ? "pill-tab-active" : "pill-tab"}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
