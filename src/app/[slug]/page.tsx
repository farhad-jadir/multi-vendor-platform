import { createClient } from "../../lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, ShoppingBag } from "lucide-react";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function MerchantStorePage({ params }: PageProps) {
  // ✅ FIX: must use await
  const supabase = await createClient();

  // Get merchant by slug
  const { data: merchant } = await supabase
    .from("merchants")
    .select(`
      *,
      users:user_id (
        full_name,
        email
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (!merchant) {
    notFound();
  }

  // Get merchant products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("is_available", true)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-indigo-600">
        {merchant.business_cover && (
          <Image
            src={merchant.business_cover}
            alt={merchant.business_name}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Logo */}
            <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
              {merchant.business_logo ? (
                <Image
                  src={merchant.business_logo}
                  alt={merchant.business_name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <ShoppingBag className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left text-white">
              <h1 className="text-3xl font-bold">
                {merchant.business_name}
              </h1>

              <p className="mt-1 text-blue-100">
                {merchant.users?.full_name}
              </p>

              <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-sm">
                {merchant.phone_number && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {merchant.phone_number}
                  </div>
                )}

                {merchant.business_address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {merchant.business_address}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {merchant.business_description && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-gray-700">
              {merchant.business_description}
            </p>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Our Products</h2>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative h-48 bg-gray-100">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold truncate">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold text-blue-600">
                      ৳{product.price}
                    </span>

                    <Link
                      href={`/${merchant.slug}/product/${product.id}`}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No products yet</p>
          </div>
        )}
      </div>
    </div>
  );
}