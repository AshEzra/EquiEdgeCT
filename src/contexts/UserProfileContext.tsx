import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// Define the shape of the user profile (customize as needed)
export interface UserProfile {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  profile_bio: string | null;
  is_expert: boolean;
  home_country?: string | null;
  // Add more fields as needed
}

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data as UserProfile;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, isError, error, refetch }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}; 