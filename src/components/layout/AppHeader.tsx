import Link from "next/link";
import { Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-3xl bg-slate-50 px-3 py-2 text-slate-900 transition hover:bg-slate-100"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200 text-slate-900">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">
              AInvestPath
            </span>
            <span className="text-xs text-slate-600">Plan today, reach tomorrow</span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-violet-200/40 bg-violet-100/10 text-violet-50 hover:bg-violet-100/20 hover:text-violet-50",
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/goals"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-violet-200/40 bg-violet-100/10 text-violet-50 hover:bg-violet-100/20 hover:text-violet-50",
            )}
          >
            Goals
          </Link>
          <Link
            href="/goals"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-violet-200/40 bg-violet-100/10 text-violet-50 hover:bg-violet-100/20 hover:text-violet-50",
            )}
          >
            Simulations
          </Link>
          <Link
            href="/contributions"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-violet-200/40 bg-violet-100/10 text-violet-50 hover:bg-violet-100/20 hover:text-violet-50",
            )}
          >
            Contribution History
          </Link>
          <Link
            href="/goals/new"
            className={cn(
              buttonVariants({ size: "sm", variant: "default" }),
              "bg-white text-slate-900 hover:bg-white/90"
            )}
          >
            New Goal
          </Link>
        </nav>
      </div>
    </header>
  );
}
