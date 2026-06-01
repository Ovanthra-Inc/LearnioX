import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { TopAppBar } from "@/components/layout/top-app-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-layout">
      <AdminSidebar />
      <div className="sidebar-content">
        <TopAppBar />
        <main className="flex-1 p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
