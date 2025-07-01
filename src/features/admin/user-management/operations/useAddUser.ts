
import { useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";

export const useAddUser = (refreshData: () => Promise<void>) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const addUser = async (formData: any) => {
    setIsAdding(true);
    try {
      console.log('🚀 Starting user creation process with data:', formData);
      
      // First, create the user in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          username: formData.username,
          email: formData.email,
          password: formData.password, // In production, this should be hashed
          role: formData.role
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Error creating user:', userError);
        throw userError;
      }
      
      console.log('✅ User created successfully:', userData);
      
      // If team_id is provided, create team association
      if (formData.team_id) {
        console.log('🔗 Creating team association for team:', formData.team_id);
        
        const { error: teamError } = await supabase
          .from('team_users')
          .insert({
            user_id: userData.user_id,
            team_id: formData.team_id
          });
        
        if (teamError) {
          console.error('❌ Error creating team association:', teamError);
          // Don't throw here - user was created successfully
          console.log('⚠️ User created but team association failed');
        } else {
          console.log('✅ Team association created successfully');
        }
      }
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${formData.username} is succesvol toegevoegd`
      });
      
      // Refresh the user list to ensure we have the latest data from the database
      console.log('🔄 Refreshing user data after creation');
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('❌ Error in addUser function:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het toevoegen van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return { addUser, isAdding };
};
