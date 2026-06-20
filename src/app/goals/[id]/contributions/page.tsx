import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGoalContributionSummary,
  getGoalContributions,
} from "@/app/actions/contributions";
import { getGoal } from "@/app/actions/goals";
import { ContributionForm } from "@/components/contributions/ContributionForm";
import { ContributionHistoryTable } from "@/components/contributions/ContributionHistoryTable";
import { ScenarioSimulation } from "@/components/contributions/ScenarioSimulation";
import { ContributionSummary } from "@/components/contributions/ContributionSummary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GoalContributionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GoalContributionsPage({
  params,
}: GoalContributionsPageProps) {
  const { id } = await params;
  const [goal, contributions, summary] = await Promise.all([
    getGoal(id),
    getGoalContributions(id),
    getGoalContributionSummary(id),
  ]);

  if (!goal || !summary) {
    notFound();
  }

  const currentAmountWithContributions = goal.currentAmount + summary.totalContributed;
  const monthsRemaining = calculateMonthsRemaining(new Date(), goal.targetDate);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/goals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to goals
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Contributions
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage deposits for &ldquo;{goal.name}&rdquo;
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Contribution</CardTitle>
          <CardDescription>
            Record a new deposit linked to this goal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionForm
            mode="create"
            goalOptions={[{ id: goal.id, name: goal.name }]}
            defaultGoalId={goal.id}
          />
        </CardContent>
      </Card>

      <ContributionSummary
        targetAmount={summary.targetAmount}
        totalContributed={summary.totalContributed}
        remainingAmount={summary.remainingAmount}
        progressPercentage={summary.progressPercentage}
      />

      <ScenarioSimulation
        currentAmount={currentAmountWithContributions}
        monthlyContribution={goal.monthlyContribution}
        targetAmount={goal.targetAmount}
        monthsRemaining={monthsRemaining}
      />

      <ContributionHistoryTable contributions={contributions} />
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
