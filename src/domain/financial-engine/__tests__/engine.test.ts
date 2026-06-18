import { describe, expect, it } from "vitest";
import { calculateFutureValue, calculateRequiredContribution } from "@/domain/financial-engine/math";
import { estimateMonthsToGoal } from "@/domain/financial-engine/horizon";
import { compareScenarios } from "@/domain/financial-engine/scenarios";
import { evaluateGoalStatus, estimateSuccessProbability } from "@/domain/financial-engine/status";

describe("financial projection engine", () => {
  it("Test Case A: compounding verification matches analytical formulas", () => {
    const result = calculateFutureValue({
      initialPrincipal: 1000.0,
      monthlyContribution: 100.0,
      annualRate: 0.06,
      months: 12,
    });

    expect(result.futureValue).toBeCloseTo(2295.2340491544637, 5);
    expect(result.totalInvested).toBeCloseTo(2200.0, 2);
    expect(result.totalGains).toBeCloseTo(95.23404915446374, 5);
  });

  it("Test Case B: null-yield inputs resolve as plain additions", () => {
    const result = calculateFutureValue({
      initialPrincipal: 5000.0,
      monthlyContribution: 200.0,
      annualRate: 0.0,
      months: 24,
    });

    expect(result.futureValue).toBeCloseTo(9800.0, 2);
    expect(result.totalGains).toBeCloseTo(0.0, 2);
  });

  it("Test Case C: solve required monthly payment to achieve milestone target", () => {
    const required = calculateRequiredContribution(50000.0, 10000.0, 0.08, 60);
    expect(required).toBeCloseTo(477.72, 2);
  });

  it("Test Case D: probability is lower under higher volatility", () => {
    const safePortfolio = estimateSuccessProbability({
      targetAmount: 22246.0,
      currentAmount: 10000.0,
      monthlyContribution: 100.0,
      annualRate: 0.08,
      months: 60,
      volatility: 0.03,
    });

    const riskyPortfolio = estimateSuccessProbability({
      targetAmount: 22246.0,
      currentAmount: 10000.0,
      monthlyContribution: 100.0,
      annualRate: 0.08,
      months: 60,
      volatility: 0.15,
    });

    expect(safePortfolio).toBeGreaterThan(riskyPortfolio);
  });

  it("compares conservative, moderate, and aggressive scenarios", () => {
    const scenarios = compareScenarios(1000.0, 100.0, 12);
    expect(scenarios).toHaveLength(3);
    expect(scenarios.map((scenario) => scenario.scenarioName)).toEqual([
      "Conservative",
      "Moderate",
      "Aggressive",
    ]);
  });

  it("evaluates goal status correctly", () => {
    const currentDate = new Date("2026-01-01");
    const targetDate = new Date("2027-01-01");

    const result = evaluateGoalStatus({
      targetAmount: 13000,
      currentAmount: 10000,
      monthlyContribution: 200,
      annualRate: 0.06,
      targetDate,
      currentDate,
    });

    expect(result.monthsRemaining).toBe(12);
    expect(result.status).toBe("ON_TRACK");
    expect(result.remainingAmount).toBe(3000);
    expect(result.completionPercentage).toBeGreaterThan(0);
  });

  it("estimates months to goal for zero interest", () => {
    const months = estimateMonthsToGoal(12000, 10000, 200, 0);
    expect(months).toBe(10);
  });
});
