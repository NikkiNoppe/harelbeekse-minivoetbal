
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { useLogin } from "./hooks/useLogin";
import LoginFormFields from "./components/LoginFormFields";
import TestCredentialsFooter from "./components/TestCredentialsFooter";
import { formSchema, FormValues } from "./validation/loginFormSchema";
import { ZodError } from "zod";
import { useToast } from "@/components/ui/use-toast";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess
}) => {
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const {
    login,
    isLoading
  } = useLogin(onLoginSuccess);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: ""
    }
  });

  const { toast } = useToast();

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.usernameOrEmail, data.password);
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Validatie fout",
          description: error.issues.map(e => e.message).join(", "),
          variant: "destructive"
        });
      } else {
        toast({
          title: "Fout bij inloggen",
          description: "Er is een onverwachte fout opgetreden bij het inloggen.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-lg border-purple-light">
        <CardHeader className="bg-purple-100 py-4">
          <CardTitle className="text-xl sm:text-2xl text-center text-purple-light">Login</CardTitle>
        </CardHeader>
        <CardContent className="bg-purple-100 p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <LoginFormFields 
                form={form} 
                isLoading={isLoading} 
                onForgotPassword={() => setForgotPasswordOpen(true)} 
              />
            </form>
          </Form>
        </CardContent>
        <TestCredentialsFooter />
      </Card>

      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
      />
    </>
  );
};

export default LoginForm;
