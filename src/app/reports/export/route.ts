import { getAllContributions } from "@/app/actions/contributions";
import { getGoals } from "@/app/actions/goals";
import { calculateCompleteMonthsBetween } from "@/domain/financial-engine/compound-projection";
import { compareScenarios } from "@/domain/financial-engine/scenarios";
import { enrichGoalsWithMetrics } from "@/lib/goals";

type ComputedGoalStatus = "COMPLETED" | "ON_TRACK" | "AT_RISK";

type GoalExportRow = {
  id: string;
  name: string;
  targetDate: Date;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  expectedReturn: number;
  progressPercentage: number;
  projectedValueAtTargetDate: number;
  projectedCompletionDate: Date | null;
  status: ComputedGoalStatus;
};

export async function GET() {
  const [goals, contributions] = await Promise.all([
    getGoals({ status: "all" }),
    getAllContributions(),
  ]);

  const enrichedGoals = enrichGoalsWithMetrics(goals);

  const goalRows: GoalExportRow[] = enrichedGoals.map((goal) => {
    const status: ComputedGoalStatus =
      goal.currentAmount >= goal.targetAmount
        ? "COMPLETED"
        : goal.projectedValueAtTargetDate >= goal.targetAmount
          ? "ON_TRACK"
          : "AT_RISK";

    return {
      id: goal.id,
      name: goal.name,
      targetDate: goal.targetDate,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      monthlyContribution: goal.monthlyContribution,
      expectedReturn: goal.expectedReturn,
      progressPercentage: goal.progressPercentage,
      projectedValueAtTargetDate: goal.projectedValueAtTargetDate,
      projectedCompletionDate: goal.projectedCompletionDate,
      status,
    };
  });

  const totalCurrent = goalRows.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goalRows.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const completedCount = goalRows.filter((goal) => goal.status === "COMPLETED").length;
  const onTrackCount = goalRows.filter((goal) => goal.status === "ON_TRACK").length;
  const atRiskCount = goalRows.filter((goal) => goal.status === "AT_RISK").length;

  const completionRate = goalRows.length > 0 ? (completedCount / goalRows.length) * 100 : 0;
  const forecastHitRate =
    goalRows.length > 0 ? ((completedCount + onTrackCount) / goalRows.length) * 100 : 0;
  const averageProgress =
    goalRows.length > 0
      ? goalRows.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goalRows.length
      : 0;
  const portfolioCompletion = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const scenarioTotals = goalRows.reduce<
    Record<string, { futureValue: number; totalGains: number }>
  >((accumulator, goal) => {
    const monthsToTarget = getMonthsToTarget(goal.targetDate, new Date());
    const outcomes = compareScenarios(
      goal.currentAmount,
      goal.monthlyContribution,
      monthsToTarget,
    );

    outcomes.forEach((outcome) => {
      const current = accumulator[outcome.scenarioName] ?? {
        futureValue: 0,
        totalGains: 0,
      };

      accumulator[outcome.scenarioName] = {
        futureValue: current.futureValue + outcome.futureValue,
        totalGains: current.totalGains + outcome.totalGains,
      };
    });

    return accumulator;
  }, {});

  const lines: string[] = [];

  lines.push("Section,Metric,Value");
  lines.push(csvRow(["Completion Statistics", "Total Goals", goalRows.length]));
  lines.push(csvRow(["Completion Statistics", "Completed Goals", completedCount]));
  lines.push(csvRow(["Completion Statistics", "On Track Goals", onTrackCount]));
  lines.push(csvRow(["Completion Statistics", "At Risk Goals", atRiskCount]));
  lines.push(csvRow(["Completion Statistics", "Completion Rate (%)", toFixed(completionRate)]));
  lines.push(csvRow(["Completion Statistics", "Forecast Hit Rate (%)", toFixed(forecastHitRate)]));
  lines.push(csvRow(["Completion Statistics", "Average Goal Progress (%)", toFixed(averageProgress)]));
  lines.push(csvRow(["Completion Statistics", "Portfolio Completion (%)", toFixed(portfolioCompletion)]));
  lines.push("");

  lines.push(
    "Goal Id,Goal Name,Status,Current Amount,Target Amount,Monthly Contribution,Expected Return (%),Progress (%),Projected Value At Target,Projected Completion Date,Target Date",
  );
  goalRows.forEach((goal) => {
    lines.push(
      csvRow([
        goal.id,
        goal.name,
        goal.status,
        toMoney(goal.currentAmount),
        toMoney(goal.targetAmount),
        toMoney(goal.monthlyContribution),
        toPercent(goal.expectedReturn),
        toFixed(goal.progressPercentage),
        toMoney(goal.projectedValueAtTargetDate),
        goal.projectedCompletionDate ? toIsoDate(goal.projectedCompletionDate) : "Not reachable",
        toIsoDate(goal.targetDate),
      ]),
    );
  });
  lines.push("");

  lines.push("Contribution Id,Goal Id,Goal Name,Contribution Date,Amount,Note");
  contributions.forEach((contribution) => {
    lines.push(
      csvRow([
        contribution.id,
        contribution.goal.id,
        contribution.goal.name,
        toIsoDate(contribution.contributionDate),
        toMoney(contribution.amount),
        contribution.note ?? "",
      ]),
    );
  });
  lines.push("");

  lines.push("Scenario,Portfolio Future Value,Portfolio Total Gains");
  Object.entries(scenarioTotals).forEach(([scenarioName, totals]) => {
    lines.push(csvRow([scenarioName, toMoney(totals.futureValue), toMoney(totals.totalGains)]));
  });

  const csv = lines.join("\n");
  const filename = `ainvestpath-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvRow(values: Array<string | number>): string {
  return values.map((value) => escapeCsv(String(value))).join(",");
}

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');

  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

function toFixed(value: number): string {
  return value.toFixed(2);
}

function toPercent(rate: number): string {
  return (rate * 100).toFixed(2);
}

function getMonthsToTarget(targetDate: Date, now: Date): number {
  if (targetDate <= now) {
    return 0;
  }

  try {
    return calculateCompleteMonthsBetween(now, targetDate);
  } catch {
    return 0;
  }
}
