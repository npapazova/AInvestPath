import { describe, expect, it } from "vitest";
import { createGoalSchema, goalFormSchema } from "@/lib/validations/goal";

function futureDate(daysFromNow = 365): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

describe("createGoalSchema", () => {
  it("accepts valid goal input", () => {
    const result = createGoalSchema.safeParse({
      name: "Retirement Fund",
      targetAmount: 150000,
      currentAmount: 10000,
      monthlyContribution: 500,
      expectedReturn: 0.07,
      targetDate: futureDate(),
      priority: "HIGH",
      notes: "Long-term savings",
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative target amount", () => {
    const result = createGoalSchema.safeParse({
      name: "Invalid Goal",
      targetAmount: -1000,
      currentAmount: 0,
      monthlyContribution: 100,
      expectedReturn: 0.05,
      targetDate: futureDate(),
      priority: "MEDIUM",
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative current amount", () => {
    const result = createGoalSchema.safeParse({
      name: "Invalid Goal",
      targetAmount: 50000,
      currentAmount: -100,
      monthlyContribution: 100,
      expectedReturn: 0.05,
      targetDate: futureDate(),
      priority: "MEDIUM",
    });

    expect(result.success).toBe(false);
  });

  it("rejects target date in the past", () => {
    const result = createGoalSchema.safeParse({
      name: "Past Goal",
      targetAmount: 50000,
      currentAmount: 1000,
      monthlyContribution: 100,
      expectedReturn: 0.05,
      targetDate: new Date("2020-01-01"),
      priority: "LOW",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("targetDate"))).toBe(
        true,
      );
    }
  });

  it("rejects target amount not greater than current amount", () => {
    const result = createGoalSchema.safeParse({
      name: "Already There",
      targetAmount: 10000,
      currentAmount: 10000,
      monthlyContribution: 0,
      expectedReturn: 0.05,
      targetDate: futureDate(),
      priority: "MEDIUM",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("targetAmount"))).toBe(
        true,
      );
    }
  });

  it("rejects invalid priority", () => {
    const result = createGoalSchema.safeParse({
      name: "Bad Priority",
      targetAmount: 50000,
      currentAmount: 1000,
      monthlyContribution: 100,
      expectedReturn: 0.05,
      targetDate: futureDate(),
      priority: "URGENT",
    });

    expect(result.success).toBe(false);
  });
});

describe("goalFormSchema", () => {
  it("converts percentage return to decimal ratio", () => {
    const result = goalFormSchema.safeParse({
      name: "College Fund",
      targetAmount: "50000",
      currentAmount: "5000",
      monthlyContribution: "300",
      expectedReturnPercent: "7",
      targetDate: futureDate().toISOString().slice(0, 10),
      priority: "HIGH",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expectedReturn).toBeCloseTo(0.07, 5);
    }
  });
});
