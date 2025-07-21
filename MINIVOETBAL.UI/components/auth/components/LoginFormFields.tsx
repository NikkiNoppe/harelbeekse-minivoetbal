import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { FormValues } from '../../auth/validation/loginFormSchema';

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
        className="btn-dark" 
        disabled={isLoading}
      >
        {isLoading ? "Inloggen..." : "Inloggen"}
      </Button>
      
      <Button
        type="button"
        className="btn-light"
        onClick={onForgotPassword}
      >
        Wachtwoord vergeten?
      </Button>
    </>
  );
};

export default LoginFormFields;
