"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
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

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const selectedGoalId = contribution?.goalId ?? defaultGoalId ?? "";
  const selectedGoalName =
    contribution?.goalName ??
    goalOptions?.find((goal) => goal.id === selectedGoalId)?.name;

  const cancelHref = contribution
    ? `/goals/${contribution.goalId}/contributions`
    : "/goals";
  const [goalIdValue, setGoalIdValue] = useState(() => selectedGoalId);
  const [amountValue, setAmountValue] = useState(() =>
    contribution?.amount != null ? String(contribution.amount) : "",
  );
  const [contributionDateValue, setContributionDateValue] = useState(() =>
    contribution
      ? toDateInputValue(new Date(contribution.contributionDate))
      : toDateInputValue(new Date()),
  );
  const [noteValue, setNoteValue] = useState(() => contribution?.note ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (state.success && "data" in state && state.data) {
      toast.success(mode === "create" ? "Contribution recorded" : "Contribution updated");

      if (mode === "create") {
        setGoalIdValue(selectedGoalId);
        setAmountValue("");
        setContributionDateValue(toDateInputValue(new Date()));
        setNoteValue("");
      } else {
        router.push(`/goals/${state.data.goalId}/contributions`);
      }

      router.refresh();
    } else if (!state.success && state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [mode, router, selectedGoalId, state]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (submitLockRef.current || isPending) {
      event.preventDefault();
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
  };

  useEffect(() => {
    if (!isPending) {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [isPending]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="goalId">Goal</Label>
          <select
            id="goalId"
            name="goalId"
            value={goalIdValue}
            onChange={(event) => setGoalIdValue(event.target.value)}
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
            value={amountValue}
            onChange={(event) => setAmountValue(event.target.value)}
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
            value={contributionDateValue}
            onChange={(event) => setContributionDateValue(event.target.value)}
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
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            placeholder="e.g. Bonus contribution"
          />
          <FieldError messages={fieldErrors?.note} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || isSubmitting}>
          {isPending || isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Save Contribution"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          disabled={isPending || isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}