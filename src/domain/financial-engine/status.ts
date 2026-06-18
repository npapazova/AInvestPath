import { calculateFutureValue } from "@/domain/financial-engine/math";

export type GoalStatus = "ON_TRACK" | "AT_RISK" | "COMPLETED";

export interface GoalStatusParams {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualRate: number;
  targetDate: Date;
  currentDate?: Date;
}

export interface GoalStatusResult {
  status: GoalStatus;
  completionPercentage: number;
  remainingAmount: number;
  monthsRemaining: number;
}

export function evaluateGoalStatus(
  params: GoalStatusParams,
): GoalStatusResult {
  const {
    targetAmount,
    currentAmount,
    monthlyContribution,
    annualRate,
    targetDate,
    currentDate = new Date(),
  } = params;

  if (currentAmount >= targetAmount) {
    return {
      status: "COMPLETED",
      completionPercentage: 100,
      remainingAmount: 0,
      monthsRemaining: 0,
    };
  }

  const monthsRemaining = calculateAbsoluteCalendarMonths(currentDate, targetDate);
  const futureValue = calculateFutureValue({
    initialPrincipal: currentAmount,
    monthlyContribution,
    annualRate,
    months: monthsRemaining,
  }).futureValue;

  const status = futureValue >= targetAmount ? "ON_TRACK" : "AT_RISK";
  const completionPercentage = Math.min(
    100,
    Math.max(0, (futureValue / targetAmount) * 100),
  );
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  return {
    status,
    completionPercentage,
    remainingAmount,
    monthsRemaining,
  };
}

function calculateAbsoluteCalendarMonths(firstDate: Date, secondDate: Date): number {
  const start = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
  const end = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate());

  let earlier = start;
  let later = end;

  if (start > end) {
    earlier = end;
    later = start;
  }

  let months = (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());

  if (later.getDate() < earlier.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export interface SuccessProbabilityInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
  volatility: number;
}

export function estimateSuccessProbability(
  input: SuccessProbabilityInput,
): number {
  const {
    targetAmount,
    currentAmount,
    monthlyContribution,
    annualRate,
    months,
    volatility,
  } = input;

  const projection = calculateFutureValue({
    initialPrincipal: currentAmount,
    monthlyContribution,
    annualRate,
    months,
  });

  const expectedExcess = projection.futureValue - targetAmount;
  const stdev = Math.max(volatility * Math.sqrt(Math.max(months, 1)), 1e-9);
  const zScore = expectedExcess / stdev;
  const probability = 0.5 * (1 + erf(zScore / Math.sqrt(2)));

  return Math.min(100, Math.max(0, probability * 100));
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}
