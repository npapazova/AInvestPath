import { describe, expect, it } from "vitest";
import {
  buildMonthlyProjection,
  calculateFutureValue,
  calculateMonthlyRate,
  calculateCompleteMonthsBetween,
  ProjectionInput,
} from "@/domain/financial-engine/compound-projection";

describe("compound projection engine", () => {
  it("calculates monthly rate from annual return", () => {
    expect(calculateMonthlyRate(0.12)).toBeCloseTo(0.00948879, 8);
  });

  it("calculates complete months between dates", () => {
    const months = calculateCompleteMonthsBetween(
      new Date("2026-01-15"),
      new Date("2026-04-14"),
    );

    expect(months).toBe(2);
  });

  it("returns zero months for same day target date", () => {
    const months = calculateCompleteMonthsBetween(
      new Date("2026-01-01"),
      new Date("2026-01-01"),
    );

    expect(months).toBe(0);
  });

  it("calculates future value with contributions and compound interest", () => {
    const futureValue = calculateFutureValue(10000, 500, 0.07, 12);
    const monthlyRate = Math.pow(1.07, 1 / 12) - 1;
    const compoundFactor = Math.pow(1 + monthlyRate, 12);
    const expected = 10000 * compoundFactor + 500 * ((compoundFactor - 1) / monthlyRate);

    expect(futureValue).toBeCloseTo(expected, 2);
  });

  it("builds a monthly projection timeline", () => {
    const input: ProjectionInput = {
      currentAmount: 2000,
      monthlyContribution: 200,
      annualReturn: 0.06,
      startDate: new Date("2026-01-01"),
      targetDate: new Date("2027-01-01"),
    };

    const result = buildMonthlyProjection(input);

    expect(result.months).toBe(12);
    expect(result.timeline).toHaveLength(13);
    expect(result.futureValue).toBeGreaterThan(2000);
    expect(result.totalContributions).toBe(2400);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.timeline[0].balance).toBe(2000);
    expect(result.timeline[result.timeline.length - 1].date.getMonth()).toBe(0);
  });
});
