import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { EngineSidebar } from "@/components/dashboard/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a" }}>
      <EngineSidebar />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "32px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
