
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useLoginHook = (onLoginSuccess: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      // Use only the AuthProvider's login method - no double verification
      const loginSuccess = await authLogin(usernameOrEmail, password);
      
      if (loginSuccess) {
        toast({ 
          title: "Ingelogd!", 
          description: "Je bent succesvol ingelogd" 
        });
        onLoginSuccess();
      } else {
        toast({ 
          title: "Login mislukt", 
          description: "Gebruikersnaam/e-mail of wachtwoord is incorrect", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ 
        title: "Login mislukt", 
        description: "Er is een onverwachte fout opgetreden tijdens het inloggen", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};
