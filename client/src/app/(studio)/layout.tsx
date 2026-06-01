import { StudioSidebar } from "@/components/layout/studio-sidebar";
import { TopAppBar } from "@/components/layout/top-app-bar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-layout">
      <StudioSidebar />
      <div className="sidebar-content">
        <TopAppBar />
        <main className="flex-1 p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
