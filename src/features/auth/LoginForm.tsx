import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@shared/components/ui/button";
import { Form } from "@shared/components/ui/form";
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
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <LoginFormFields 
            form={form} 
            isLoading={isLoading} 
            onForgotPassword={() => setForgotPasswordOpen(true)} 
          />
        </form>
      </Form>
      
      <div className="pt-4 border-t border-purple-100">
        <TestCredentialsFooter />
      </div>

      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
      />
    </div>
  );
};

export default LoginForm;
