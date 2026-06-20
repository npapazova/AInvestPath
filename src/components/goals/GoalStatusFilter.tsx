import Link from "next/link";
import { cn } from "@/lib/utils";

type GoalStatusFilterProps = {
  activeView: "goals" | "archived";
};

export function GoalStatusFilter({ activeView }: GoalStatusFilterProps) {
  const tabs = [
    { value: "goals" as const, label: "Goals", href: "/goals" },
    { value: "archived" as const, label: "Archived", href: "/goals?view=archived" },
  ];

  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeView === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
