import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoginFormValues } from "../validation/loginFormSchema";

interface LoginFormFieldsProps {
  form: UseFormReturn<LoginFormValues>;
  isLoading: boolean;
  onForgotPassword: () => void;
}

const LoginFormFields: React.FC<LoginFormFieldsProps> = ({ form, isLoading, onForgotPassword }) => (
  <>
    <FormField
      control={form.control}
      name="usernameOrEmail"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-purple-dark">Gebruikersnaam of Email</FormLabel>
          <FormControl>
            <Input placeholder="Voer gebruikersnaam of email in" className="modal__input bg-white placeholder:text-purple-200" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-purple-dark">Wachtwoord</FormLabel>
          <FormControl>
            <Input type="password" placeholder="Voer wachtwoord in" className="modal__input bg-white placeholder:text-purple-200" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);

export default LoginFormFields;
