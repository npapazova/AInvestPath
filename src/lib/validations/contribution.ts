import { z } from "zod";

const baseContributionFields = {
  amount: z.coerce
    .number({ invalid_type_error: "Contribution amount must be a number" })
    .positive("Contribution amount must be greater than zero"),
  contributionDate: z.string().min(1, "Contribution date is required"),
  note: z
    .string()
    .trim()
    .max(2000, "Note must be 2000 characters or fewer")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
};

export const createContributionSchema = z.object({
  goalId: z.string().uuid("A valid goal is required"),
  amount: baseContributionFields.amount,
  contributionDate: z.coerce.date({
    invalid_type_error: "Contribution date is required",
  }),
  note: baseContributionFields.note,
});

export const updateContributionSchema = z.object({
  amount: baseContributionFields.amount,
  contributionDate: z.coerce.date({
    invalid_type_error: "Contribution date is required",
  }),
  note: baseContributionFields.note,
});

export const createContributionFormSchema = z
  .object({
    goalId: z.string().min(1, "A goal is required"),
    amount: baseContributionFields.amount,
    contributionDate: baseContributionFields.contributionDate,
    note: z.string().optional(),
  })
  .transform((data) => ({
    goalId: data.goalId,
    amount: data.amount,
    contributionDate: new Date(data.contributionDate),
    note: data.note?.trim() || undefined,
  }))
  .pipe(createContributionSchema);

export const updateContributionFormSchema = z
  .object({
    amount: baseContributionFields.amount,
    contributionDate: baseContributionFields.contributionDate,
    note: z.string().optional(),
  })
  .transform((data) => ({
    amount: data.amount,
    contributionDate: new Date(data.contributionDate),
    note: data.note?.trim() || undefined,
  }))
  .pipe(updateContributionSchema);

export type CreateContributionFormOutput = z.infer<
  typeof createContributionFormSchema
>;
export type UpdateContributionFormOutput = z.infer<
  typeof updateContributionFormSchema
>;

export function parseCreateContributionFormData(formData: FormData) {
  return createContributionFormSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    contributionDate: formData.get("contributionDate"),
    note: formData.get("note") ?? undefined,
  });
}

export function parseUpdateContributionFormData(formData: FormData) {
  return updateContributionFormSchema.safeParse({
    amount: formData.get("amount"),
    contributionDate: formData.get("contributionDate"),
    note: formData.get("note") ?? undefined,
  });
}