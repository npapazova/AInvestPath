import Link from "next/link";
import { getGoals } from "@/app/actions/goals";
import { GoalList } from "@/components/goals/GoalList";
import { GoalStatusFilter } from "@/components/goals/GoalStatusFilter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoalsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const { view } = await searchParams;
  const isArchivedView = view === "archived";
  const goals = await getGoals({ includeArchived: isArchivedView });

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

      <GoalStatusFilter activeView={isArchivedView ? "archived" : "active"} />

      <GoalList goals={goals} isArchivedView={isArchivedView} />
    </div>
  );
}
