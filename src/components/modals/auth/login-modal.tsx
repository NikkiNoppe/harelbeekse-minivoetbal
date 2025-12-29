import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ForgotPasswordModal } from "./forgot-password-modal";
import { useLoginHook } from "@/components/pages/login/hooks/useLoginHook";
import LoginFields from "@/components/pages/login/components/LoginFields";
import { loginValidationSchema, LoginFormData } from "@/components/pages/login/validation/loginFormSchema";
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
export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
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
          
          <div className="flex flex-col-reverse gap-3 mt-6">
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="btn btn--secondary"
              style={{
                width: '100%',
                minHeight: '48px',
                fontSize: '1rem',
                fontWeight: '500',
                borderRadius: 'var(--radius)',
                transition: 'all 150ms ease-in-out'
              }}
            >
              Wachtwoord vergeten?
            </Button>
            <Button 
              type="submit" 
              loading={isLoading}
              disabled={isLoading}
              className="btn btn--primary"
              style={{
                width: '100%',
                minHeight: '48px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: 'var(--radius)',
                transition: 'all 150ms ease-in-out',
                backgroundColor: 'var(--color-400)',
                color: 'var(--color-white)',
                borderColor: 'var(--color-300)'
              }}
            >
              Inloggen
            </Button>
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

