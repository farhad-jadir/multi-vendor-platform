import { createClient } from "../../../../lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      password,
      full_name,
      user_type,
      business_name,
      business_address,
      phone_number,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !user_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ IMPORTANT: await here (fix .from error)
    const supabase = await createClient();

    // Register user with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            user_type,
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
        { error: "User creation failed" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Insert into users table
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email,
        full_name,
        user_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userError) {
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      );
    }

    // If merchant → create merchant profile
    if (user_type === "merchant") {
      if (!business_name) {
        await supabase.auth.admin.deleteUser(userId);
        await supabase.from("users").delete().eq("id", userId);

        return NextResponse.json(
          { error: "Business name is required for merchants" },
          { status: 400 }
        );
      }

      const slug = business_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const { error: merchantError } = await supabase
        .from("merchants")
        .insert({
          user_id: userId,
          business_name,
          business_address: business_address || null,
          phone_number: phone_number || null,
          slug,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (merchantError) {
        await supabase.auth.admin.deleteUser(userId);
        await supabase.from("users").delete().eq("id", userId);

        return NextResponse.json(
          { error: merchantError.message },
          { status: 400 }
        );
      }
    }

    // Sign out after register
    await supabase.auth.signOut();

    return NextResponse.json(
      {
        message: "User created successfully. Please login to continue.",
        user: {
          id: userId,
          email,
          full_name,
          user_type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}