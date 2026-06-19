import type { Contribution } from "@prisma/client";
import { ContributionRowActions } from "@/components/contributions/ContributionRowActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

type ContributionHistoryTableProps = {
  contributions: Contribution[];
};

export function ContributionHistoryTable({
  contributions,
}: ContributionHistoryTableProps) {
  if (contributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No contributions yet</CardTitle>
          <CardDescription>
            Record your first deposit to start tracking progress.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution history</CardTitle>
        <CardDescription>Sorted by newest date first.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell>{formatDate(contribution.contributionDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(contribution.amount)}
                  </TableCell>
                  <TableCell className="max-w-sm text-muted-foreground">
                    {contribution.note || "No note"}
                  </TableCell>
                  <TableCell>
                    <ContributionRowActions contribution={contribution} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}