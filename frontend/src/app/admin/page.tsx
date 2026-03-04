"use client";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Students</h2>
          <p className="text-3xl font-bold">0</p>
          <p className="text-muted-foreground">Total Students</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Staff</h2>
          <p className="text-3xl font-bold">0</p>
          <p className="text-muted-foreground">Total Staff</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Applications</h2>
          <p className="text-3xl font-bold">0</p>
          <p className="text-muted-foreground">Pending Applications</p>
        </div>
      </div>
    </div>
  );
}
