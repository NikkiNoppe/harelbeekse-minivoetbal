
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
      console.log('🚀 Starting login process...');
      console.log('📧 Username/Email:', usernameOrEmail);
      console.log('🔑 Password length:', password.length);
      
      // Use the corrected verify_user_password function
      console.log('🔐 Attempting password verification...');
      const { data: result, error } = await supabase
        .rpc('verify_user_password', {
          input_username_or_email: usernameOrEmail,
          input_password: password
        });

      console.log('✅ Verification result:', result);
      console.log('❌ Verification error:', error);

      if (error) {
        console.error('💥 Database error during password verification:', error);
        toast({
          title: "Login mislukt",
          description: `Database fout: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Check if we have a result and it's an array with data
      if (result && typeof Array.isArray === 'function' && Array.isArray(result) && result.length > 0) {
        const dbUser = result[0];
        console.log('🎉 Login successful for user:', dbUser);
        
        // Create user object from the database result
        const user: User = {
          id: dbUser.user_id,
          username: dbUser.username,
          password: '', // Don't expose password in the frontend
          role: dbUser.role,
          email: dbUser.email || ''
        };
        
        console.log('👤 Mapped user object:', user);
        
        // Call the auth login function
        const loginSuccess = await authLogin(usernameOrEmail, password);
        
        if (loginSuccess) {
          console.log('✨ Auth login successful');
          toast({
            title: "Ingelogd!",
            description: `Welkom ${user.username}`,
          });
          
          // Call the success callback
          onLoginSuccess();
        } else {
          console.log('❌ Auth login failed');
          toast({
            title: "Login mislukt",
            description: "Er is een fout opgetreden bij het inloggen",
            variant: "destructive",
          });
        }
      } else {
        console.log('❌ No user found or password mismatch');
        console.log('📊 Result details:', {
          result,
          isArray: typeof Array.isArray === 'function' ? Array.isArray(result) : 'Array.isArray not available',
          length: (typeof Array.isArray === 'function' && Array.isArray(result)) ? result.length : 'N/A'
        });
        
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
