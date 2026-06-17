"use server";

import { revalidatePath } from "next/cache";
import type { Goal } from "@prisma/client";
import { ACTIVE_GOAL_STATUSES } from "@/lib/constants/goal";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { prisma } from "@/lib/db";
import {
  formatZodErrors,
  parseGoalFormData,
} from "@/lib/validations/goal";

export type GoalsFilter = {
  includeArchived?: boolean;
};

export async function getGoals(filter: GoalsFilter = {}): Promise<Goal[]> {
  const { includeArchived = false } = filter;

  return prisma.goal.findMany({
    where: includeArchived
      ? { status: "ARCHIVED" }
      : { status: { in: ACTIVE_GOAL_STATUSES } },
    orderBy: [{ priority: "desc" }, { targetDate: "asc" }],
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

  try {
    const goal = await prisma.goal.create({
      data: {
        ...parsed.data,
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

  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: parsed.data,
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
