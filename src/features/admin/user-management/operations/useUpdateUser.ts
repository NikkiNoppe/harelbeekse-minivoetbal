
import { useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";

export const useUpdateUser = (refreshData: () => Promise<void>) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUser = async (userId: number, formData: any) => {
    setIsUpdating(true);
    try {
      console.log('🚀 Starting user update process for user ID:', userId, 'with data:', formData);
      
      // Update user basic info
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: formData.username,
          email: formData.email,
          role: formData.role
        })
        .eq('user_id', userId);
      
      if (userError) {
        console.error('❌ Error updating user:', userError);
        throw userError;
      }
      
      console.log('✅ User updated successfully');
      
      // Handle password update if provided
      if (formData.password && formData.password.trim() !== '') {
        console.log('🔐 Updating user password');
        
        const { error: passwordError } = await supabase
          .from('users')
          .update({ password: formData.password })
          .eq('user_id', userId);
        
        if (passwordError) {
          console.error('❌ Error updating password:', passwordError);
          throw passwordError;
        }
        
        console.log('✅ Password updated successfully');
      }
      
      // Handle team associations if provided
      if (formData.team_ids && Array.isArray(formData.team_ids)) {
        console.log('🔗 Updating team associations:', formData.team_ids);
        
        // First, remove existing associations
        const { error: deleteError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('❌ Error removing existing team associations:', deleteError);
          throw deleteError;
        }
        
        // Then, add new associations
        if (formData.team_ids.length > 0) {
          const teamAssociations = formData.team_ids.map((teamId: number) => ({
            user_id: userId,
            team_id: teamId
          }));
          
          const { error: insertError } = await supabase
            .from('team_users')
            .insert(teamAssociations);
          
          if (insertError) {
            console.error('❌ Error creating new team associations:', insertError);
            throw insertError;
          }
          
          console.log('✅ Team associations updated successfully');
        }
      }
      
      toast({
        title: "Gebruiker bijgewerkt",
        description: "De gebruiker is succesvol bijgewerkt"
      });
      
      // Refresh the user list to ensure we have the latest data from the database
      console.log('🔄 Refreshing user data after update');
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('❌ Error in updateUser function:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het bijwerken van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUser, isUpdating };
};
