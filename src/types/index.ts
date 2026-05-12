// Role Types
export interface Role {
  id: string;
  name: 'admin' | 'merchant' | 'customer';
  description: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role?: Role;
}

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string;
  business_logo?: string;
  business_cover?: string;
  business_address?: string;
  business_phone?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended User with roles
export interface AuthenticatedUser extends Profile {
  roles: string[];
  isMerchant: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
}