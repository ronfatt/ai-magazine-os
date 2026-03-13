import { ActivityList } from "@/components/dashboard/activity-list";
import { ModuleGrid } from "@/components/dashboard/module-grid";
import { OnboardingPanel } from "@/components/dashboard/onboarding-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageIntro } from "@/components/shared/page-intro";
import { getDashboardSnapshot } from "@/lib/data/dashboard";
import { modulePlaceholders } from "@/lib/data/mock-dashboard";
import { getOnboardingState } from "@/lib/data/onboarding";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  const onboarding = await getOnboardingState();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Structured publishing foundation"
        description={`This first pass wires the application shell, route map, Supabase setup, and placeholder modules so we can layer in real workflows without rebuilding the architecture. Data source: ${snapshot.mode === "live" ? "live Supabase counts" : "safe mock fallback until env keys are configured"}.`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <StatCard key={metric.label} metric={metric} />
        ))}
      </section>

      <OnboardingPanel
        hasWorkspace={onboarding.hasWorkspace}
        latestIssueId={onboarding.latestIssueId}
        latestIssueTitle={onboarding.latestIssueTitle}
        latestProjectName={onboarding.latestProjectName}
        mode={onboarding.mode}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <ModuleGrid items={modulePlaceholders} />
        <ActivityList items={snapshot.uploads} title="Seed cards for uploaded source material" />
      </div>
    </div>
  );
}
