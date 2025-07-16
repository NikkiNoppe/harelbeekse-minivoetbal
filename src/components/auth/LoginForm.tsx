
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

  const onSubmit = async (data: FormValues) => {
    await login(data.usernameOrEmail, data.password);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-background py-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="bg-background p-6">
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
