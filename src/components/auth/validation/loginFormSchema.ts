
import { z } from "zod";

export const formSchema = z.object({
  usernameOrEmail: z.string().min(3, {
    message: "Gebruikersnaam of email moet minimaal 3 karakters bevatten",
  }),
  password: z.string().min(6, {
    message: "Wachtwoord moet minimaal 6 karakters bevatten",
  }),
});

export type FormValues = z.infer<typeof formSchema>;
