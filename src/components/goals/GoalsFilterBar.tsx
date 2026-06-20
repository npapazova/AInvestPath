import type { GoalQueryFilters } from "@/lib/goals";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type GoalsFilterBarProps = {
  filters: Required<Pick<GoalQueryFilters, "sort" | "order">>
    & Pick<GoalQueryFilters, "targetFrom" | "targetTo">;
  isArchivedView: boolean;
};

export function GoalsFilterBar({ filters, isArchivedView }: GoalsFilterBarProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm shadow-slate-900/5">
      <form method="get" className="grid gap-4 lg:grid-cols-4">
        {isArchivedView ? <input type="hidden" name="view" value="archived" /> : null}

        <div className="space-y-2">
          <Label htmlFor="targetFrom">Target date from</Label>
          <Input id="targetFrom" name="targetFrom" type="date" defaultValue={filters.targetFrom ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetTo">Target date to</Label>
          <Input id="targetTo" name="targetTo" type="date" defaultValue={filters.targetTo ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort">Sort by</Label>
          <select
            id="sort"
            name="sort"
            defaultValue={filters.sort}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="progress">Progress percentage</option>
            <option value="targetAmount">Target amount</option>
            <option value="targetDate">Target date</option>
            <option value="projectedCompletionDate">Projected completion date</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <select
            id="order"
            name="order"
            defaultValue={filters.order}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="col-span-full flex items-center gap-2">
          <Button type="submit">Apply filters</Button>
          <a
            href={isArchivedView ? "/goals?view=archived" : "/goals"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Reset
          </a>
        </div>
      </form>
    </section>
  );
}
