import Link from "next/link";
import { notFound } from "next/navigation";
import { getContribution } from "@/app/actions/contributions";
import { ContributionForm } from "@/components/contributions/ContributionForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EditContributionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContributionPage({
  params,
}: EditContributionPageProps) {
  const { id } = await params;
  const contribution = await getContribution(id);

  if (!contribution) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/goals/${contribution.goal.id}/contributions`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to contributions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit Contribution
        </h1>
        <p className="text-sm text-muted-foreground">
          Update deposit for &ldquo;{contribution.goal.name}&rdquo;
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution details</CardTitle>
          <CardDescription>
            Modify amount, date, and note while keeping the linked goal unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionForm
            mode="edit"
            contribution={{
              id: contribution.id,
              goalId: contribution.goalId,
              amount: contribution.amount,
              contributionDate: contribution.contributionDate,
              note: contribution.note,
              goalName: contribution.goal.name,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}