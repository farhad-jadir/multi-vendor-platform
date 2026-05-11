import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - নির্দিষ্ট অর্ডার দেখার জন্য
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // createClient() এর আগে await যোগ করা হয়েছে
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (id, name, description, price, images),
        merchant:merchant_id (id, business_name, slug),
        customer:customer_id (id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check authorization
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isMerchant = roles?.some((r: any) => r.role === 'merchant');
    
    if (!isMerchant && order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 });
  }
}

// PATCH - অর্ডার স্ট্যাটাস আপডেট করার জন্য (মার্চেন্ট শুধু)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // await যোগ করা হয়েছে
    const supabase = await createClient(); 
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
      .eq('user_id', user.id);

    const isMerchant = roles?.some((r: any) => r.role === 'merchant');

    if (!isMerchant) {
      return NextResponse.json({ error: 'Only merchants can update orders' }, { status: 403 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}

// DELETE - অর্ডার ডিলিট করার জন্য (কেবল কাস্টমার নিজের অর্ডার)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // await যোগ করা হয়েছে
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if order belongs to the user
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, status')
      .eq('id', id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only pending orders can be deleted
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Order cancelled successfully' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}