"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Contribution } from "@prisma/client";
import { deleteContribution } from "@/app/actions/contributions";
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
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type ContributionRowActionsProps = {
  contribution: Contribution;
};

export function ContributionRowActions({ contribution }: ContributionRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContribution(contribution.id);

      if (result.success) {
        toast.success("Contribution deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/contributions/${contribution.id}/edit`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label="Edit contribution"
      >
        <Pencil className="size-4" />
      </Link>

      <AlertDialog>
        <AlertDialogTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          disabled={isPending}
          aria-label="Delete contribution"
        >
          <Trash2 className="size-4 text-destructive" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this deposit of {formatCurrency(contribution.amount)}.
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