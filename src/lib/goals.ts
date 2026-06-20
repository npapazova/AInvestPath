import type { Goal } from "@prisma/client";
import { calculateCompleteMonthsBetween } from "@/domain/financial-engine/compound-projection";
import { calculateFutureValue } from "@/domain/financial-engine/math";

export type GoalWithMetrics = Goal & {
  progressPercentage: number;
  projectedValueAtTargetDate: number;
  projectedCompletionDate: Date | null;
};

export type GoalSortValue =
  | "progress"
  | "targetAmount"
  | "targetDate"
  | "projectedCompletionDate";

export type GoalQueryFilters = {
  targetFrom?: string;
  targetTo?: string;
  sort?: GoalSortValue;
  order?: "asc" | "desc";
};

export function enrichGoalsWithMetrics(goals: Goal[], now = new Date()): GoalWithMetrics[] {
  return goals.map((goal) => {
    const progressPercentage = Math.min(
      100,
      Math.max(0, (goal.currentAmount / goal.targetAmount) * 100),
    );

    const monthsToTarget = calculateSafeMonths(now, goal.targetDate);
    const projectedValueAtTargetDate = calculateFutureValue({
      initialPrincipal: goal.currentAmount,
      monthlyContribution: goal.monthlyContribution,
      annualRate: goal.expectedReturn,
      months: monthsToTarget,
    }).futureValue;

    const projectedCompletionDate = estimateProjectedCompletionDate(goal, now);

    return {
      ...goal,
      progressPercentage,
      projectedValueAtTargetDate,
      projectedCompletionDate,
    };
  });
}

export function filterGoals(
  goals: GoalWithMetrics[],
  filters: GoalQueryFilters,
): GoalWithMetrics[] {
  return goals.filter((goal) => {
    if (filters.targetFrom) {
      const from = parseDateFloor(filters.targetFrom);

      if (from && goal.targetDate < from) {
        return false;
      }
    }

    if (filters.targetTo) {
      const to = parseDateCeil(filters.targetTo);

      if (to && goal.targetDate > to) {
        return false;
      }
    }

    return true;
  });
}

export function sortGoals(
  goals: GoalWithMetrics[],
  sort: GoalSortValue = "targetDate",
  order: "asc" | "desc" = "asc",
): GoalWithMetrics[] {
  const direction = order === "asc" ? 1 : -1;

  const sorted = [...goals].sort((left, right) => {
    if (sort === "progress") {
      return (left.progressPercentage - right.progressPercentage) * direction;
    }

    if (sort === "targetAmount") {
      return (left.targetAmount - right.targetAmount) * direction;
    }

    if (sort === "projectedCompletionDate") {
      const leftMissing = left.projectedCompletionDate == null;
      const rightMissing = right.projectedCompletionDate == null;

      if (leftMissing && rightMissing) {
        return 0;
      }

      if (leftMissing) {
        return 1;
      }

      if (rightMissing) {
        return -1;
      }

      return (
        (left.projectedCompletionDate!.getTime() - right.projectedCompletionDate!.getTime())
        * direction
      );
    }

    return (left.targetDate.getTime() - right.targetDate.getTime()) * direction;
  });

  return sorted;
}

function estimateProjectedCompletionDate(goal: Goal, now: Date): Date | null {
  if (goal.currentAmount >= goal.targetAmount) {
    return now;
  }

  const maxMonths = 1200;

  for (let month = 1; month <= maxMonths; month += 1) {
    const projection = calculateFutureValue({
      initialPrincipal: goal.currentAmount,
      monthlyContribution: goal.monthlyContribution,
      annualRate: goal.expectedReturn,
      months: month,
    }).futureValue;

    if (projection >= goal.targetAmount) {
      const completion = new Date(now);
      completion.setMonth(completion.getMonth() + month);
      return completion;
    }
  }

  return null;
}

function calculateSafeMonths(startDate: Date, endDate: Date): number {
  try {
    return calculateCompleteMonthsBetween(startDate, endDate);
  } catch {
    return 0;
  }
}

function parseDateFloor(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateCeil(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(23, 59, 59, 999);
  return date;
}
