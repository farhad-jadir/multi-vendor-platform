import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Define types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string | null;
  images: string[] | null;
  is_available: boolean;
  merchant_id: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  role: string;
}

/* =========================
   GET PRODUCT
========================= */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single() as {
        data: Product | null;
        error: any;
      };

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error) {
    console.error('Fetch product error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

/* =========================
   UPDATE PRODUCT
========================= */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id) as {
        data: UserRole[] | null;
        error: any;
      };

    const isMerchant = roles?.some((r: UserRole) => r.role === 'merchant');

    if (!isMerchant) {
      return NextResponse.json({ error: 'Only merchants can update products' }, { status: 403 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found' }, { status: 404 });
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('merchant_id')
      .eq('id', id)
      .single() as {
        data: { merchant_id: string } | null;
        error: any;
      };

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.merchant_id !== merchant.id) {
      return NextResponse.json({ error: 'Unauthorized to update this product' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, stock_quantity, category, images, is_available } = body;

    if (!name || price === undefined || stock_quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({
        name,
        description: description || null,
        price,
        stock_quantity,
        category: category || null,
        images: images || [],
        is_available: is_available !== undefined ? is_available : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single() as {
        data: Product | null;
        error: any;
      };

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

/* =========================
   DELETE PRODUCT
========================= */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id) as {
        data: UserRole[] | null;
        error: any;
      };

    const isMerchant = roles?.some((r: UserRole) => r.role === 'merchant');

    if (!isMerchant) {
      return NextResponse.json({ error: 'Only merchants can delete products' }, { status: 403 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found' }, { status: 404 });
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('merchant_id')
      .eq('id', id)
      .single() as {
        data: { merchant_id: string } | null;
        error: any;
      };

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.merchant_id !== merchant.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this product' }, { status: 403 });
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', id)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (orders && orders.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product with pending orders'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}