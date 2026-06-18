export interface ProjectionPoint {
  date: Date;
  balance: number;
  contributions: number;
  interestEarned: number;
}

export interface ProjectionResult {
  months: number;
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  timeline: ProjectionPoint[];
}

export interface ProjectionInput {
  currentAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  startDate: Date;
  targetDate: Date;
}

const EPSILON = 1e-12;

export function calculateMonthlyRate(annualReturn: number): number {
  return Math.pow(1 + annualReturn, 1 / 12) - 1;
}

export function calculateCompleteMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  let months = yearDiff * 12 + monthDiff;

  if (end.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    throw new RangeError("Target date must be the same or after the start date");
  }

  return months;
}

export function calculateFutureValue(
  currentAmount: number,
  monthlyContribution: number,
  annualReturn: number,
  months: number,
): number {
  if (currentAmount < 0) {
    throw new RangeError("Current amount cannot be negative");
  }

  if (monthlyContribution < 0) {
    throw new RangeError("Monthly contribution cannot be negative");
  }

  if (months < 0) {
    throw new RangeError("Months must be zero or greater");
  }

  const monthlyRate = calculateMonthlyRate(annualReturn);

  if (Math.abs(monthlyRate) < EPSILON) {
    return currentAmount + monthlyContribution * months;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const contributionsFutureValue =
    monthlyContribution * ((compoundFactor - 1) / monthlyRate);

  return currentAmount * compoundFactor + contributionsFutureValue;
}

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function buildMonthlyProjection(input: ProjectionInput): ProjectionResult {
  const { currentAmount, monthlyContribution, annualReturn, startDate, targetDate } = input;

  const months = calculateCompleteMonthsBetween(startDate, targetDate);
  const monthlyRate = calculateMonthlyRate(annualReturn);

  let balance = currentAmount;
  let totalContributions = 0;
  let totalInterest = 0;

  const timeline: ProjectionPoint[] = [
    {
      date: new Date(startDate),
      balance: Number(balance.toFixed(2)),
      contributions: 0,
      interestEarned: 0,
    },
  ];

  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const interestEarned = balance * monthlyRate;
    balance += interestEarned + monthlyContribution;
    totalContributions += monthlyContribution;
    totalInterest += interestEarned;

    timeline.push({
      date: addMonthsToDate(startDate, monthIndex),
      balance: Number(balance.toFixed(2)),
      contributions: Number(monthlyContribution.toFixed(2)),
      interestEarned: Number(interestEarned.toFixed(2)),
    });
  }

  return {
    months,
    futureValue: Number(balance.toFixed(2)),
    totalContributions: Number(totalContributions.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    timeline,
  };
}
