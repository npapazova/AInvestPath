import { compareScenarios } from "@/domain/financial-engine/scenarios";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";

type ScenarioSimulationProps = {
  currentAmount: number;
  monthlyContribution: number;
  targetAmount: number;
  monthsRemaining: number;
};

export function ScenarioSimulation({
  currentAmount,
  monthlyContribution,
  targetAmount,
  monthsRemaining,
}: ScenarioSimulationProps) {
  const scenarios = compareScenarios(
    currentAmount,
    monthlyContribution,
    monthsRemaining,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return simulations</CardTitle>
        <CardDescription>
          Conservative, moderate, and aggressive outcomes projected over {monthsRemaining} month
          {monthsRemaining === 1 ? "" : "s"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const isOnTrack = scenario.futureValue >= targetAmount;
            const shortfall = Math.max(0, targetAmount - scenario.futureValue);

            return (
              <div
                key={scenario.scenarioName}
                className="rounded-xl border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{scenario.scenarioName}</p>
                    <p className="text-xs text-muted-foreground">
                      Annual return {formatPercent(scenario.annualRate)}
                    </p>
                  </div>
                  <Badge variant={isOnTrack ? "outline" : "secondary"}>
                    {isOnTrack ? "On track" : "At risk"}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Projected value</span>
                    <span className="font-semibold">
                      {formatCurrency(scenario.futureValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Total invested</span>
                    <span>{formatCurrency(scenario.totalInvested)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Projected gains</span>
                    <span className="text-emerald-600">
                      {formatCurrency(scenario.totalGains)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Gap to target</span>
                    <span>{formatCurrency(shortfall)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
