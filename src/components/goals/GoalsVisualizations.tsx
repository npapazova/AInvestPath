import { formatCurrency, formatDate } from "@/lib/format";
import type { GoalWithMetrics } from "@/lib/goals";

type GoalsVisualizationsProps = {
  goals: GoalWithMetrics[];
};

type GrowthPoint = {
  month: number;
  value: number;
};

const CHART_WIDTH = 620;
const CHART_HEIGHT = 220;
const CHART_PADDING_X = 32;
const CHART_PADDING_Y = 18;

export function GoalsVisualizations({ goals }: GoalsVisualizationsProps) {
  if (goals.length === 0) {
    return null;
  }

  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const growth = buildGrowthSeries(goals);
  const growthPath = buildLinePath(growth);

  const goalTotals: Array<{ name: string; amount: number }> = goals.map((goal) => ({
    name: goal.name,
    amount: goal.currentAmount,
  }));

  const completionForecast = [...goals]
    .filter((goal) => goal.projectedCompletionDate)
    .sort((a, b) => {
      return a.projectedCompletionDate!.getTime() - b.projectedCompletionDate!.getTime();
    })
    .slice(0, 6);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border bg-white p-5 shadow-sm shadow-slate-900/5 lg:col-span-2">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Goal progress bars</h2>
            <p className="text-sm text-muted-foreground">
              Overall funded {formatCurrency(totalCurrent)} of {formatCurrency(totalTarget)} target.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-xl border bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{goal.name}</span>
                <span className="text-muted-foreground">{goal.progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-5 shadow-sm shadow-slate-900/5">
        <h2 className="text-lg font-semibold tracking-tight">Portfolio allocation chart</h2>
        <p className="mb-4 text-sm text-muted-foreground">Current balance allocation by goal.</p>
        <div className="space-y-3">
          {goalTotals.map(({ name, amount }) => {
            const pct = totalCurrent > 0 ? (amount / totalCurrent) * 100 : 0;

            return (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-cyan-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-5 shadow-sm shadow-slate-900/5">
        <h2 className="text-lg font-semibold tracking-tight">Goal completion forecasts</h2>
        <p className="mb-4 text-sm text-muted-foreground">Earliest projected completion dates.</p>
        <div className="space-y-2 text-sm">
          {completionForecast.length === 0 ? (
            <p className="text-muted-foreground">No goals currently have a projected completion date.</p>
          ) : (
            completionForecast.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                <span className="font-medium">{goal.name}</span>
                <span className="text-muted-foreground">{formatDate(goal.projectedCompletionDate!)}</span>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-5 shadow-sm shadow-slate-900/5 lg:col-span-2">
        <h2 className="text-lg font-semibold tracking-tight">Investment growth projections over time</h2>
        <p className="mb-4 text-sm text-muted-foreground">Combined projected value of all displayed goals.</p>

        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-56 w-full rounded-xl border bg-slate-50">
          <line
            x1={CHART_PADDING_X}
            y1={CHART_HEIGHT - CHART_PADDING_Y}
            x2={CHART_WIDTH - CHART_PADDING_X}
            y2={CHART_HEIGHT - CHART_PADDING_Y}
            stroke="#cbd5e1"
          />
          <line
            x1={CHART_PADDING_X}
            y1={CHART_PADDING_Y}
            x2={CHART_PADDING_X}
            y2={CHART_HEIGHT - CHART_PADDING_Y}
            stroke="#cbd5e1"
          />

          <path d={growthPath} fill="none" stroke="#0e7490" strokeWidth="3" strokeLinecap="round" />

          {growth.slice(0, 5).map((point, index) => {
            const x = toX(point.month, growth[growth.length - 1].month || 1);

            return (
              <text
                key={`${point.month}-${index}`}
                x={x}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                M{point.month}
              </text>
            );
          })}
        </svg>
      </article>
    </section>
  );
}

function buildGrowthSeries(goals: GoalWithMetrics[]): GrowthPoint[] {
  const maxMonths = Math.max(
    12,
    Math.min(
      120,
      ...goals.map((goal) => {
        const months = monthDiff(new Date(), goal.targetDate);
        return Math.max(1, months);
      }),
    ),
  );

  const series: GrowthPoint[] = [];

  for (let month = 0; month <= maxMonths; month += 3) {
    const value = goals.reduce((sum, goal) => {
      const futureValue = simulateGoal(goal, month);
      return sum + futureValue;
    }, 0);

    series.push({ month, value });
  }

  if (series[series.length - 1]?.month !== maxMonths) {
    const endValue = goals.reduce((sum, goal) => sum + simulateGoal(goal, maxMonths), 0);
    series.push({ month: maxMonths, value: endValue });
  }

  return series;
}

function simulateGoal(goal: GoalWithMetrics, month: number): number {
  const cappedMonth = Math.max(0, month);
  const monthlyRate = goal.expectedReturn / 12;

  if (monthlyRate === 0) {
    return goal.currentAmount + goal.monthlyContribution * cappedMonth;
  }

  const multiplier = Math.pow(1 + monthlyRate, cappedMonth);
  const futurePrincipal = goal.currentAmount * multiplier;
  const futureAnnuity = goal.monthlyContribution * ((multiplier - 1) / monthlyRate);

  return futurePrincipal + futureAnnuity;
}

function buildLinePath(points: GrowthPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const maxMonth = points[points.length - 1].month || 1;
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return points
    .map((point, index) => {
      const x = toX(point.month, maxMonth);
      const y = toY(point.value, maxValue);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function toX(month: number, maxMonth: number): number {
  const chartWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  return CHART_PADDING_X + (month / maxMonth) * chartWidth;
}

function toY(value: number, maxValue: number): number {
  const chartHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  return CHART_HEIGHT - CHART_PADDING_Y - (value / maxValue) * chartHeight;
}

function monthDiff(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months;
}
