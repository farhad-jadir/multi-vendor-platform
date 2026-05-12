import { createClient } from './client';

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  isMerchant: boolean;
  isCustomer: boolean;
}

export async function getCurrentUserWithRoles(): Promise<UserWithRoles | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get user roles using the view
  const { data: userData } = await supabase
    .from('user_roles_view')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!userData) return null;
  
  return {
    id: userData.user_id,
    email: userData.email,
    full_name: userData.full_name,
    roles: userData.roles || [],
    isMerchant: userData.is_merchant || false,
    isCustomer: userData.roles?.includes('customer') || false,
  };
}

export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('has_role', {
      user_id: userId,
      role_name: roleName
    });
  
  if (error) return false;
  return data;
}

export async function makeUserMerchant(userId: string, businessName: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('make_merchant', {
      user_id: userId,
      business_name: businessName
    });
  
  if (error) {
    console.error('Error making merchant:', error);
    return false;
  }
  return data;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_user_roles', {
      user_id: userId
    });
  
  if (error) return [];
  return data;
}