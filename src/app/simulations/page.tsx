import Link from "next/link";
import { Plus } from "lucide-react";
import { getGoals } from "@/app/actions/goals";
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
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { enrichGoalsWithMetrics } from "@/lib/goals";
import { cn } from "@/lib/utils";

export default async function SimulationsPage() {
  const goals = await getGoals();
  const enrichedGoals = enrichGoalsWithMetrics(goals);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Scenario explorer
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simulations
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Pick a goal to compare conservative, moderate, and aggressive return scenarios.
          </p>
        </div>
      </section>

      {enrichedGoals.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No goals available for simulation</CardTitle>
            <CardDescription>
              Create a goal first, then run scenario projections.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link href="/goals/new" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Create Goal
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a goal to simulate</CardTitle>
            <CardDescription>
              Each simulation opens a detailed scenario comparison for that goal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead className="text-right">Simulation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(goal.currentAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(goal.targetAmount)}</TableCell>
                      <TableCell className="text-right">{formatPercent(goal.expectedReturn)}</TableCell>
                      <TableCell>{formatDate(goal.targetDate)}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/goals/${goal.id}/simulations`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Open Simulation
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
