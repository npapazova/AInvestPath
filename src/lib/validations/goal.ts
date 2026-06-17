import { z } from "zod";
import { GOAL_PRIORITIES } from "@/lib/constants/goal";

const prioritySchema = z.enum(GOAL_PRIORITIES);

const baseGoalFields = {
  name: z
    .string()
    .trim()
    .min(1, "Goal name is required")
    .max(150, "Goal name must be 150 characters or fewer"),
  targetAmount: z
    .number({ invalid_type_error: "Target amount must be a number" })
    .positive("Target amount must be greater than zero"),
  currentAmount: z
    .number({ invalid_type_error: "Current amount must be a number" })
    .min(0, "Current amount cannot be negative"),
  monthlyContribution: z
    .number({ invalid_type_error: "Monthly contribution must be a number" })
    .min(0, "Monthly contribution cannot be negative"),
  expectedReturn: z
    .number({ invalid_type_error: "Expected return must be a number" })
    .min(-0.99, "Expected return must be at least -99%")
    .max(2, "Expected return cannot exceed 200%"),
  targetDate: z.coerce.date({
    invalid_type_error: "Target date is required",
  }),
  priority: prioritySchema,
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or fewer")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
};

function validateTargetDateInFuture(
  data: { targetDate: Date; currentAmount: number; targetAmount: number },
  ctx: z.RefinementCtx,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(data.targetDate);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate <= today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Target date must be in the future",
      path: ["targetDate"],
    });
  }

  if (data.targetAmount <= data.currentAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Target amount must be greater than current amount",
      path: ["targetAmount"],
    });
  }
}

export const createGoalSchema = z
  .object(baseGoalFields)
  .superRefine(validateTargetDateInFuture);

export const updateGoalSchema = z
  .object(baseGoalFields)
  .superRefine(validateTargetDateInFuture);

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

/** Form payload uses percentage (e.g. 7 for 7%) instead of decimal ratio. */
export const goalFormSchema = z
  .object({
    name: baseGoalFields.name,
    targetAmount: z.coerce
      .number({ invalid_type_error: "Target amount must be a number" })
      .positive("Target amount must be greater than zero"),
    currentAmount: z.coerce
      .number({ invalid_type_error: "Current amount must be a number" })
      .min(0, "Current amount cannot be negative"),
    monthlyContribution: z.coerce
      .number({ invalid_type_error: "Monthly contribution must be a number" })
      .min(0, "Monthly contribution cannot be negative"),
    expectedReturnPercent: z.coerce
      .number({ invalid_type_error: "Expected return must be a number" })
      .min(-99, "Expected return must be at least -99%")
      .max(200, "Expected return cannot exceed 200%"),
    targetDate: z.string().min(1, "Target date is required"),
    priority: prioritySchema,
    notes: z.string().optional(),
  })
  .transform((data) => ({
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount,
    monthlyContribution: data.monthlyContribution,
    expectedReturn: data.expectedReturnPercent / 100,
    targetDate: new Date(data.targetDate),
    priority: data.priority,
    notes: data.notes?.trim() || undefined,
  }))
  .pipe(createGoalSchema);

export type GoalFormInput = z.input<typeof goalFormSchema>;
export type GoalFormOutput = z.infer<typeof goalFormSchema>;

export function parseGoalFormData(formData: FormData) {
  return goalFormSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
    monthlyContribution: formData.get("monthlyContribution"),
    expectedReturnPercent: formData.get("expectedReturnPercent"),
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority"),
    notes: formData.get("notes") ?? undefined,
  });
}

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
