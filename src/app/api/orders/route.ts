import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, quantity, shipping_address, customer_phone } = body;

    if (!product_id || !quantity || !shipping_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, merchant_id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check stock
    if (product.stock_quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Calculate total price
    const total_price = product.price * quantity;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        merchant_id: product.merchant_id,
        product_id: product_id,
        quantity: quantity,
        total_price: total_price,
        shipping_address: shipping_address,
        customer_phone: customer_phone || '',
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', product_id);

    if (updateError) throw updateError;

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is merchant
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isMerchant = roles?.some(r => r.role === 'merchant');

    let query = supabase
      .from('orders')
      .select(`
        *,
        product:product_id (name, images),
        customer:customer_id (full_name, email)
      `);

    if (isMerchant) {
      // Get merchant profile
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (merchant) {
        query = query.eq('merchant_id', merchant.id);
      } else {
        // If no merchant found, return empty array
        return NextResponse.json([]);
      }
    } else {
      query = query.eq('customer_id', user.id);
    }

    const { data: orders, error } = await query.order('order_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}