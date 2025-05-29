
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";

export const useLogin = (onLoginSuccess: (user: User) => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', usernameOrEmail);
      
      // Use the database function to verify user with hashed password
      const { data: result, error } = await supabase
        .rpc('verify_user_password', {
          input_username_or_email: usernameOrEmail,
          input_password: password
        });

      console.log('Login result:', result);
      console.log('Login error:', error);

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Login mislukt",
          description: "Er is een fout opgetreden bij het inloggen",
          variant: "destructive",
        });
        return;
      }

      // Check if we have a result and it's an array with data
      if (result && Array.isArray(result) && result.length > 0) {
        // Get the first result from the array
        const userResult = result[0];
        console.log('User result:', userResult);
        
        // Access the user_record from the nested structure
        const dbUser = userResult.user_record;
        console.log('Database user:', dbUser);
        
        // Create user object from the user_record
        const user: User = {
          id: dbUser.user_id,
          username: dbUser.username,
          password: '', // Don't expose password in the frontend
          role: dbUser.role,
          email: dbUser.email || ''
        };
        
        console.log('Mapped user:', user);
        
        toast({
          title: "Ingelogd!",
          description: `Welkom ${user.username}`,
        });
        
        // Call the success callback
        onLoginSuccess(user);
      } else {
        console.log('No valid user found in result');
        toast({
          title: "Login mislukt",
          description: "Ongeldige gebruikersnaam/email of wachtwoord",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login mislukt",
        description: "Er is een fout opgetreden bij het inloggen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};
