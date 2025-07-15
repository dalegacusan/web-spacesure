'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DriverAccountPage() {
  const { user, token, loading } = useAuth();

  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (!loading && user) {
      setFormData({
        firstName: user.first_name || '',
        middleName: user.middle_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phoneNumber: user.phone_number || '',
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || res.error || 'Update failed');
      }

      const updatedUser = res.data.user;

      const storedToken = localStorage.getItem('token');
      const newUser = { ...updatedUser, token: storedToken };

      localStorage.setItem('currentUser', JSON.stringify(newUser));

      toast({
        title: 'Account Updated',
        description: 'Your account information has been successfully updated.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    router.push('/home');
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main className='max-w-4xl mx-auto px-6 py-8'>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-4 text-gray-800'>
            Account Settings
          </h1>
        </div>

        <Card className='shadow-lg border-0'>
          <CardHeader className='bg-blue-600 text-white rounded-t-lg'>
            <CardTitle className='flex items-center text-xl'>
              <User className='w-6 h-6 mr-3' />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className='p-8'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label
                    htmlFor='firstName'
                    className='text-lg font-medium mb-2 block'
                  >
                    First Name
                  </Label>
                  <Input
                    id='firstName'
                    type='text'
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  />
                </div>

                <div>
                  <Label
                    htmlFor='middleName'
                    className='text-lg font-medium mb-2 block'
                  >
                    Middle Name
                  </Label>
                  <Input
                    id='middleName'
                    type='text'
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                    className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  />
                </div>

                <div>
                  <Label
                    htmlFor='lastName'
                    className='text-lg font-medium mb-2 block'
                  >
                    Last Name
                  </Label>
                  <Input
                    id='lastName'
                    type='text'
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  />
                </div>

                <div>
                  <Label
                    htmlFor='email'
                    className='text-lg font-medium mb-2 block'
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
                    className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor='phoneNumber'
                  className='text-lg font-medium mb-2 block'
                >
                  Phone Number
                </Label>
                <Input
                  id='phoneNumber'
                  type='tel'
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                />
              </div>

              <div className='flex space-x-4 pt-6'>
                <Button
                  type='button'
                  onClick={handleBack}
                  variant='outline'
                  className='flex-1 py-3 text-lg border-gray-300 text-gray-600 hover:bg-gray-50'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold'
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className='text-center py-8 text-gray-600'>
        <p className='mb-2'>
          <Link href='/about'>About Us</Link>
        </p>
        <p>© 2025 SpaceSure. All Rights Reserved</p>
      </footer>
    </div>
  );
}
