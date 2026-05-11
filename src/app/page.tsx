import { createClient } from '../lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ShoppingBag, MessageCircle, User, LogOut } from 'lucide-react';

// Define types
interface Merchant {
  id: string;
  business_name: string;
  business_description: string | null;
  business_logo: string | null;
  business_cover: string | null;
  slug: string;
  is_active: boolean;
  users?: {
    full_name: string;
  };
}

interface UserRole {
  role: string;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let userRoles: string[] = [];
  let userData: UserData | null = null;
  
  if (session) {
    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id) as {
        data: UserRole[] | null;
        error: any;
      };
    
    userRoles = roles?.map((r: UserRole) => r.role) || [];
    
    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single() as {
        data: UserData | null;
        error: any;
      };
    
    userData = user;
  }
  
  // Get all merchants
  const { data: merchants } = await supabase
    .from('merchants')
    .select('*, users!inner(full_name)')
    .eq('is_active', true)
    .limit(12) as {
      data: Merchant[] | null;
      error: any;
    };

  const isMerchant = userRoles.includes('merchant');
  const isCustomer = userRoles.includes('customer');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Multi Vendor Platform
            </Link>
            
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {userData?.full_name || session.user.email?.split('@')[0]}
                      </span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden hidden group-hover:block">
                      {isCustomer && (
                        <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <ShoppingBag className="w-4 h-4" />
                          My Orders
                        </Link>
                      )}
                      {isMerchant && (
                        <>
                          <Link href="/merchant/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Store className="w-4 h-4" />
                            Merchant Dashboard
                          </Link>
                          <Link href="/merchant/chat" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <MessageCircle className="w-4 h-4" />
                            Messages
                          </Link>
                        </>
                      )}
                      <hr className="my-1" />
                      <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700">
                    Login
                  </Link>
                  <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to Multi Vendor Platform
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Shop from multiple merchants or start selling your products
          </p>
          {!session && (
            <Link
              href="/register"
              className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
            >
              Get Started
            </Link>
          )}
          {session && isMerchant && (
            <Link
              href="/merchant/dashboard"
              className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Merchants Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Stores</h2>
        
        {merchants && merchants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {merchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/${merchant.slug}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-500">
                  {merchant.business_cover && (
                    <Image
                      src={merchant.business_cover}
                      alt={merchant.business_name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute -bottom-8 left-4">
                    <div className="w-16 h-16 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform">
                      {merchant.business_logo ? (
                        <Image
                          src={merchant.business_logo}
                          alt={merchant.business_name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-10">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {merchant.business_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {merchant.users?.full_name || 'Store Owner'}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {merchant.business_description || 'Visit store to see products'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stores Yet</h3>
            <p className="text-gray-600">Be the first merchant to join our platform!</p>
            {session && (
              <Link
                href="/merchant/settings"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your Store
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Features Section for Logged-in Users */}
      {session && (
        <div className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {isMerchant ? 'Your Business Tools' : 'Shopping Features'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isMerchant && (
                <>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Store className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Manage Store</h3>
                    <p className="text-sm text-gray-600">Add products, update inventory, and manage your store</p>
                    <Link href="/merchant/products" className="text-blue-600 text-sm mt-2 inline-block">
                      Go to Products →
                    </Link>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Track Orders</h3>
                    <p className="text-sm text-gray-600">View and manage customer orders</p>
                    <Link href="/merchant/orders" className="text-blue-600 text-sm mt-2 inline-block">
                      View Orders →
                    </Link>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Chat</h3>
                    <p className="text-sm text-gray-600">Communicate with your customers in real-time</p>
                    <Link href="/merchant/chat" className="text-blue-600 text-sm mt-2 inline-block">
                      Open Chat →
                    </Link>
                  </div>
                </>
              )}
              {isCustomer && (
                <>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Track Orders</h3>
                    <p className="text-sm text-gray-600">View your order history and status</p>
                    <Link href="/orders" className="text-blue-600 text-sm mt-2 inline-block">
                      My Orders →
                    </Link>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Browse Stores</h3>
                    <p className="text-sm text-gray-600">Shop from multiple merchants</p>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Chat Support</h3>
                    <p className="text-sm text-gray-600">Message merchants directly</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}