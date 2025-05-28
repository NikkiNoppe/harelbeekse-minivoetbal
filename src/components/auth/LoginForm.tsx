
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, User as UserIcon } from "lucide-react";
import { User } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import ForgotPasswordDialog from "./ForgotPasswordDialog";

const formSchema = z.object({
  usernameOrEmail: z.string().min(3, {
    message: "Gebruikersnaam of email moet minimaal 3 karakters bevatten",
  }),
  password: z.string().min(6, {
    message: "Wachtwoord moet minimaal 6 karakters bevatten",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', data.usernameOrEmail);
      
      // Use the database function to verify user with hashed password
      const { data: result, error } = await supabase
        .rpc('verify_user_password', {
          input_username_or_email: data.usernameOrEmail,
          input_password: data.password
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

      if (result && result.length > 0) {
        // Access the user_record from the nested structure
        const dbResult = result[0];
        const dbUser = dbResult.user_record;
        console.log('Database user:', dbUser);
        
        const user: User = {
          id: dbUser.user_id,
          username: dbUser.username,
          password: '', // Don't expose password in the frontend
          role: dbUser.role,
          email: dbUser.email
        };
        
        toast({
          title: "Ingelogd!",
          description: `Welkom ${user.username}`,
        });
        
        // Call the success callback
        onLoginSuccess(user);
      } else {
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

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="usernameOrEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gebruikersnaam of Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Voer gebruikersnaam of email in" {...field} />
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Inloggen..." : "Inloggen"}
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground"
                onClick={() => setForgotPasswordOpen(true)}
              >
                Wachtwoord vergeten?
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <UserIcon size={14} />
            <span>Admin: admin / admin123</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={14} />
            <span>Team: team1 / team123</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={14} />
            <span>Scheidsrechter: referee / referee123</span>
          </div>
        </CardFooter>
      </Card>

      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
      />
    </>
  );
};

export default LoginForm;
