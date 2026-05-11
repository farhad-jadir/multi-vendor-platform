'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Camera,
  Store
} from 'lucide-react';

interface Merchant {
  id: string;
  business_name: string;
  business_description: string;
  business_logo: string | null;
  business_cover: string | null;
  slug: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: any[];
  lowStockProducts: any[];
}

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentOrders: [],
    lowStockProducts: []
  });

  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Merchant Data:', merchantData);

      setMerchant(merchantData);

      if (merchantData) {
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantData.id);

        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('merchant_id', merchantData.id);

        const totalRevenue =
          orders?.reduce((sum, order) => sum + order.total_price, 0) || 0;

        const uniqueCustomers = new Set(
          orders?.map(order => order.customer_id)
        );

        const { data: lowStock } = await supabase
          .from('products')
          .select('*')
          .eq('merchant_id', merchantData.id)
          .lt('stock_quantity', 10)
          .limit(5);

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: orders?.length || 0,
          totalRevenue,
          totalCustomers: uniqueCustomers.size,
          recentOrders: orders?.slice(0, 5) || [],
          lowStockProducts: lowStock || []
        });
      }
    }

    setLoading(false);
  }

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-blue-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
    { title: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HERO */}
      <div className="relative rounded-xl overflow-hidden bg-white shadow-sm">

        {/* COVER */}
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-blue-600 to-indigo-600">

          {merchant?.business_cover ? (
            <Image
              src={merchant.business_cover}
              alt="Cover"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
          )}

          <div className="absolute inset-0 bg-black/30" />

          <Link
            href="/merchant/settings"
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-all shadow-md"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Cover</span>
          </Link>
        </div>

        {/* PROFILE */}
        <div className="relative px-6 pb-6">

          <div className="flex justify-between items-start -mt-12 mb-4">

            <div className="relative">

              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">

                {merchant?.business_logo ? (
                  <Image
                    src={merchant.business_logo}
                    alt={merchant.business_name || 'Store Logo'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Store className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
                  </div>
                )}

              </div>

              <Link
                href="/merchant/settings"
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border"
              >
                <Camera className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
              </Link>

            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {merchant?.business_name || 'Your Store'}
          </h1>

          <p className="text-gray-600 text-sm md:text-base mt-1">
            {merchant?.business_description || 'Welcome to your store dashboard'}
          </p>

        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Link href="/merchant/products/new" className="p-4 bg-blue-50 rounded-lg">
            <Package className="w-6 h-6 text-blue-600 mb-2" />
            Add Product
          </Link>

          <Link href="/merchant/orders" className="p-4 bg-green-50 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-green-600 mb-2" />
            View Orders
          </Link>

          <Link href="/merchant/settings" className="p-4 bg-purple-50 rounded-lg">
            <Store className="w-6 h-6 text-purple-600 mb-2" />
            Store Settings
          </Link>

          <Link href={`/${merchant?.slug}`} target="_blank" className="p-4 bg-orange-50 rounded-lg">
            <Eye className="w-6 h-6 text-orange-600 mb-2" />
            View Store
          </Link>

        </div>
      </div>

    </div>
  );
}