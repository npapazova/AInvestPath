import { calculateFutureValue } from "@/domain/financial-engine/math";

export type ScenarioName = "Conservative" | "Moderate" | "Aggressive";

export interface ScenarioDefinition {
  scenarioName: ScenarioName;
  annualRate: number;
}

export interface ScenarioOutput {
  scenarioName: ScenarioName;
  annualRate: number;
  futureValue: number;
  totalInvested: number;
  totalGains: number;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  { scenarioName: "Conservative", annualRate: 0.04 },
  { scenarioName: "Moderate", annualRate: 0.08 },
  { scenarioName: "Aggressive", annualRate: 0.12 },
] as const;

export function compareScenarios(
  initialPrincipal: number,
  monthlyContribution: number,
  months: number,
): ScenarioOutput[] {
  return SCENARIOS.map(({ scenarioName, annualRate }) => {
    const projection = calculateFutureValue({
      initialPrincipal,
      monthlyContribution,
      annualRate,
      months,
    });

    return {
      scenarioName,
      annualRate,
      futureValue: projection.futureValue,
      totalInvested: projection.totalInvested,
      totalGains: projection.totalGains,
    };
  });
}
