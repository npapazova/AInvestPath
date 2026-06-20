import Link from "next/link";
import { Plus } from "lucide-react";
import { GoalActions } from "@/components/goals/GoalActions";
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
import {
  type GoalPriority,
} from "@/lib/constants/goal";
import { formatCurrency, formatDate } from "@/lib/format";
import type { GoalWithMetrics } from "@/lib/goals";
import { cn } from "@/lib/utils";

type GoalListProps = {
  goals: GoalWithMetrics[];
};

const priorityVariant: Record<
  GoalPriority,
  "default" | "secondary" | "outline"
> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

const priorityLabel: Record<GoalPriority, "H" | "M" | "L"> = {
  HIGH: "H",
  MEDIUM: "M",
  LOW: "L",
};

export function GoalList({ goals }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>No goals match your filters</CardTitle>
          <CardDescription>
            Try changing category, date range, or sorting options.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Link href="/goals/new" className={cn(buttonVariants())}>
            <Plus className="size-4" />
            Create Goal
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Goal</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="w-28">Progress</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead>Target Date</TableHead>
            <TableHead>Proj. Completion</TableHead>
            <TableHead className="text-right">Projected Delta</TableHead>
            <TableHead>Simulations</TableHead>
            <TableHead>Contributions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal) => (
            <TableRow key={goal.id}>
              <TableCell>
                <div className="font-medium">{goal.name}</div>
                {goal.notes && (
                  <div className="max-w-xs truncate text-sm text-muted-foreground">
                    {goal.notes}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={priorityVariant[goal.priority as GoalPriority]}>
                  {priorityLabel[goal.priority as GoalPriority]}
                </Badge>
              </TableCell>
              <TableCell className="w-28">
                <div className="space-y-1">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {goal.progressPercentage.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(goal.currentAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(goal.targetAmount)}
              </TableCell>
              <TableCell>{formatDate(goal.targetDate)}</TableCell>
              <TableCell>
                {goal.projectedCompletionDate ? formatDate(goal.projectedCompletionDate) : "Not reachable"}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-medium",
                    goal.projectedValueAtTargetDate >= goal.targetAmount
                      ? "text-emerald-700"
                      : "text-amber-700",
                  )}
                >
                  {formatCurrency(goal.projectedValueAtTargetDate - goal.targetAmount)}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/goals/${goal.id}/simulations`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Simulate
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/goals/${goal.id}/contributions`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Add Contribution
                </Link>
              </TableCell>
              <TableCell>
                <GoalActions goal={goal} isArchived={goal.status === "ARCHIVED"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
