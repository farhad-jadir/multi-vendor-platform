'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, signOut } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      setRoles(rolesData?.map(r => r.role) || []);
    }
  }

  async function handleLogout() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    }
  }

  const isMerchant = roles.includes('merchant');
  const isCustomer = roles.includes('customer');

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Multi-Vendor Platform
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isMerchant && (
                  <Link 
                    href="/merchant/dashboard" 
                    className="px-4 py-2 text-blue-600 hover:text-blue-700"
                  >
                    Merchant Dashboard
                  </Link>
                  
                )}
                {isCustomer && (
  <Link href="/orders" className="px-4 py-2 text-blue-600 hover:text-blue-700">
    My Orders
  </Link>
)}
                
                {isCustomer && (
                  <Link 
                    href="/orders" 
                    className="px-4 py-2 text-blue-600 hover:text-blue-700"
                  >
                    My Orders
                  </Link>
                )}
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-700">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}