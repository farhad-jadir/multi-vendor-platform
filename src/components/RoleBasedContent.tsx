'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

interface RoleBasedContentProps {
  merchant?: React.ReactNode;
  customer?: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleBasedContent({ merchant, customer, fallback }: RoleBasedContentProps) {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRoles() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        setRoles(rolesData?.map(r => r.role) || []);
      }
      setLoading(false);
    }

    getUserRoles();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (roles.includes('merchant') && merchant) {
    return <>{merchant}</>;
  }

  if (roles.includes('customer') && customer) {
    return <>{customer}</>;
  }

  return <>{fallback}</>;
}