import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Define types
interface UserRole {
  role: string;
}

interface Order {
  id: string;
  status: string;
  updated_at: string;
  product_id: string;
  merchant_id: string;
  customer_id: string;
  quantity: number;
  total_price: number;
  shipping_address: string;
  customer_phone: string;
  order_date: string;
}

// Next.js 15+ এর জন্য আপডেটেড সিনট্যাক্স
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // await করতে হবে
    
    const supabase = await createClient(); // await যোগ করা হয়েছে
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Check if user is merchant
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id) as {
        data: UserRole[] | null;
        error: any;
      };

    const isMerchant = roles?.some((r: UserRole) => r.role === 'merchant');

    if (!isMerchant) {
      return NextResponse.json({ error: 'Only merchants can update orders' }, { status: 403 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single() as {
        data: Order | null;
        error: any;
      };

    if (error) throw error;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createClient(); // await যোগ করা হয়েছে
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, product:product_id (*), merchant:merchant_id (*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createClient(); // await যোগ করা হয়েছে
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or merchant who owns this order
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id) as {
        data: UserRole[] | null;
        error: any;
      };

    const isAdmin = roles?.some((r: UserRole) => r.role === 'admin');
    
    if (!isAdmin) {
      // Check if merchant owns this order
      const { data: order } = await supabase
        .from('orders')
        .select('merchant_id')
        .eq('id', id)
        .single() as {
          data: { merchant_id: string } | null;
          error: any;
        };

      if (order) {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!merchant || order.merchant_id !== merchant.id) {
          return NextResponse.json({ error: 'Unauthorized to delete this order' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}