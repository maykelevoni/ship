import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingDone) redirect("/");

  return <OnboardingWizard />;
}
