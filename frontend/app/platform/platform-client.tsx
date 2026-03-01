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

export function PlatformClient() {
  const [tenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    plan: "starter",
    county: "",
  });

  return (
    <DashboardLayout
      title="Platform Control"
      subtitle="Master Admin — All actions are audit logged"
      role="master_admin"
      schoolName="EduMyles HQ"
    >
      <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
        ⚠️ You are in Master Admin mode. Every action is permanently logged.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">All Schools</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Onboard School
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
              <th className="px-6 py-3 text-left">School</th>
              <th className="px-6 py-3 text-left">Tenant ID</th>
              <th className="px-6 py-3 text-left">Subdomain</th>
              <th className="px-6 py-3 text-left">Plan</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">County</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                  No schools onboarded yet. Click &quot;+ Onboard School&quot; to add the first one.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.tenantId} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="px-6 py-4 text-white font-medium">{t.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{t.tenantId}</td>
                  <td className="px-6 py-4 text-blue-400">{t.subdomain}.edumyles.com</td>
                  <td className="px-6 py-4 text-gray-300 capitalize">{t.plan}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === "active"
                          ? "bg-green-900 text-green-300"
                          : t.status === "trial"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{t.county}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <button className="text-blue-400 hover:text-blue-300 text-xs">Impersonate</button>
                    <button className="text-red-400 hover:text-red-300 text-xs">Suspend</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-4">Onboard New School</h3>
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                />
              ))}
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
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
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
