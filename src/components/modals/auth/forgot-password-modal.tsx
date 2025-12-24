
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal, AppModalFooter } from "@/components/modals/base/app-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { ZodError } from "zod";
import { X } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Voer een geldig email adres in" }),
});
type FormValues = z.infer<typeof formSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('send-password-reset', { body: { email: data.email } });
      if (error) {
        toast({ title: "Er is een fout opgetreden", description: "Probeer het later opnieuw", variant: "destructive" });
      } else {
        toast({ title: "Verzoek verwerkt", description: response?.message || "Als dit email adres bestaat, zal je een reset link ontvangen.", duration: 8000 });
        form.reset();
        onOpenChange(false);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({ title: "Validatie fout", description: error.issues.map(e => e.message).join(", "), variant: "destructive" });
      } else {
        toast({ title: "Er is een fout opgetreden", description: "Probeer het later opnieuw", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Wachtwoord vergeten"
      subtitle="Voer je e-mailadres in om een wachtwoord reset link te ontvangen."
      size="sm"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mailadres</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Voer je e-mailadres in"
                      className="modal__input"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="modal__actions">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn--primary"
              >
                {isLoading ? "Versturen..." : "Wachtwoord resetten"}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="btn btn--secondary"
                disabled={isLoading}
              >
                Annuleren
              </button>
            </div>
          </form>
        </Form>
    </AppModal>
  );
};

