import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/form";
import { FormValues } from "../validation/loginFormSchema";

interface LoginFormFieldsProps {
  form: UseFormReturn<FormValues>;
  isLoading: boolean;
  onForgotPassword: () => void;
}

const LoginFormFields: React.FC<LoginFormFieldsProps> = ({ 
  form, 
  isLoading, 
  onForgotPassword 
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="usernameOrEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-purple-dark">Gebruikersnaam of Email</FormLabel>
            <FormControl>
              <Input placeholder="Voer gebruikersnaam of email in" {...field} />
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
              <Input
                type="password"
                placeholder="Voer wachtwoord in"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Inloggen..." : "Inloggen"}
      </Button>
      
      <Button
        type="button"
        variant="link"
        className="w-full text-sm text-white hover:text-purple-light"
        onClick={onForgotPassword}
      >
        Wachtwoord vergeten?
      </Button>
    </>
  );
};

export default LoginFormFields;
