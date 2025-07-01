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
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="usernameOrEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-purple-dark font-medium">
              Gebruikersnaam of Email
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Voer gebruikersnaam of email in" 
                className="border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-11"
                {...field} 
              />
            </FormControl>
            <FormMessage className="text-red-600" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-purple-dark font-medium">
              Wachtwoord
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Voer wachtwoord in"
                className="border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-11"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-red-600" />
          </FormItem>
        )}
      />
      
      <div className="space-y-4">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Bezig met inloggen..." : "Inloggen"}
        </Button>
        
        <Button
          type="button"
          variant="link"
          className="w-full text-purple-600 hover:text-purple-800"
          onClick={onForgotPassword}
        >
          Wachtwoord vergeten?
        </Button>
      </div>
    </div>
  );
};

export default LoginFormFields;
