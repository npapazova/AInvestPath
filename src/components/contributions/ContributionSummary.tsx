import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type ContributionSummaryProps = {
  targetAmount: number;
  totalContributed: number;
  remainingAmount: number;
  progressPercentage: number;
};

export function ContributionSummary({
  targetAmount,
  totalContributed,
  remainingAmount,
  progressPercentage,
}: ContributionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress summary</CardTitle>
        <CardDescription>
          Progress is calculated from current amount plus recorded contributions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Target amount
            </p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(targetAmount)}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Total contributions
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">
              {formatCurrency(totalContributed)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Remaining amount
            </p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(2)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}