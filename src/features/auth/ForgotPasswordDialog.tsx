import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@shared/hooks/use-toast";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@shared/integrations/supabase/client";

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
      const { error } = await supabase.functions.invoke('send-password-reset', {
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
        toast({
          title: "Email verstuurd",
          description: "Als dit email adres bestaat, zal je een reset link ontvangen.",
        });
        form.reset();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Er is een fout opgetreden",
        description: "Probeer het later opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wachtwoord Reset</DialogTitle>
          <DialogDescription>
            Voer je email adres in om een wachtwoord reset link te ontvangen.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email adres</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="voer.email@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Versturen..." : "Reset Link Versturen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
