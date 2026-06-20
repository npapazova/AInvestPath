import Link from "next/link";
import { type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Goal,
  Plus,
  TrendingUp,
} from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { enrichGoalsWithMetrics } from "@/lib/goals";
import { cn } from "@/lib/utils";

const priorityVariant: Record<string, "default" | "secondary" | "outline"> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export default async function HomePage() {
  const [goals, contributions] = await Promise.all([getGoals(), getAllContributions()]);

  const enrichedGoals = enrichGoalsWithMetrics(goals);
  const totalInvested = enrichedGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProjectedValue = enrichedGoals.reduce(
    (sum, goal) => sum + goal.projectedValueAtTargetDate,
    0,
  );
  const totalTarget = enrichedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const completionPercentage = totalTarget > 0 ? Math.min(100, (totalInvested / totalTarget) * 100) : 0;

  const upcomingDeadlines = [...enrichedGoals]
    .sort((left, right) => left.targetDate.getTime() - right.targetDate.getTime())
    .slice(0, 4);

  const recentContributions = contributions.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-800 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full bg-violet-100/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-50">
            Main dashboard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-violet-50 sm:text-5xl">
            Your investment plan at a glance.
          </h1>
          <p className="max-w-2xl text-base text-violet-100 sm:text-lg">
            Track funded capital, projected growth, deadline pressure, and recent deposits from one central view.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/goals/new"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "border-violet-200 bg-violet-100 text-violet-950 hover:bg-violet-50",
              )}
            >
              <Plus className="size-4" />
              New Goal
            </Link>
            <Link
              href="/goals"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-violet-200/40 bg-violet-100/10 text-violet-50 hover:bg-violet-100/20 hover:text-violet-50",
              )}
            >
              View Goals
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total invested amount"
          value={formatCurrency(totalInvested)}
          description="Current capital tracked across your non-archived goals."
          icon={<CircleDollarSign className="size-4" />}
        />
        <MetricCard
          title="Total portfolio value"
          value={formatCurrency(totalProjectedValue)}
          description="Projected value at each goal target date."
          icon={<TrendingUp className="size-4" />}
        />
        <MetricCard
          title="Active goals"
          value={String(enrichedGoals.length)}
          description="Goals still in your live planning set."
          icon={<Goal className="size-4" />}
        />
        <MetricCard
          title="Overall completion"
          value={`${completionPercentage.toFixed(1)}%`}
          description="Weighted by total target amount across active goals."
          icon={<Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">Goal health</Badge>}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Upcoming target deadlines</CardTitle>
            <CardDescription>Closest goals by target date.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-1 flex-col space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a goal to start tracking deadlines.</p>
            ) : (
              upcomingDeadlines.map((goal) => (
                <div
                  key={goal.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{goal.name}</p>
                      <Badge variant={priorityVariant[goal.priority]}>{goal.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Target {formatDate(goal.targetDate)} · {goal.progressPercentage.toFixed(1)}% complete
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CalendarDays className="size-4" />
                    {goal.targetDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Recently added contributions</CardTitle>
            <CardDescription>Latest deposits recorded across your goals.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-1 flex-col space-y-3">
            {recentContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contributions have been recorded yet.</p>
            ) : (
              recentContributions.map((contribution) => (
                <div key={contribution.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{contribution.goal.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(contribution.contributionDate)}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold text-emerald-700">
                      {formatCurrency(contribution.amount)}
                    </p>
                  </div>
                  {contribution.note ? (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{contribution.note}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex justify-center">
        <Card className="w-full max-w-6xl border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Dashboard snapshot</CardTitle>
            <CardDescription>What the numbers mean right now.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Active goal coverage</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{completionPercentage.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(totalInvested)} funded of {formatCurrency(totalTarget)} target value.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Projected upside</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-cyan-700">
                {formatCurrency(totalProjectedValue - totalInvested)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on each goal's expected return and target date.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
};

function MetricCard({ title, value, description, icon }: MetricCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <div className="rounded-full bg-slate-100 p-2 text-slate-700">{icon}</div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
