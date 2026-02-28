import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  role?: string;
  schoolName?: string;
  isImpersonating?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  role = "school_admin",
  schoolName = "EduMyles",
  isImpersonating = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar role={role} schoolName={schoolName} />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} isImpersonating={isImpersonating} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
