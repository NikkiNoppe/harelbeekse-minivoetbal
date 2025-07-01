import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-purple-100 text-foreground border-border rounded-lg">
        <div className="rounded-b-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
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
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  className="bg-purple-light text-white hover:bg-purple-dark hover:text-white border border-purple-light hover:border-purple-dark"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-dark text-white hover:bg-purple-light hover:text-white border border-purple-dark"
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
