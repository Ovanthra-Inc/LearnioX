import { LearnerSidebar } from "@/components/layout/learner-sidebar";
import { TopAppBar } from "@/components/layout/top-app-bar";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-layout">
      <LearnerSidebar />
      <div className="sidebar-content">
        <TopAppBar />
        <main className="flex-1 p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
