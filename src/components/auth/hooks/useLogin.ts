
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";
import { useAuth } from "@/components/auth/AuthProvider";

export const useLogin = (onLoginSuccess: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', usernameOrEmail);
      console.log('Password length:', password.length);
      
      // First check if user exists
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('user_id, username, email')
        .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
        .maybeSingle();

      console.log('User check result:', userCheck);
      console.log('User check error:', userCheckError);

      if (userCheckError) {
        console.error('Database error during user check:', userCheckError);
        toast({
          title: "Login mislukt",
          description: "Er is een fout opgetreden bij het controleren van de gebruiker",
          variant: "destructive",
        });
        return;
      }

      if (!userCheck) {
        console.log('User not found for:', usernameOrEmail);
        toast({
          title: "Login mislukt",
          description: "Gebruiker niet gevonden. Controleer je gebruikersnaam of e-mailadres.",
          variant: "destructive",
        });
        return;
      }

      console.log('User found, attempting password verification for user_id:', userCheck.user_id);

      // Now verify password with the database function
      const { data: result, error } = await supabase
        .rpc('verify_user_password', {
          input_username_or_email: usernameOrEmail,
          input_password: password
        });

      console.log('Password verification result:', result);
      console.log('Password verification error:', error);

      if (error) {
        console.error('Database error during password verification:', error);
        toast({
          title: "Login mislukt",
          description: "Er is een fout opgetreden bij het verifiëren van het wachtwoord",
          variant: "destructive",
        });
        return;
      }

      // Check if we have a result and it's an array with data
      if (result && Array.isArray(result) && result.length > 0) {
        // Get the first result from the array
        const dbUser = result[0];
        console.log('Login successful for user:', dbUser);
        
        // Create user object from the database result
        const user: User = {
          id: dbUser.user_id,
          username: dbUser.username,
          password: '', // Don't expose password in the frontend
          role: dbUser.role,
          email: dbUser.email || ''
        };
        
        console.log('Mapped user object:', user);
        
        // Call the auth login function
        const loginSuccess = await authLogin(usernameOrEmail, password);
        
        if (loginSuccess) {
          toast({
            title: "Ingelogd!",
            description: `Welkom ${user.username}`,
          });
          
          // Call the success callback
          onLoginSuccess();
        }
      } else {
        // User exists but password is wrong
        console.log('Password verification failed for existing user');
        toast({
          title: "Login mislukt",
          description: "Ongeldig wachtwoord. Controleer je wachtwoord en probeer opnieuw.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
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
