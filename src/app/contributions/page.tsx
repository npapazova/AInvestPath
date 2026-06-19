import Link from "next/link";
import { getAllContributions } from "@/app/actions/contributions";
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

export default async function ContributionsPage() {
  const contributions = await getAllContributions();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            All goals overview
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Contribution History
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Review every recorded deposit without opening each goal individually.
          </p>
        </div>
      </section>

      {contributions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No contributions recorded</CardTitle>
            <CardDescription>
              Add your first contribution from a goal to start building history.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All contributions</CardTitle>
            <CardDescription>Sorted by newest date first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Open Goal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-medium">{contribution.goal.name}</TableCell>
                      <TableCell>{formatDate(contribution.contributionDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contribution.amount)}
                      </TableCell>
                      <TableCell className="max-w-sm text-muted-foreground">
                        {contribution.note || "No note"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/goals/${contribution.goal.id}/contributions`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View goal history
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}