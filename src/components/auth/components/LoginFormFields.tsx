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
            <FormLabel>Gebruikersnaam of Email</FormLabel>
            <FormControl>
              <Input placeholder="Voer gebruikersnaam of email in" className="input-enhanced" {...field} />
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
            <FormLabel>Wachtwoord</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Voer wachtwoord in"
                className="input-enhanced"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button 
        type="submit" 
        variant="purple"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
      >
        Inloggen
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onForgotPassword}
      >
        Wachtwoord vergeten?
      </Button>
    </>
  );
};

export default LoginFormFields;
