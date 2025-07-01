import { useState } from "react";
import { useToast } from "@shared/hooks/use-toast";
import { supabase } from "@shared/integrations/supabase/client";
import { User } from "@shared/types/auth";
import { useAuth } from "../AuthProvider";

export const useLogin = (onLoginSuccess: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting login process...');
      console.log('📧 Username/Email:', usernameOrEmail);
      console.log('🔑 Password length:', password.length);
      
      // Use the AuthProvider login function which handles bcrypt properly
      console.log('🔐 Attempting login via AuthProvider...');
      const loginSuccess = await authLogin(usernameOrEmail, password);
      
      if (loginSuccess) {
        console.log('✨ Auth login successful');
        toast({
          title: "Ingelogd!",
          description: `Welkom terug!`,
        });
        
        // Call the success callback
        onLoginSuccess();
      } else {
        console.log('❌ Auth login failed');
        toast({
          title: "Login mislukt",
          description: "Gebruikersnaam/e-mail of wachtwoord is incorrect",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💀 Unexpected login error:', error);
      toast({
        title: "Login mislukt",
        description: "Er is een onverwachte fout opgetreden tijdens het inloggen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};
