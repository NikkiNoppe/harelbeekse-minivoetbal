
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

const formSchema = z.object({
  email: z.string().email({
    message: "Voer een geldig email adres in",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: data.email }
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Er is een fout opgetreden",
          description: "Probeer het later opnieuw",
          variant: "destructive",
        });
      } else {
        // Show the specific message from the server
        const message = response?.message || "Als dit email adres bestaat, zal je een reset link ontvangen.";
        
        toast({
          title: "Verzoek verwerkt",
          description: message,
          duration: 8000, // Show longer for important messages
        });
        
        form.reset();
        onOpenChange(false);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Validatie fout",
          description: error.issues.map(e => e.message).join(", "),
          variant: "destructive"
        });
      } else {
        console.error('Password reset error:', error);
        toast({
          title: "Er is een fout opgetreden",
          description: "Probeer het later opnieuw",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4 bg-purple-100 text-foreground border-border rounded-lg p-0">
        <div className="rounded-lg overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
              <div className="text-center mb-4">
                <DialogTitle className="text-lg font-semibold text-purple-dark">
                  Wachtwoord vergeten
                </DialogTitle>
                <DialogDescription className="text-sm text-purple-dark mt-2">
                  Voer je email adres in om een wachtwoord reset link te ontvangen.
                </DialogDescription>
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-dark">Email adres</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="voer.email@example.com" 
                        className="bg-white placeholder:text-purple-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="text-xs text-purple-dark bg-purple-50 p-3 rounded">
                <p><strong>Let op:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Als je account geen email heeft, wordt de beheerder op de hoogte gesteld</li>
                  <li>Reset links zijn 1 uur geldig</li>
                  <li>Controleer ook je spam folder</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                <Button
                  type="button"
                  className="bg-purple-light text-white hover:bg-purple-dark hover:text-white border border-purple-light hover:border-purple-dark order-2 sm:order-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-dark text-white hover:bg-purple-light hover:text-white border border-purple-dark order-1 sm:order-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Versturen..." : "Reset Link Versturen"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
