import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoginFormData } from "../validation/loginFormSchema";

interface LoginFieldsProps {
  form: UseFormReturn<LoginFormData>;
  isLoading: boolean;
}

const LoginFields: React.FC<LoginFieldsProps> = ({ form, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
  <>
    <FormField
      control={form.control}
      name="usernameOrEmail"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-brand-dark">Gebruikersnaam of Email</FormLabel>
          <FormControl>
            <Input 
              placeholder="Voer gebruikersnaam of email in" 
              className="modal__input bg-white placeholder:text-brand-200" 
              disabled={isLoading}
              {...field} 
            />
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
          <FormLabel className="text-brand-dark">Wachtwoord</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Voer wachtwoord in"
                className="modal__input bg-white pr-11 placeholder:text-brand-200"
                disabled={isLoading}
                autoComplete="current-password"
                {...field}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                className="absolute right-0 top-0 flex h-full min-h-[44px] min-w-[44px] items-center justify-center rounded-r-md text-brand-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
  );
};

export default LoginFields;
