import { getGoals } from "@/app/actions/goals";
import { GoalsFilterBar } from "@/components/goals/GoalsFilterBar";
import { GoalList } from "@/components/goals/GoalList";
import { GoalStatusFilter } from "@/components/goals/GoalStatusFilter";
import { GoalsVisualizations } from "@/components/goals/GoalsVisualizations";
import {
  enrichGoalsWithMetrics,
  filterGoals,
  sortGoals,
  type GoalQueryFilters,
} from "@/lib/goals";

type GoalsPageProps = {
  searchParams: Promise<{
    view?: string;
    status?: string;
    targetFrom?: string;
    targetTo?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const params = await searchParams;
  const isArchivedView = params.view === "archived" || params.status === "archived";

  const filters: GoalQueryFilters = {
    targetFrom: params.targetFrom,
    targetTo: params.targetTo,
    sort: normalizeSort(params.sort),
    order: normalizeOrder(params.order),
  };

  const goals = await getGoals({ includeArchived: isArchivedView });
  const enrichedGoals = enrichGoalsWithMetrics(goals);
  const filtered = filterGoals(enrichedGoals, filters);
  const sorted = sortGoals(filtered, filters.sort, filters.order);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Future-ready planning
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Investment Goals
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Plan today, reach tomorrow with vivid milestones and a brighter roadmap.
          </p>
        </div>
      </section>

      <GoalStatusFilter
        activeView={isArchivedView ? "archived" : "goals"}
      />

      <GoalsFilterBar
        filters={{
          targetFrom: filters.targetFrom,
          targetTo: filters.targetTo,
          sort: filters.sort ?? "targetDate",
          order: filters.order ?? "asc",
        }}
        isArchivedView={isArchivedView}
      />

      {!isArchivedView ? <GoalsVisualizations goals={sorted} /> : null}

      <GoalList goals={sorted} />
    </div>
  );
}

function normalizeSort(value?: string): GoalQueryFilters["sort"] {
  if (
    value === "progress"
    || value === "targetAmount"
    || value === "targetDate"
    || value === "projectedCompletionDate"
  ) {
    return value;
  }

  return "targetDate";
}

function normalizeOrder(value?: string): GoalQueryFilters["order"] {
  if (value === "desc") {
    return "desc";
  }

  return "asc";
}
