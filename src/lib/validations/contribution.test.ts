import { describe, expect, it } from "vitest";
import {
  createContributionFormSchema,
  updateContributionFormSchema,
} from "@/lib/validations/contribution";

describe("createContributionFormSchema", () => {
  it("accepts valid contribution input", () => {
    const result = createContributionFormSchema.safeParse({
      goalId: "11111111-1111-1111-1111-111111111111",
      amount: "125.5",
      contributionDate: "2026-06-18",
      note: "Extra deposit",
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-positive amounts", () => {
    const result = createContributionFormSchema.safeParse({
      goalId: "11111111-1111-1111-1111-111111111111",
      amount: "0",
      contributionDate: "2026-06-18",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty contribution date", () => {
    const result = createContributionFormSchema.safeParse({
      goalId: "11111111-1111-1111-1111-111111111111",
      amount: "50",
      contributionDate: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateContributionFormSchema", () => {
  it("trims optional note", () => {
    const result = updateContributionFormSchema.safeParse({
      amount: "200",
      contributionDate: "2026-06-19",
      note: "  Yearly bonus  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe("Yearly bonus");
    }
  });
});