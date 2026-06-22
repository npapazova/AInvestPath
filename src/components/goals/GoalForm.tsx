"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Goal } from "@prisma/client";
import { createGoal, updateGoal } from "@/app/actions/goals";
import type { ActionResult } from "@/lib/actions/types";
import { GOAL_PRIORITIES } from "@/lib/constants/goal";
import { formatPercentInputValue, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GoalFormProps = {
  goal?: Goal;
  mode: "create" | "edit";
  defaultTargetDate?: string;
  existingGoalNames?: string[];
};

type FormState = ActionResult<Goal>;

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

function normalizeGoalName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function GoalForm({
  goal,
  mode,
  defaultTargetDate,
  existingGoalNames = [],
}: GoalFormProps) {
  const router = useRouter();

  const action =
    mode === "create" ? createGoal : updateGoal.bind(null, goal!.id);

  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    goal?.targetAmount.toString() ?? "",
  );
  const [currentAmount, setCurrentAmount] = useState(
    goal?.currentAmount.toString() ?? "",
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    goal?.monthlyContribution.toString() ?? "",
  );
  const [expectedReturnPercent, setExpectedReturnPercent] = useState(
    goal ? formatPercentInputValue(goal.expectedReturn) : "7",
  );
  const [targetDate, setTargetDate] = useState(
    goal ? toDateInputValue(goal.targetDate) : (defaultTargetDate ?? ""),
  );
  const [priority, setPriority] = useState(goal?.priority ?? "MEDIUM");
  const [notes, setNotes] = useState(goal?.notes ?? "");

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData) => action(formData),
    initialState,
  );

  useEffect(() => {
    if (state.success && "data" in state && state.data) {
      toast.success(mode === "create" ? "Goal created" : "Goal updated");
      router.push("/goals");
      router.refresh();
    } else if (!state.success && state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const normalizedName = normalizeGoalName(name);
  const duplicateNameError =
    mode === "create" &&
    normalizedName.length > 0 &&
    existingGoalNames.some((existingName) => normalizeGoalName(existingName) === normalizedName)
      ? "A goal with this name already exists"
      : undefined;
  const defaultDate = goal
    ? toDateInputValue(goal.targetDate)
    : (defaultTargetDate ?? "");

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Goal name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Retirement Fund"
            required
          />
          <FieldError messages={duplicateNameError ? [duplicateNameError] : fieldErrors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount">Target amount (€)</Label>
          <Input
            id="targetAmount"
            name="targetAmount"
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            required
          />
          <FieldError messages={fieldErrors?.targetAmount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentAmount">Current amount (€)</Label>
          <Input
            id="currentAmount"
            name="currentAmount"
            type="number"
            min="0"
            step="0.01"
            value={currentAmount}
            onChange={(event) => setCurrentAmount(event.target.value)}
            required
          />
          <FieldError messages={fieldErrors?.currentAmount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyContribution">Monthly contribution (€)</Label>
          <Input
            id="monthlyContribution"
            name="monthlyContribution"
            type="number"
            min="0"
            step="0.01"
            value={monthlyContribution}
            onChange={(event) => setMonthlyContribution(event.target.value)}
            required
          />
          <FieldError messages={fieldErrors?.monthlyContribution} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedReturnPercent">Expected annual return (%)</Label>
          <Input
            id="expectedReturnPercent"
            name="expectedReturnPercent"
            type="number"
            min="-99"
            max="200"
            step="0.1"
            value={expectedReturnPercent}
            onChange={(event) => setExpectedReturnPercent(event.target.value)}
            required
          />
          <FieldError messages={fieldErrors?.expectedReturnPercent} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetDate">Target date</Label>
          <Input
            id="targetDate"
            name="targetDate"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            required
          />
          <FieldError messages={fieldErrors?.targetDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Goal["priority"])}
            className={selectClassName}
          >
            {GOAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors?.priority} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Additional context for this goal..."
          />
          <FieldError messages={fieldErrors?.notes} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || Boolean(duplicateNameError)}>
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create Goal"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/goals")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
