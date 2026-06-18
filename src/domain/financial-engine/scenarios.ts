import { calculateFutureValue } from "@/domain/financial-engine/math";

export interface ScenarioOutput {
  scenarioName: string;
  annualRate: number;
  futureValue: number;
  totalInvested: number;
  totalGains: number;
}

const SCENARIOS = [
  { scenarioName: "Conservative", annualRate: 0.04 },
  { scenarioName: "Moderate", annualRate: 0.07 },
  { scenarioName: "Aggressive", annualRate: 0.10 },
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
