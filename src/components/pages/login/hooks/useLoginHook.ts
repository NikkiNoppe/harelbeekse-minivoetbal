
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isLoginError } from "@/lib/loginErrors";

export const useLoginHook = (onLoginSuccess: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const loginSuccess = await authLogin(usernameOrEmail, password);
      
      if (loginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      if (isLoginError(error)) {
        toast({
          title: "Login mislukt",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
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
