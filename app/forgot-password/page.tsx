'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Reset Link Sent',
      description:
        "If an account with this email exists, you'll receive a password reset link shortly.",
      variant: 'success',
    });

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-[#3B4A9C] flex items-center justify-center px-4'>
        <div className='bg-[#3B4A9C] p-6 sm:p-8 w-full max-w-md'>
          <div className='mb-6 sm:mb-8'>
            <div className='p-3 sm:p-4 bg-white/10 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center'>
              <Mail className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
            </div>
            <h1 className='text-2xl sm:text-4xl font-bold text-white mb-4'>
              Check Your Email
            </h1>
            <p className='text-white/90 text-base sm:text-lg'>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className='space-y-4'>
            <p className='text-white/80'>
              Didn't receive the email? Check your spam folder or try again.
            </p>

            <Button
              onClick={() => setIsSubmitted(false)}
              variant='outline'
              className='w-full bg-white/10 border-white/30 text-white hover:bg-white/20'
            >
              Try Different Email
            </Button>

            <Link
              href='/login'
              className='block w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white text-lg py-3 rounded text-center transition-colors'
            >
              Back to Login
            </Link>
          </div>

          <div className='text-center mt-8 space-y-2'>
            <p className='text-white/60 mb-2'>
              <Link href='/about'>About Us</Link>
            </p>
            <p className='text-white/60'>
              © 2025 SpaceSure. All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#3B4A9C] flex items-center justify-center px-4'>
      <div className='bg-[#3B4A9C] p-6 sm:p-8 w-full max-w-md'>
        <div className='text-center mb-6 sm:mb-8'>
          <h1 className='text-3xl sm:text-5xl font-bold text-white mb-4'>
            SPACE
            <br />
            SURE
          </h1>
          <h2 className='text-xl sm:text-2xl font-semibold text-white mb-2'>
            Forgot Password
          </h2>
          <p className='text-white/80 text-sm sm:text-base'>
            Enter your email to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
          <div>
            <Label
              htmlFor='email'
              className='text-white text-base sm:text-lg mb-2 block'
            >
              Email Address
            </Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email address'
              className='w-full p-3 sm:p-4 text-base sm:text-lg bg-gray-200 border-none rounded'
              required
            />
          </div>

          <Button
            type='submit'
            className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white text-base sm:text-lg py-3 sm:py-4 rounded'
          >
            Send Reset Link
          </Button>
        </form>

        <div className='text-center mt-6'>
          <Link
            href='/login'
            className='text-white underline text-lg flex items-center justify-center hover:text-gray-200'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Login
          </Link>
        </div>

        <div className='text-center mt-8 space-y-2'>
          <p className='text-white/60 mb-2'>
            <Link href='/about'>About Us</Link>
          </p>
          <p className='text-white/60'>© 2025 SpaceSure. All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
