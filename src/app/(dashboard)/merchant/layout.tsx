'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../..//lib/supabase/client';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  MessageCircle, 
  Settings,
  Store,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkMerchantAccess();
  }, []);

  async function checkMerchantAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(user);

      // Check if merchant exists in merchants table
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Merchant check result:', { merchantData, merchantError });

      if (merchantError || !merchantData) {
        console.log('No merchant found, trying to create...');
        
        // Try to create merchant profile automatically
        const businessName = user.user_metadata?.full_name || user.email?.split('@')[0];
        const slug = businessName?.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
        
        const { data: newMerchant, error: createError } = await supabase
          .from('merchants')
          .insert({
            user_id: user.id,
            business_name: businessName,
            slug: slug,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create merchant:', createError);
          toast.error('Merchant account not found. Please contact support.');
          router.push('/');
          return;
        }
        
        console.log('Merchant created successfully:', newMerchant);
        setMerchant(newMerchant);
        setLoading(false);
        return;
      }

      if (!merchantData.is_active) {
        toast.error('Your merchant account is inactive.');
        router.push('/');
        return;
      }

      setMerchant(merchantData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error checking merchant access:', error);
      toast.error('Something went wrong');
      router.push('/');
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/');
  }

  const menuItems = [
    { href: '/merchant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/merchant/products', label: 'Products', icon: Package },
    { href: '/merchant/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/merchant/chat', label: 'Messages', icon: MessageCircle },
    { href: '/merchant/settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading merchant dashboard...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Merchant Account</h2>
          <p className="text-gray-600 mb-4">You don't have a merchant account yet.</p>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              {merchant.business_logo ? (
                <img 
                  src={merchant.business_logo} 
                  alt={merchant.business_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-blue-600" />
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-800 truncate max-w-[150px]">
                  {merchant.business_name}
                </h2>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Store className="w-6 h-6 text-blue-600" />
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}