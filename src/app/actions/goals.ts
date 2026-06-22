"use server";

import { revalidatePath } from "next/cache";
import type { Goal } from "@prisma/client";
import { ACTIVE_GOAL_STATUSES } from "@/lib/constants/goal";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { prisma } from "@/lib/db";
import { fromCents, roundToCents, toCents } from "@/lib/money";
import {
  formatZodErrors,
  parseGoalFormData,
} from "@/lib/validations/goal";

export type GoalsFilter = {
  includeArchived?: boolean;
  status?: "completed" | "archived" | "all";
};

function normalizeGoalName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function hasDuplicateGoalName(name: string, excludeGoalId?: string): Promise<boolean> {
  const goals = await prisma.goal.findMany({
    where: excludeGoalId ? { id: { not: excludeGoalId } } : undefined,
    select: { name: true },
  });

  const normalizedName = normalizeGoalName(name);
  return goals.some((goal) => normalizeGoalName(goal.name) === normalizedName);
}

export async function getGoals(filter: GoalsFilter = {}): Promise<Goal[]> {
  const { includeArchived = false, status } = filter;

  const where =
    status === "all"
      ? undefined
      : status === "archived"
        ? { status: "ARCHIVED" }
        : status === "completed"
          ? { status: "COMPLETED" }
          : includeArchived
            ? { status: "ARCHIVED" }
            : { status: { in: ACTIVE_GOAL_STATUSES } };

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [{ priority: "desc" }, { targetDate: "asc" }],
  });

  if (goals.length === 0) {
    return goals;
  }

  const contributionSums = await prisma.contribution.groupBy({
    by: ["goalId"],
    where: {
      goalId: {
        in: goals.map((goal) => goal.id),
      },
    },
    _sum: {
      amount: true,
    },
  });

  const contributionByGoalId = new Map(
    contributionSums.map((entry) => [entry.goalId, entry._sum.amount ?? 0]),
  );

  return goals.map((goal) => {
    const contributionTotal = roundToCents(
      contributionByGoalId.get(goal.id) ?? 0,
    );

    return {
      ...goal,
      currentAmount: fromCents(
        toCents(goal.currentAmount) + toCents(contributionTotal),
      ),
    };
  });
}

export async function getGoal(id: string): Promise<Goal | null> {
  return prisma.goal.findUnique({ where: { id } });
}

export async function createGoal(
  formData: FormData,
): Promise<ActionResult<Goal>> {
  const parsed = parseGoalFormData(formData);

  if (!parsed.success) {
    return actionError("Validation failed", formatZodErrors(parsed.error));
  }

  if (await hasDuplicateGoalName(parsed.data.name)) {
    return actionError("Validation failed", {
      name: ["A goal with this name already exists"],
    });
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        ...parsed.data,
        nameNormalized: normalizeGoalName(parsed.data.name),
        status: "ACTIVE",
      },
    });

    revalidatePath("/goals");
    return actionSuccess(goal);
  } catch {
    return actionError("Failed to create goal");
  }
}

export async function updateGoal(
  id: string,
  formData: FormData,
): Promise<ActionResult<Goal>> {
  const existing = await prisma.goal.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Goal not found");
  }

  const parsed = parseGoalFormData(formData);

  if (!parsed.success) {
    return actionError("Validation failed", formatZodErrors(parsed.error));
  }

  if (await hasDuplicateGoalName(parsed.data.name, id)) {
    return actionError("Validation failed", {
      name: ["A goal with this name already exists"],
    });
  }

  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...parsed.data,
        nameNormalized: normalizeGoalName(parsed.data.name),
      },
    });

    revalidatePath("/goals");
    revalidatePath(`/goals/${id}/edit`);
    return actionSuccess(goal);
  } catch {
    return actionError("Failed to update goal");
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const existing = await prisma.goal.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Goal not found");
  }

  try {
    await prisma.goal.delete({ where: { id } });
    revalidatePath("/goals");
    return actionSuccess(undefined);
  } catch {
    return actionError("Failed to delete goal");
  }
}

export async function archiveGoal(id: string): Promise<ActionResult<Goal>> {
  const existing = await prisma.goal.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Goal not found");
  }

  if (existing.status === "ARCHIVED") {
    return actionError("Goal is already archived");
  }

  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    revalidatePath("/goals");
    return actionSuccess(goal);
  } catch {
    return actionError("Failed to archive goal");
  }
}

export async function unarchiveGoal(id: string): Promise<ActionResult<Goal>> {
  const existing = await prisma.goal.findUnique({ where: { id } });

  if (!existing) {
    return actionError("Goal not found");
  }

  if (existing.status !== "ARCHIVED") {
    return actionError("Goal is not archived");
  }

  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/goals");
    return actionSuccess(goal);
  } catch {
    return actionError("Failed to unarchive goal");
  }
}
