
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";
import { useAuth } from "@/components/login/AuthProvider";

export const useLoginHook = (onLoginSuccess: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: usernameOrEmail,
        input_password: password
      });
      if (error) {
        toast({ title: "Login mislukt", description: `Database fout: ${error.message}`, variant: "destructive" });
        return;
      }
      if (result && Array.isArray(result) && result.length > 0) {
        const dbUser = result[0];
        const user: User = {
          id: dbUser.user_id,
          username: dbUser.username,
          password: '',
          role: dbUser.role,
          email: dbUser.email || ''
        };
        const loginSuccess = await authLogin(usernameOrEmail, password);
        if (loginSuccess) {
          toast({ title: "Ingelogd!", description: `Welkom ${user.username}` });
          onLoginSuccess();
        } else {
          toast({ title: "Login mislukt", description: "Er is een fout opgetreden bij het inloggen", variant: "destructive" });
        }
      } else {
        toast({ title: "Login mislukt", description: "Gebruikersnaam/e-mail of wachtwoord is incorrect", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Login mislukt", description: "Er is een onverwachte fout opgetreden tijdens het inloggen", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};
