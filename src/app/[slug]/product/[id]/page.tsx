import { createClient } from "../../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddToCartButton from "../../../../components/AddToCartButton";
import BuyNowButton from '../../../../components/BuyNowButton';

interface PageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  // ✅ FIX HERE
  const supabase = await createClient();

  // Get product with merchant info
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      merchant:merchant_id (
        id,
        business_name,
        slug,
        phone_number
      )
    `)
    .eq("id", params.id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/${params.slug}`}
          className="inline-flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mt-6">
          {/* Image */}
          <div className="bg-white p-4 rounded-lg">
            <div className="relative h-96 bg-gray-100 rounded-lg">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white p-6 rounded-lg">
            <h1 className="text-2xl font-bold">{product.name}</h1>

            <Link
              href={`/${product.merchant.slug}`}
              className="text-blue-600"
            >
              {product.merchant.business_name}
            </Link>

            <div className="mt-4 text-3xl font-bold text-blue-600">
              ৳{product.price}
            </div>

            <p className="mt-4 text-gray-700">
              {product.description || "No description"}
            </p>

            <div className="mt-6">
              <AddToCartButton product={product} />
              <BuyNowButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}