
import { z } from "zod";

export const loginValidationSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(3, "Gebruikersnaam of email moet minimaal 3 karakters bevatten")
    .max(50, "Gebruikersnaam of email mag maximaal 50 karakters bevatten")
    .trim(),
  password: z
    .string()
    .min(6, "Wachtwoord moet minimaal 6 karakters bevatten")
    .max(100, "Wachtwoord mag maximaal 100 karakters bevatten"),
});

export type LoginFormData = z.infer<typeof loginValidationSchema>;
