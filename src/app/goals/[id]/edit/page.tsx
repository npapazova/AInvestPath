import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoal } from "@/app/actions/goals";
import { GoalForm } from "@/components/goals/GoalForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EditGoalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGoalPage({ params }: EditGoalPageProps) {
  const { id } = await params;
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

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
          Edit Goal
        </h1>
        <p className="text-sm text-muted-foreground">
          Update &ldquo;{goal.name}&rdquo;
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal details</CardTitle>
          <CardDescription>
            Adjust your target, contributions, or timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm mode="edit" goal={goal} />
        </CardContent>
      </Card>
    </div>
  );
}
