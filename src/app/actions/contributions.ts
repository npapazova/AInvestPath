"use server";

import { revalidatePath } from "next/cache";
import type { Contribution } from "@prisma/client";
import { ACTIVE_GOAL_STATUSES } from "@/lib/constants/goal";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { prisma } from "@/lib/db";
import { fromCents, roundToCents, toCents } from "@/lib/money";
import {
  parseCreateContributionFormData,
  parseUpdateContributionFormData,
} from "@/lib/validations/contribution";
import { formatZodErrors } from "@/lib/validations/goal";

export type GoalContributionSummary = {
  goalId: string;
  targetAmount: number;
  currentAmount: number;
  totalContributed: number;
  remainingAmount: number;
  progressPercentage: number;
};

export async function getGoalsForContributionSelection() {
  return prisma.goal.findMany({
    where: { status: { in: ACTIVE_GOAL_STATUSES } },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      targetAmount: true,
    },
  });
}

export async function getAllContributions() {
  return prisma.contribution.findMany({
    include: {
      goal: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ contributionDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function getGoalContributions(goalId: string): Promise<Contribution[]> {
  return prisma.contribution.findMany({
    where: { goalId },
    orderBy: [{ contributionDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function getContribution(id: string) {
  return prisma.contribution.findUnique({
    where: { id },
    include: { goal: { select: { id: true, name: true } } },
  });
}

export async function getGoalContributionSummary(
  goalId: string,
): Promise<GoalContributionSummary | null> {
  const [goal, aggregates] = await prisma.$transaction([
    prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true, targetAmount: true, currentAmount: true },
    }),
    prisma.contribution.aggregate({
      where: { goalId },
      _sum: { amount: true },
    }),
  ]);

  if (!goal) {
    return null;
  }

  const totalContributed = roundToCents(aggregates._sum.amount ?? 0);
  const totalTrackedAmount = fromCents(
    toCents(goal.currentAmount) + toCents(totalContributed),
  );
  const remainingAmount = fromCents(
    Math.max(0, toCents(goal.targetAmount) - toCents(totalTrackedAmount)),
  );
  const progressPercentage =
    goal.targetAmount > 0
      ? Number(
          Math.min(100, (totalTrackedAmount / goal.targetAmount) * 100).toFixed(2),
        )
      : 0;

  return {
    goalId: goal.id,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    totalContributed,
    remainingAmount,
    progressPercentage,
  };
}

export async function createContribution(
  formData: FormData,
): Promise<ActionResult<Contribution>> {
  const parsed = parseCreateContributionFormData(formData);

  if (!parsed.success) {
    return actionError("Validation failed", formatZodErrors(parsed.error));
  }

  const goal = await prisma.goal.findUnique({ where: { id: parsed.data.goalId } });

  if (!goal) {
    return actionError("Goal not found");
  }

  try {
    const contribution = await prisma.contribution.create({
      data: {
        ...parsed.data,
        amount: roundToCents(parsed.data.amount),
      },
    });

    revalidatePath("/goals");
    revalidatePath("/contributions");
    revalidatePath(`/goals/${goal.id}/contributions`);
    return actionSuccess(contribution);
  } catch {
    return actionError("Failed to create contribution");
  }
}

export async function updateContribution(
  id: string,
  formData: FormData,
): Promise<ActionResult<Contribution>> {
  const existing = await prisma.contribution.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Contribution not found");
  }

  const parsed = parseUpdateContributionFormData(formData);

  if (!parsed.success) {
    return actionError("Validation failed", formatZodErrors(parsed.error));
  }

  try {
    const contribution = await prisma.contribution.update({
      where: { id },
      data: {
        ...parsed.data,
        amount: roundToCents(parsed.data.amount),
      },
    });

    revalidatePath("/goals");
    revalidatePath("/contributions");
    revalidatePath(`/goals/${existing.goalId}/contributions`);
    revalidatePath(`/contributions/${id}/edit`);
    return actionSuccess(contribution);
  } catch {
    return actionError("Failed to update contribution");
  }
}

export async function deleteContribution(id: string): Promise<ActionResult> {
  const existing = await prisma.contribution.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Contribution not found");
  }

  try {
    await prisma.contribution.delete({ where: { id } });

    revalidatePath("/goals");
    revalidatePath("/contributions");
    revalidatePath(`/goals/${existing.goalId}/contributions`);
    return actionSuccess(undefined);
  } catch {
    return actionError("Failed to delete contribution");
  }
}