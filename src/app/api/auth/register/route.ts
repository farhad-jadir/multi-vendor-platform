import { createClient } from '../../../../lib/supabase/server';
import { makeUserMerchant } from '../../../../lib/supabase/roles';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      full_name, 
      as_merchant,
      business_name,
      business_address,
      phone_number
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ১. createClient() এর আগে await যোগ করা হয়েছে
    const supabase = await createClient();

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      );
    }

    // If merchant, add merchant role and profile
    if (as_merchant) {
      if (!business_name) {
        // Rollback: delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Business name is required for merchants' },
          { status: 400 }
        );
      }
      
      const success = await makeUserMerchant(authData.user.id, business_name);
      
      if (!success) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Failed to create merchant profile' },
          { status: 500 }
        );
      }
      
      // Update merchant details
      if (business_address || phone_number) {
        await supabase
          .from('merchants')
          .update({
            business_address: business_address || null,
            business_phone: phone_number || null,
          })
          .eq('user_id', authData.user.id);
      }
    }

    // Sign out the user (they need to login manually)
    await supabase.auth.signOut();

    return NextResponse.json({
      message: 'Registration successful! Please login.',
      user: {
        id: authData.user.id,
        email,
        full_name,
        is_merchant: as_merchant,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}