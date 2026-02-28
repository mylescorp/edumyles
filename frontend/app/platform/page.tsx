"use client";

import { useState } from "react";
import { DashboardLayout } from "../components/layout/dashboard-layout";

interface Tenant {
  tenantId: string;
  name: string;
  subdomain: string;
  email: string;
  plan: string;
  status: string;
  county: string;
}

const stats = [
  { label: "Total Schools", value: 0 },
  { label: "Active", value: 0 },
  { label: "Trial", value: 0 },
  { label: "Suspended", value: 0 },
];

export default function PlatformPage() {
  const [tenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", subdomain: "", email: "", phone: "", plan: "starter", county: "",
  });

  return (
    <DashboardLayout
      title="Platform Control"
      subtitle="Master Admin — All actions are audit logged"
      role="master_admin"
      schoolName="EduMyles HQ"
    >
      {/* Warning */}
      <div className="bg-crimson-50 border border-crimson-200 text-crimson-700 text-sm px-4 py-3 rounded-lg mb-6 font-medium">
        You are in Master Admin mode. Every action is permanently logged.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-cream-400 rounded-2xl p-5 shadow-sm">
            <p className="text-charcoal-300 text-xs uppercase tracking-wide font-semibold">{s.label}</p>
            <p className="text-3xl font-bold text-charcoal mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-400 flex items-center justify-between">
          <h2 className="text-charcoal font-semibold">All Schools</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-crimson-500 hover:bg-crimson-600 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + Onboard School
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-charcoal-300 text-xs uppercase border-b border-cream-400 bg-cream">
              <th className="px-6 py-3 text-left font-semibold">School</th>
              <th className="px-6 py-3 text-left font-semibold">Tenant ID</th>
              <th className="px-6 py-3 text-left font-semibold">Subdomain</th>
              <th className="px-6 py-3 text-left font-semibold">Plan</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">County</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-charcoal-300">
                  No schools onboarded yet. Click &quot;+ Onboard School&quot; to add the first one.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.tenantId} className="border-b border-cream-400 hover:bg-cream">
                  <td className="px-6 py-4 text-charcoal font-medium">{t.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-charcoal-300">{t.tenantId}</td>
                  <td className="px-6 py-4 text-zoho-blue">{t.subdomain}.edumyles.com</td>
                  <td className="px-6 py-4 text-charcoal-400 capitalize">{t.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.status === "active" ? "bg-forest-50 text-forest-600" :
                      t.status === "trial" ? "bg-amber-50 text-amber-700" :
                      "bg-crimson-50 text-crimson-600"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-4 text-charcoal-300">{t.county}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <button className="text-zoho-blue hover:text-forest-500 text-xs font-medium transition-colors">Impersonate</button>
                    <button className="text-crimson-500 hover:text-crimson-700 text-xs font-medium transition-colors">Suspend</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white border border-cream-400 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-charcoal font-semibold text-lg mb-4">Onboard New School</h3>
            <div className="space-y-3">
              {[
                { key: "name", placeholder: "School Name" },
                { key: "subdomain", placeholder: "Subdomain (e.g. greenfield)" },
                { key: "email", placeholder: "Admin Email" },
                { key: "phone", placeholder: "Phone (+254...)" },
                { key: "county", placeholder: "County" },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-cream border border-cream-400 rounded-lg px-3 py-2.5 text-sm text-charcoal placeholder-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-shadow"
                />
              ))}
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full bg-cream border border-cream-400 rounded-lg px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-cream-300 hover:bg-cream-400 text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-crimson-500 hover:bg-crimson-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Create School
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
