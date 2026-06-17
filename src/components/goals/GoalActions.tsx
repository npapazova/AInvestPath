"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Goal } from "@prisma/client";
import {
  archiveGoal,
  deleteGoal,
  unarchiveGoal,
} from "@/app/actions/goals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoalActionsProps = {
  goal: Goal;
  isArchived: boolean;
};

export function GoalActions({ goal, isArchived }: GoalActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchiveToggle() {
    startTransition(async () => {
      const result = isArchived
        ? await unarchiveGoal(goal.id)
        : await archiveGoal(goal.id);

      if (result.success) {
        toast.success(isArchived ? "Goal restored" : "Goal archived");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGoal(goal.id);

      if (result.success) {
        toast.success("Goal deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/goals/${goal.id}/edit`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`Edit ${goal.name}`}
      >
        <Pencil className="size-4" />
      </Link>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleArchiveToggle}
        disabled={isPending}
        aria-label={isArchived ? `Restore ${goal.name}` : `Archive ${goal.name}`}
      >
        {isArchived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          disabled={isPending}
          aria-label={`Delete ${goal.name}`}
        >
          <Trash2 className="size-4 text-destructive" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &ldquo;{goal.name}&rdquo;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
