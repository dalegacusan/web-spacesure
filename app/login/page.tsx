'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth.context';

export default function LoginPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { toast } = useToast();
  const { login } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        login(result.data.user, result.data.token);

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${result.data.user.first_name}!`,
          variant: 'success',
        });

        switch (result.data.user.role) {
          case UserRole.DRIVER:
            window.location.href = '/home';
            break;
          case UserRole.ADMIN:
            window.location.href = '/establishment/dashboard';
            break;
          case UserRole.SUPER_ADMIN:
            window.location.href = '/admin/dashboard';
            break;
          default:
            window.location.href = '/home';
        }
      } else {
        toast({
          title: 'Login Failed',
          description: result.message || result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user && token) {
      switch (user.role) {
        case UserRole.DRIVER:
          router.replace('/home');
          break;
        case UserRole.ADMIN:
          router.replace('/establishment/dashboard');
          break;
        case UserRole.SUPER_ADMIN:
          router.replace('/admin/dashboard');
          break;
        default:
          router.back();
      }
    } else {
      setCheckingAuth(false);
    }
  }, [user, token, router]);

  if (checkingAuth) {
    return null;
  }

  return (
    <div className='min-h-screen bg-[#3B4A9C] flex items-center justify-center px-4'>
      <div className='bg-[#3B4A9C] p-6 sm:p-8 w-full max-w-md'>
        <div
          style={{
            display: 'block',
            margin: 'auto',
            width: '50%',
            marginBottom: '32px',
          }}
        >
          <Image
            src='SPACESURE_WHITE.png'
            height={200}
            width={200}
            alt='logo'
          />
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
          <div>
            <Label
              htmlFor='email'
              className='text-white text-base sm:text-lg mb-2 block'
            >
              Email
            </Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='w-full p-3 sm:p-4 text-base sm:text-lg bg-gray-200 border-none rounded'
              required
            />
          </div>

          <div>
            <Label
              htmlFor='password'
              className='text-white text-base sm:text-lg mb-2 block'
            >
              Password
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className='w-full p-3 sm:p-4 text-base sm:text-lg bg-gray-200 border-none rounded pr-12'
                required
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5 text-gray-600' />
                ) : (
                  <Eye className='h-5 w-5 text-gray-600' />
                )}
              </Button>
            </div>
          </div>

          <Button
            type='submit'
            className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white text-base sm:text-lg py-3 sm:py-4 rounded'
          >
            LOGIN
          </Button>
        </form>

        <div className='bg-white/10 rounded-lg p-3 sm:p-4 mt-6 sm:mt-8'>
          <h3 className='text-white font-bold mb-2 text-sm sm:text-base'>
            Test Login Credentials:
          </h3>
          <div className='text-white/90 text-xs sm:text-sm space-y-1'>
            <p>
              <strong>Driver:</strong> driver@test.com / driver123
            </p>
            <p>
              <strong>Establishment:</strong> establishment1@test.com,
              establishment2@test.com / establishment123
            </p>
            <p>
              <strong>Admin:</strong> admin@test.com / admin123
            </p>
          </div>
        </div>

        <div className='text-center mt-4 sm:mt-6 space-y-3'>
          <div className='border-t border-white/30 pt-3'>
            <p className='text-white text-sm'>
              Don't Have An Account Yet?{' '}
              <Link href='/register' className='underline font-semibold'>
                Register
              </Link>{' '}
              Here.
            </p>
          </div>

          <p className='text-white/80 text-xs'>
            By Signing Up, You Agree to Our Terms of Service, Privacy Policy and
            Cookie Policy.
          </p>
        </div>

        <div className='text-center mt-6 sm:mt-8 space-y-2'>
          <p className='text-white/60 text-sm'>About Us</p>
          <p className='text-white/60 text-xs sm:text-sm'>
            © 2025 SpaceSure. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
