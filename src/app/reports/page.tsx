import Link from "next/link";
import { getAllContributions } from "@/app/actions/contributions";
import { getGoals } from "@/app/actions/goals";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateCompleteMonthsBetween } from "@/domain/financial-engine/compound-projection";
import { compareScenarios } from "@/domain/financial-engine/scenarios";
import { formatCurrency, formatDate } from "@/lib/format";
import { enrichGoalsWithMetrics } from "@/lib/goals";
import { cn } from "@/lib/utils";

type ComputedGoalStatus = "COMPLETED" | "ON_TRACK" | "AT_RISK";

type GoalReportRow = {
  id: string;
  name: string;
  targetDate: Date;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  progressPercentage: number;
  projectedValueAtTargetDate: number;
  projectedCompletionDate: Date | null;
  status: ComputedGoalStatus;
};

const statusVariant: Record<ComputedGoalStatus, "default" | "secondary" | "outline"> = {
  COMPLETED: "default",
  ON_TRACK: "secondary",
  AT_RISK: "outline",
};

const scenarioClassName: Record<string, string> = {
  Conservative: "text-sky-700",
  Moderate: "text-emerald-700",
  Aggressive: "text-amber-700",
};

export default async function ReportsPage() {
  const [goals, contributions] = await Promise.all([
    getGoals({ status: "all" }),
    getAllContributions(),
  ]);

  const enrichedGoals = enrichGoalsWithMetrics(goals);

  const goalRows: GoalReportRow[] = enrichedGoals.map((goal) => {
    const status: ComputedGoalStatus =
      goal.currentAmount >= goal.targetAmount
        ? "COMPLETED"
        : goal.projectedValueAtTargetDate >= goal.targetAmount
          ? "ON_TRACK"
          : "AT_RISK";

    return {
      id: goal.id,
      name: goal.name,
      targetDate: goal.targetDate,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      monthlyContribution: goal.monthlyContribution,
      progressPercentage: goal.progressPercentage,
      projectedValueAtTargetDate: goal.projectedValueAtTargetDate,
      projectedCompletionDate: goal.projectedCompletionDate,
      status,
    };
  });

  const totalCurrent = goalRows.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goalRows.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProjected = goalRows.reduce((sum, goal) => sum + goal.projectedValueAtTargetDate, 0);

  const completedCount = goalRows.filter((goal) => goal.status === "COMPLETED").length;
  const onTrackCount = goalRows.filter((goal) => goal.status === "ON_TRACK").length;
  const atRiskCount = goalRows.filter((goal) => goal.status === "AT_RISK").length;

  const completionRate = goalRows.length > 0 ? (completedCount / goalRows.length) * 100 : 0;
  const forecastHitRate =
    goalRows.length > 0 ? ((completedCount + onTrackCount) / goalRows.length) * 100 : 0;
  const averageProgress =
    goalRows.length > 0
      ? goalRows.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goalRows.length
      : 0;
  const portfolioCompletion = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const scenarioTotals = goalRows.reduce<
    Record<string, { futureValue: number; totalGains: number }>
  >((accumulator, goal) => {
    const monthsToTarget = getMonthsToTarget(goal.targetDate, new Date());
    const outcomes = compareScenarios(
      goal.currentAmount,
      goal.monthlyContribution,
      monthsToTarget,
    );

    outcomes.forEach((outcome) => {
      const current = accumulator[outcome.scenarioName] ?? {
        futureValue: 0,
        totalGains: 0,
      };

      accumulator[outcome.scenarioName] = {
        futureValue: current.futureValue + outcome.futureValue,
        totalGains: current.totalGains + outcome.totalGains,
      };
    });

    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
              Reporting center
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Portfolio Reporting View
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Review goals, contribution history, performance, and forecast readiness in one place.
            </p>
          </div>
          <Link
            href="/reports/export"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Goals"
          value={String(goalRows.length)}
          description="Total investment goals in the workspace."
        />
        <StatCard
          title="Contributions"
          value={String(contributions.length)}
          description="Deposits recorded across all goals."
        />
        <StatCard
          title="Current vs Target"
          value={`${formatRatioPercent(portfolioCompletion)}%`}
          description={`${formatCurrency(totalCurrent)} of ${formatCurrency(totalTarget)}`}
        />
        <StatCard
          title="Forecast Hit Rate"
          value={`${formatRatioPercent(forecastHitRate)}%`}
          description="Goals that are completed or currently on track."
        />
        <StatCard
          title="Projected Value"
          value={formatCurrency(totalProjected)}
          description="Projected amount at each goal target date."
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>All investment goals</CardTitle>
            <CardDescription>
              Full goal list with current funding, targets, and computed readiness status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goalRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No goals yet. Add a goal to generate reporting rows.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      <TableHead>Target Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalRows.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.name}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[goal.status]}>{goal.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(goal.currentAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(goal.targetAmount)}</TableCell>
                        <TableCell className="text-right">
                          {formatRatioPercent(goal.progressPercentage)}%
                        </TableCell>
                        <TableCell>{formatDate(goal.targetDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Contribution history</CardTitle>
            <CardDescription>Every contribution sorted by most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contributions recorded yet.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Open Goal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((contribution) => (
                      <TableRow key={contribution.id}>
                        <TableCell className="font-medium">{contribution.goal.name}</TableCell>
                        <TableCell>{formatDate(contribution.contributionDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contribution.amount)}
                        </TableCell>
                        <TableCell className="max-w-sm text-muted-foreground">
                          {contribution.note || "No note"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/goals/${contribution.goal.id}/contributions`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View goal history
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Goal performance summaries</CardTitle>
            <CardDescription>
              Snapshot by goal showing pace, projection, and expected completion timing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goalRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals available for performance summaries.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead>Projected Completion</TableHead>
                      <TableHead className="text-right">Gap to Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalRows.map((goal) => {
                      const delta = goal.projectedValueAtTargetDate - goal.targetAmount;

                      return (
                        <TableRow key={goal.id}>
                          <TableCell className="font-medium">{goal.name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(goal.monthlyContribution)}
                          </TableCell>
                          <TableCell>
                            {goal.projectedCompletionDate
                              ? formatDate(goal.projectedCompletionDate)
                              : "Not reachable"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${delta >= 0 ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {formatCurrency(delta)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecasted outcomes</CardTitle>
            <CardDescription>
              Portfolio-level scenario totals using conservative, moderate, and aggressive return assumptions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals available for scenario forecasting.</p>
            ) : (
              Object.entries(scenarioTotals).map(([scenarioName, totals]) => (
                <div
                  key={scenarioName}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className={`font-semibold ${scenarioClassName[scenarioName] || "text-foreground"}`}>
                      {scenarioName}
                    </p>
                    <p className="text-sm text-muted-foreground">Portfolio forecast</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(totals.futureValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gains: {formatCurrency(totals.totalGains)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Completion statistics</CardTitle>
            <CardDescription>
              Goal completion and risk distribution across your entire portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CompletionCard
              label="Completed"
              value={String(completedCount)}
              detail={`${formatRatioPercent(completionRate)}% of goals`}
            />
            <CompletionCard
              label="On track"
              value={String(onTrackCount)}
              detail={`${formatRatioPercent(forecastHitRate)}% completed or on track`}
            />
            <CompletionCard
              label="At risk"
              value={String(atRiskCount)}
              detail={goalRows.length > 0 ? `${formatRatioPercent((atRiskCount / goalRows.length) * 100)}% of goals` : "0.0% of goals"}
            />
            <CompletionCard
              label="Average progress"
              value={`${formatRatioPercent(averageProgress)}%`}
              detail="Mean funding progress across all goals"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  description: string;
};

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

type CompletionCardProps = {
  label: string;
  value: string;
  detail: string;
};

function CompletionCard({ label, value, detail }: CompletionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function formatRatioPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0";
  }

  return Math.max(0, Math.min(100, value)).toFixed(1);
}

function getMonthsToTarget(targetDate: Date, now: Date): number {
  if (targetDate <= now) {
    return 0;
  }

  try {
    return calculateCompleteMonthsBetween(now, targetDate);
  } catch {
    return 0;
  }
}
