import Link from "next/link";
import { Plus } from "lucide-react";
import type { Goal } from "@prisma/client";
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
import type { GoalPriority } from "@/lib/constants/goal";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type GoalListProps = {
  goals: Goal[];
  isArchivedView: boolean;
};

const priorityVariant: Record<
  GoalPriority,
  "default" | "secondary" | "outline"
> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export function GoalList({ goals, isArchivedView }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            {isArchivedView ? "No archived goals" : "No goals yet"}
          </CardTitle>
          <CardDescription>
            {isArchivedView
              ? "Goals you archive will appear here."
              : "Create your first investment goal to start planning your financial future."}
          </CardDescription>
        </CardHeader>
        {!isArchivedView && (
          <CardContent className="flex justify-center pb-8">
            <Link href="/goals/new" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Create Goal
            </Link>
          </CardContent>
        )}
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
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead className="text-right">Monthly</TableHead>
            <TableHead className="text-right">Return</TableHead>
            <TableHead>Target Date</TableHead>
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
                  {goal.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(goal.currentAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(goal.targetAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(goal.monthlyContribution)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(goal.expectedReturn)}
              </TableCell>
              <TableCell>{formatDate(goal.targetDate)}</TableCell>
              <TableCell>
                <GoalActions goal={goal} isArchived={isArchivedView} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
