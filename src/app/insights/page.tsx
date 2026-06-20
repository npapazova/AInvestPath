import { getGoals } from "@/app/actions/goals";
import { GoalsVisualizations } from "@/components/goals/GoalsVisualizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { enrichGoalsWithMetrics } from "@/lib/goals";

export default async function InsightsPage() {
  const goals = await getGoals();
  const enrichedGoals = enrichGoalsWithMetrics(goals);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Portfolio insights
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Insights
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Track overall progress, allocation, and projections across all active goals.
          </p>
        </div>
      </section>

      {enrichedGoals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No insights available yet</CardTitle>
            <CardDescription>
              Create at least one goal to unlock progress and projection analytics.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <GoalsVisualizations goals={enrichedGoals} />
      )}
    </div>
  );
}