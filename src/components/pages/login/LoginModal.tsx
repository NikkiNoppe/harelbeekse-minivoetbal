import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useLoginHook } from "./hooks/useLoginHook";
import LoginFields from "./components/LoginFields";
import { loginValidationSchema, LoginFormData } from "./validation/loginFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  onLoginSuccess: () => void;
}

/**
 * LoginModal - Content-only component
 * 
 * Dit is een pure content component die GEEN eigen modal wrapper heeft.
 * De parent (Layout.tsx) wikkelt dit component in een AppModal.
 * Dit voorkomt dubbele modal nesting en zorgt voor correcte portal rendering.
 */
const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login, isLoading } = useLoginHook(onLoginSuccess);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: { 
      usernameOrEmail: "", 
      password: "" 
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
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

  const handleForgotPassword = () => setIsForgotPasswordOpen(true);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <LoginFields form={form} isLoading={isLoading} />
          
          <div className="modal__actions">
            <button 
              type="submit" 
              className="btn btn--primary" 
              disabled={isLoading}
            >
              {isLoading ? "Inloggen..." : "Inloggen"}
            </button>
            <button 
              type="button" 
              className="btn btn--secondary" 
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Wachtwoord vergeten?
            </button>
          </div>
        </form>
      </Form>
      
      <ForgotPasswordModal 
        open={isForgotPasswordOpen} 
        onOpenChange={setIsForgotPasswordOpen} 
      />
    </>
  );
};

export default LoginModal;
