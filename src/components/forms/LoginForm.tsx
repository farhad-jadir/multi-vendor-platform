"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { signInWithEmail, signInWithGoogle } from "../../lib/supabase/client";
import { createClient } from "../../lib/supabase/client";

import Input from "../ui/Input";
import Button from "../ui/Button";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      // Email login
      const { data: authData, error } = await signInWithEmail(
        data.email,
        data.password
      );

      if (error) throw error;

      // ✅ FIX: supabase client here
      const supabase = createClient();

      // Get user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user?.id);

      const roles = rolesData?.map((r: any) => r.role) || [];

      toast.success(
        `Welcome back, ${
          authData.user?.user_metadata?.full_name ||
          authData.user?.email
        }!`
      );

      localStorage.setItem("user_roles", JSON.stringify(roles));

      router.refresh();
      router.push("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
    // redirect auto handled
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Button type="submit" loading={loading} fullWidth>
        Sign in with Email
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        fullWidth
      >
        Sign in with Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-600 hover:underline">
          Register here
        </a>
      </p>
    </form>
  );
}