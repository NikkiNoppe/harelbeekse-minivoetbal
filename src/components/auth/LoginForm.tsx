
import React from "react";
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
import { useState } from "react";
import { Shield, User } from "lucide-react";

// Define the form schema with Zod for validation
const formSchema = z.object({
  username: z.string().min(3, {
    message: "Gebruikersnaam moet minimaal 3 karakters bevatten",
  }),
  password: z.string().min(6, {
    message: "Wachtwoord moet minimaal 6 karakters bevatten",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Mock users for demonstration
const MOCK_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "team1", password: "team123", role: "team", teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team", teamId: 2 },
];

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.username === data.username && u.password === data.password
      );

      setIsLoading(false);

      if (user) {
        toast({
          title: "Ingelogd!",
          description: `Welkom ${user.username}`,
        });
        
        // Store user in localStorage
        localStorage.setItem("currentUser", JSON.stringify(user));
        
        // Call the success callback
        onLoginSuccess(user);
      } else {
        toast({
          title: "Login mislukt",
          description: "Ongeldige gebruikersnaam of wachtwoord",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Voetbal Arena Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gebruikersnaam</FormLabel>
                  <FormControl>
                    <Input placeholder="Voer gebruikersnaam in" {...field} />
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
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>Admin: admin / admin123</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield size={14} />
          <span>Team: team1 / team123</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
