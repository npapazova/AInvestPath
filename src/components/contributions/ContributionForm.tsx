"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Contribution } from "@prisma/client";
import {
  createContribution,
  updateContribution,
} from "@/app/actions/contributions";
import type { ActionResult } from "@/lib/actions/types";
import { toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GoalOption = {
  id: string;
  name: string;
};

type ContributionFormProps = {
  mode: "create" | "edit";
  contribution?: Pick<
    Contribution,
    "id" | "goalId" | "amount" | "contributionDate" | "note"
  > & {
    goalName?: string;
  };
  goalOptions?: GoalOption[];
  defaultGoalId?: string;
};

type FormState = ActionResult<Contribution>;

const initialState: FormState = { success: false, error: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

export function ContributionForm({
  mode,
  contribution,
  goalOptions,
  defaultGoalId,
}: ContributionFormProps) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createContribution
      : updateContribution.bind(null, contribution!.id);

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData) => action(formData),
    initialState,
  );

  useEffect(() => {
    if (state.success && "data" in state && state.data) {
      toast.success(mode === "create" ? "Contribution recorded" : "Contribution updated");
      router.push(`/goals/${state.data.goalId}/contributions`);
      router.refresh();
    } else if (!state.success && state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [mode, router, state]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const selectedGoalId = contribution?.goalId ?? defaultGoalId ?? "";
  const selectedGoalName =
    contribution?.goalName ??
    goalOptions?.find((goal) => goal.id === selectedGoalId)?.name;

  const cancelHref = contribution
    ? `/goals/${contribution.goalId}/contributions`
    : "/goals";
  const defaultContributionDate = contribution
    ? toDateInputValue(new Date(contribution.contributionDate))
    : toDateInputValue(new Date());

  return (
    <form action={formAction} className="space-y-6">
      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="goalId">Goal</Label>
          <select
            id="goalId"
            name="goalId"
            defaultValue={selectedGoalId}
            className={selectClassName}
            required
          >
            <option value="">Select a goal</option>
            {goalOptions?.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors?.goalId} />
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Goal: <span className="font-medium text-foreground">{selectedGoalName}</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (EUR)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={contribution?.amount ?? ""}
            onWheel={(event) => event.currentTarget.blur()}
            required
          />
          <FieldError messages={fieldErrors?.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contributionDate">Contribution date</Label>
          <Input
            id="contributionDate"
            name="contributionDate"
            type="date"
            defaultValue={defaultContributionDate}
            required
          />
          <FieldError messages={fieldErrors?.contributionDate} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={contribution?.note ?? ""}
            placeholder="e.g. Bonus contribution"
          />
          <FieldError messages={fieldErrors?.note} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Save Contribution"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}