export interface CompoundInterestInput {
  initialPrincipal: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
}

export interface ProjectionResult {
  futureValue: number;
  totalInvested: number;
  totalGains: number;
}

export function calculateFutureValue(
  input: CompoundInterestInput,
): ProjectionResult {
  const { initialPrincipal, monthlyContribution, annualRate, months } = input;

  if (months < 0) {
    throw new RangeError("Months must be zero or greater");
  }

  const totalInvested = initialPrincipal + monthlyContribution * months;

  if (annualRate === 0) {
    const futureValue = initialPrincipal + monthlyContribution * months;
    return {
      futureValue,
      totalInvested,
      totalGains: futureValue - totalInvested,
    };
  }

  const monthlyRate = annualRate / 12;
  const multiplier = Math.pow(1 + monthlyRate, months);
  const futurePrincipal = initialPrincipal * multiplier;
  const futureAnnuity = monthlyContribution * ((multiplier - 1) / monthlyRate);
  const futureValue = futurePrincipal + futureAnnuity;

  return {
    futureValue,
    totalInvested,
    totalGains: futureValue - totalInvested,
  };
}

export function calculateRequiredContribution(
  target: number,
  current: number,
  annualRate: number,
  months: number,
): number {
  if (months < 0) {
    throw new RangeError("Months must be zero or greater");
  }

  if (target <= current) {
    return 0;
  }

  if (months === 0) {
    return Infinity;
  }

  if (annualRate === 0) {
    return (target - current) / months;
  }

  const monthlyRate = annualRate / 12;
  const multiplier = Math.pow(1 + monthlyRate, months);
  const annuityDenominator = (multiplier - 1) / monthlyRate;

  if (annuityDenominator === 0) {
    return Infinity;
  }

  return (target - current * multiplier) / annuityDenominator;
}
