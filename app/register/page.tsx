'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth.context';

export default function RegisterPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.DRIVER,
    phoneNumber: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPasswordStrong = (password: string) => {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Registration Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!isPasswordStrong(formData.password)) {
      toast({
        title: 'Weak Password',
        description:
          'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!formData.role) {
      toast({
        title: 'Registration Failed',
        description: 'Please select a user type.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName || undefined,
            phoneNumber: formData.phoneNumber || undefined,
            role: UserRole.DRIVER,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Registration Successful',
          description:
            'Your account has been created. Please login to continue.',
          variant: 'success',
        });

        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast({
          title: 'Registration Failed',
          description: result.message || result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: 'Registration Failed',
        description: 'Network or server error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) return null; // prevent flashing

  return (
    <div className='min-h-screen bg-[#3B4A9C] flex items-center justify-center px-4 py-8'>
      <div className='bg-[#3B4A9C] p-6 sm:p-8 w-full max-w-md'>
        <div className='text-center mb-6 sm:mb-8'>
          <h1 className='text-4xl sm:text-6xl font-bold text-white mb-2'>
            SPACE
            <br />
            SURE
          </h1>
          <p className='text-white/80 text-base sm:text-lg mt-4'>
            Create Your Account
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label
                htmlFor='firstName'
                className='text-white text-sm font-medium mb-2 block'
              >
                First Name *
              </Label>
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className='w-full p-3 text-sm bg-gray-200 border-none rounded'
                required
              />
            </div>

            <div>
              <Label
                htmlFor='lastName'
                className='text-white text-sm font-medium mb-2 block'
              >
                Last Name *
              </Label>
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className='w-full p-3 text-sm bg-gray-200 border-none rounded'
                required
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor='middleName'
              className='text-white text-sm font-medium mb-2 block'
            >
              Middle Name
            </Label>
            <Input
              id='middleName'
              type='text'
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              className='w-full p-3 text-sm bg-gray-200 border-none rounded'
            />
          </div>

          <div>
            <Label
              htmlFor='email'
              className='text-white text-sm font-medium mb-2 block'
            >
              Email Address *
            </Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className='w-full p-3 text-sm bg-gray-200 border-none rounded'
              required
            />
          </div>

          <div>
            <Label
              htmlFor='phoneNumber'
              className='text-white text-sm font-medium mb-2 block'
            >
              Phone Number
            </Label>
            <Input
              id='phoneNumber'
              type='tel'
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className='w-full p-3 text-sm bg-gray-200 border-none rounded'
              placeholder='e.g., +1234567890'
            />
          </div>

          <div>
            <Label
              htmlFor='password'
              className='text-white text-sm font-medium mb-2 block'
            >
              Password *
            </Label>
            <Input
              id='password'
              type='password'
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className='w-full p-3 text-sm bg-gray-200 border-none rounded'
              required
              minLength={6}
            />
            <p className='text-xs text-gray-400 mt-3'>
              Password must be at least 12 characters and include uppercase,
              lowercase, number, and special character.
            </p>
          </div>

          <div>
            <Label
              htmlFor='confirmPassword'
              className='text-white text-sm font-medium mb-2 block'
            >
              Confirm Password *
            </Label>
            <Input
              id='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange('confirmPassword', e.target.value)
              }
              className='w-full p-3 text-sm bg-gray-200 border-none rounded'
              required
              minLength={6}
            />
          </div>

          <Button
            type='submit'
            disabled={isLoading}
            className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white text-base py-3 rounded disabled:opacity-50 mt-6'
          >
            {isLoading ? 'Creating Account...' : 'REGISTER'}
          </Button>
        </form>

        <div className='text-center mt-6 space-y-4'>
          <div className='border-t border-white/30 pt-4'>
            <p className='text-white text-base'>
              Already Have An Account?{' '}
              <Link href='/login' className='underline font-semibold'>
                Login
              </Link>{' '}
              Here.
            </p>
          </div>

          <p className='text-white/80 text-sm'>
            By Signing Up, You Agree to Our Terms of Service, Privacy Policy and
            Cookie Policy.
          </p>
        </div>

        <div className='text-center mt-6 space-y-2'>
          <Link href='/about'>About Us</Link>{' '}
          <p className='text-white/60 text-sm'>
            © 2025 SpaceSure. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
