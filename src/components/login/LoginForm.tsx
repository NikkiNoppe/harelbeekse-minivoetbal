
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { useLoginHook } from "./hooks/useLoginHook";
import LoginFormFields from "./components/LoginFormFields";
import { loginFormSchema, LoginFormValues } from "./validation/loginFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { useToast } from "@/hooks/use-toast";
import { X } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onClose }) => {
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { login, isLoading } = useLoginHook(onLoginSuccess);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });
  const { toast } = useToast();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.usernameOrEmail, data.password);
    } catch (error) {
      if (error instanceof ZodError) {
        toast({ title: "Validatie fout", description: error.issues.map(e => e.message).join(", "), variant: "destructive" });
      } else {
        toast({ title: "Fout bij inloggen", description: "Er is een onverwachte fout opgetreden bij het inloggen.", variant: "destructive" });
      }
    }
  };

  return (
    <>
      <div className="modal relative">
        {onClose && (
          <button
            type="button"
            className="btn--close absolute top-3 right-3 z-10"
            aria-label="Sluiten"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
        <div className="modal__title">Login</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <LoginFormFields form={form} isLoading={isLoading} onForgotPassword={() => setForgotPasswordOpen(true)} />
            <div className="modal__actions">
              <button type="submit" className="btn btn--primary" disabled={isLoading}>
                {isLoading ? "Inloggen..." : "Inloggen"}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setForgotPasswordOpen(true)}>
                Wachtwoord vergeten?
              </button>
            </div>
          </form>
        </Form>
      </div>
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </>
  );
};

export default LoginForm;
