import Link from "next/link";
import { getGoals } from "@/app/actions/goals";
import { GoalForm } from "@/components/goals/GoalForm";
import { toDateInputValue } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewGoalPage() {
  const goals = await getGoals({ status: "all" });
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/goals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to goals
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Create Goal
        </h1>
        <p className="text-sm text-muted-foreground">
          Define a new investment target and contribution plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal details</CardTitle>
          <CardDescription>
            Enter your target amount, savings, and expected return assumptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm
            mode="create"
            defaultTargetDate={toDateInputValue(oneYearFromNow)}
            existingGoalNames={goals.map((goal) => goal.name)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
