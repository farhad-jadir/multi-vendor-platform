"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  signUpWithEmail,
  signInWithGoogle,
} from "../../lib/supabase/client";

import Input from "../ui/Input";
import Button from "../ui/Button";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
    as_merchant: z.boolean().default(false),
    business_name: z.string().optional(),
    business_address: z.string().optional(),
    phone_number: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ✅ FIXED resolver + typing
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      as_merchant: false,
    },
  });

  const asMerchant = watch("as_merchant");

  // ✅ FIXED onSubmit typing
  const onSubmit: (data: RegisterFormData) => Promise<void> = async (
    data
  ) => {
    setLoading(true);

    try {
      const { data: authData, error } = await signUpWithEmail(
        data.email,
        data.password,
        {
          full_name: data.full_name,
          as_merchant: data.as_merchant,
        }
      );

      if (error) throw error;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: authData.user?.id,
          email: data.email,
          full_name: data.full_name,
          as_merchant: data.as_merchant,
          business_name: data.business_name,
          business_address: data.business_address,
          phone_number: data.phone_number,
          provider: "email",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        {...register("full_name")}
        error={errors.full_name?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        {...register("email")}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        {...register("password")}
        error={errors.password?.message}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        {...register("confirm_password")}
        error={errors.confirm_password?.message}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("as_merchant")}
          className="w-4 h-4"
        />
        <label className="text-sm">
          I want to register as Merchant
        </label>
      </div>

      {asMerchant && (
        <div className="space-y-4 border-t pt-4">
          <Input
            label="Business Name"
            {...register("business_name")}
          />
          <Input
            label="Business Address"
            {...register("business_address")}
          />
          <Input
            label="Phone Number"
            {...register("phone_number")}
          />
        </div>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Create Account
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        loading={googleLoading}
        fullWidth
      >
        Continue with Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </form>
  );
}