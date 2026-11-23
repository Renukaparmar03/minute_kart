import { z } from "zod";
import { ValidationError } from "../../core/auth/errors.js";

const schema = z.object({
  accountChoiceToken: z.string().min(1, "Account choice token is required"),
  action: z.enum(["restore", "new"], {
    errorMap: () => ({ message: "Action must be 'restore' or 'new'" }),
  }),
  ref: z.string().trim().max(64).optional().or(z.literal("")),
  fcmToken: z.string().optional(),
  platform: z.enum(["web", "mobile"]).optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
});

export const validateDeletedAccountChoiceDto = (body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }
  return result.data;
};
