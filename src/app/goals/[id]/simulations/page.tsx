import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoalContributionSummary } from "@/app/actions/contributions";
import { getGoal } from "@/app/actions/goals";
import { GoalSimulationPanel } from "@/components/goals/GoalSimulationPanel";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type GoalSimulationsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GoalSimulationsPage({
  params,
}: GoalSimulationsPageProps) {
  const { id } = await params;

  const [goal, summary] = await Promise.all([
    getGoal(id),
    getGoalContributionSummary(id),
  ]);

  if (!goal || !summary) {
    notFound();
  }

  const currentAmountWithContributions = goal.currentAmount + summary.totalContributed;
  const monthsRemaining = calculateMonthsRemaining(new Date(), goal.targetDate);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/goals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to goals
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Simulation workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore timeline-driven return scenarios for &ldquo;{goal.name}&rdquo;.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/goals/${goal.id}/contributions`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Contributions
          </Link>
          <Link
            href={`/goals/${goal.id}/edit`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            Edit Goal
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Target amount" value={formatCurrency(goal.targetAmount)} />
        <StatCard
          label="Current tracked amount"
          value={formatCurrency(currentAmountWithContributions)}
        />
        <StatCard
          label="Monthly contribution"
          value={formatCurrency(goal.monthlyContribution)}
        />
        <StatCard label="Goal return" value={formatPercent(goal.expectedReturn)} />
        <StatCard label="Target date" value={formatDate(goal.targetDate)} />
        <StatCard label="Months to target" value={`${monthsRemaining}`} />
      </section>

      <GoalSimulationPanel
        currentAmount={currentAmountWithContributions}
        monthlyContribution={goal.monthlyContribution}
        targetAmount={goal.targetAmount}
        initialMonths={monthsRemaining === 0 ? 12 : monthsRemaining}
      />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm shadow-slate-900/5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function calculateMonthsRemaining(currentDate: Date, targetDate: Date): number {
  if (targetDate <= currentDate) {
    return 0;
  }

  const yearDelta = targetDate.getFullYear() - currentDate.getFullYear();
  const monthDelta = targetDate.getMonth() - currentDate.getMonth();
  let months = yearDelta * 12 + monthDelta;

  if (targetDate.getDate() < currentDate.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}
