'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Store, ShoppingBag, MessageCircle, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    }
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">Multi-Vendor Platform</Link>
            <div className="w-20 h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Multi-Vendor Platform
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>
                
                {/* Dropdown Menu - সবাই মার্চেন্ট */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border overflow-hidden hidden group-hover:block z-50">
                  <Link href="/merchant/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Store className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/merchant/products" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <ShoppingBag className="w-4 h-4" />
                    Products
                  </Link>
                  <Link href="/merchant/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <ShoppingBag className="w-4 h-4" />
                    Orders
                  </Link>
                  <Link href="/merchant/chat" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <MessageCircle className="w-4 h-4" />
                    Messages
                  </Link>
                  <Link href="/merchant/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Store className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Register as Merchant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}