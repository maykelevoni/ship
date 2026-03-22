import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/header";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata = constructMetadata({
  title: "Settings – PostForge",
  description: "Configure API keys, schedule, and platform settings.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  const rows = await db.setting.findMany();
  const settings = Object.fromEntries(rows.map((s) => [s.key, s.value]));

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Configure API keys, schedule, gate mode, and enabled platforms."
      />
      <div className="mt-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </>
  );
}
