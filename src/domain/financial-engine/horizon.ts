export function estimateMonthsToGoal(
  target: number,
  current: number,
  monthlyContribution: number,
  annualRate: number,
): number {
  if (current >= target) {
    return 0;
  }

  if (annualRate === 0) {
    if (monthlyContribution <= 0) {
      return Infinity;
    }

    return Math.ceil((target - current) / monthlyContribution);
  }

  const monthlyRate = annualRate / 12;
  const denominator = current * monthlyRate + monthlyContribution;

  if (denominator <= 0) {
    return Infinity;
  }

  const numerator = target * monthlyRate + monthlyContribution;

  if (numerator <= 0) {
    return Infinity;
  }

  const months = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}
