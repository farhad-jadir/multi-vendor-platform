export interface User {
  id: string;
  email: string;
  full_name: string;
  is_merchant: boolean;
  is_customer: boolean;
  avatar_url?: string;
  provider?: string;
  provider_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'merchant' | 'customer';
  created_at: string;
}

export interface Merchant {
  id: string;
  user_id: string;
  user_role_id?: string;
  business_name: string;
  business_description?: string;
  business_logo?: string;
  business_cover?: string;
  business_address?: string;
  phone_number?: string;
  is_active: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Update Register Form Data
export interface RegisterFormData {
  full_name: string;
  email: string;
  password?: string;
  confirm_password?: string;
  as_merchant: boolean;
  business_name?: string;
  business_address?: string;
  phone_number?: string;
  provider?: 'email' | 'google';
}