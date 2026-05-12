'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { signUpWithEmail, signInWithGoogle } from '../../lib/supabase/client';
import Input from '../ui/Input';
import Button from '../ui/Button';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  business_name: z.string().optional(),
  business_address: z.string().optional(),
  phone_number: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    
    try {
      const { data: authData, error } = await signUpWithEmail(
        data.email,
        data.password,
        {
          full_name: data.full_name,
          business_name: data.business_name || data.full_name,
        }
      );
      
      if (error) throw error;

      toast.success('Registration successful! You are now a merchant.');
      router.push('/merchant/dashboard');
      
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
        {...register('full_name')}
        error={errors.full_name?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        {...register('confirm_password')}
        error={errors.confirm_password?.message}
      />

      {/* Business Info - Optional */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-gray-800">Business Information (Optional)</h3>
        <Input
          label="Business Name"
          placeholder="Your Business Name"
          {...register('business_name')}
          error={errors.business_name?.message}
        />
        <Input
          label="Business Address"
          placeholder="Your Business Address"
          {...register('business_address')}
          error={errors.business_address?.message}
        />
        <Input
          label="Phone Number"
          placeholder="+880 1XXX XXXXXX"
          {...register('phone_number')}
          error={errors.phone_number?.message}
        />
      </div>

      <Button type="submit" loading={loading} fullWidth>
        Create Merchant Account
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        loading={googleLoading}
        fullWidth
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </form>
  );
}