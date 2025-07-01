import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
              <Input placeholder="Voer gebruikersnaam of email in" className="bg-white placeholder:text-purple-200" {...field} />
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
                className="bg-white placeholder:text-purple-200"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button 
        type="submit" 
        className="w-full bg-purple-dark text-white hover:bg-purple-light hover:text-white border border-purple-dark" 
        disabled={isLoading}
      >
        {isLoading ? "Inloggen..." : "Inloggen"}
      </Button>
      
      <Button
        type="button"
        className="w-full text-sm bg-purple-light text-white hover:bg-purple-dark hover:text-white border border-purple-light hover:border-purple-dark"
        onClick={onForgotPassword}
      >
        Wachtwoord vergeten?
      </Button>
    </>
  );
};

export default LoginFormFields;
