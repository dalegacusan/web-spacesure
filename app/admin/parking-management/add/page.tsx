'use client';

import type React from 'react';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddEstablishmentPage() {
  const { user, token, loading } = useAuth();
  const [formData, setFormData] = useState({
    establishmentName: '',
    city: '',
    address: '',
    totalSpaces: 0,
    availableSpaces: 0,
    hourlyRate: 0,
    wholeDayRate: 0,
    availabilityStatus: AvailabilityStatus.OPEN,
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            city: formData.city,
            establishment_name: formData.establishmentName,
            address: formData.address,
            total_spaces: formData.totalSpaces,
            available_spaces: formData.availableSpaces,
            hourlyRate: formData.hourlyRate,
            whole_day_rate: formData.wholeDayRate,
            availability_status: formData.availabilityStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Failed to Add Establishment',
          description: data.message || 'Something went wrong.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Establishment Added',
        description: 'New parking establishment has been successfully added.',
        variant: 'success',
      });

      router.push('/admin/parking-management');
    } catch (err) {
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    router.push('/admin/parking-management');
  };

  if (loading) return null;

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className='min-h-screen bg-slate-200 flex items-center justify-center'>
        <p className='text-lg text-gray-600'>
          Access denied. SUPER_ADMIN only.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main className='max-w-4xl mx-auto p-4 sm:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6 sm:mb-8'>
            <h1 className='text-2xl font-semibold mb-4 text-gray-800'>
              Add New Establishment
            </h1>
          </div>

          <Card className='shadow-lg border-0 bg-white'>
            <CardHeader className='bg-blue-600 text-white rounded-t-lg'>
              <CardTitle className='flex items-center text-xl'>
                <MapPin className='w-6 h-6 mr-3' />
                Establishment Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6 sm:p-8'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='establishmentName'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      Establishment Name
                    </Label>
                    <Input
                      id='establishmentName'
                      type='text'
                      placeholder='e.g., Central Parking Plaza'
                      value={formData.establishmentName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          establishmentName: e.target.value,
                        })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='city'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      City
                    </Label>
                    <Input
                      id='city'
                      type='text'
                      placeholder='e.g., Makati City'
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='address'
                    className='text-lg font-medium mb-3 block text-gray-700'
                  >
                    Address
                  </Label>
                  <Input
                    id='address'
                    type='text'
                    placeholder='e.g., 123 Main Street, Makati City'
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='totalSpaces'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      Total Spaces
                    </Label>
                    <Input
                      id='totalSpaces'
                      type='number'
                      min='1'
                      value={formData.totalSpaces}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalSpaces: Number(e.target.value),
                        })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='availableSpaces'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      Available Spaces
                    </Label>
                    <Input
                      id='availableSpaces'
                      type='number'
                      min='0'
                      value={formData.availableSpaces}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableSpaces: Number(e.target.value),
                        })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='hourlyRate'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      Hourly Rate (₱)
                    </Label>
                    <Input
                      id='hourlyRate'
                      type='number'
                      step='0.01'
                      min='0'
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourlyRate: Number(e.target.value),
                        })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='wholeDayRate'
                      className='text-lg font-medium mb-3 block text-gray-700'
                    >
                      Whole Day Rate (₱)
                    </Label>
                    <Input
                      id='wholeDayRate'
                      type='number'
                      step='0.01'
                      min='0'
                      value={formData.wholeDayRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wholeDayRate: Number(e.target.value),
                        })
                      }
                      className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='availabilityStatus'
                    className='text-lg font-medium mb-3 block text-gray-700'
                  >
                    Availability Status
                  </Label>
                  <Select
                    value={formData.availabilityStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availabilityStatus: value })
                    }
                  >
                    <SelectTrigger className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
                      <SelectValue placeholder='Select availability status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AvailabilityStatus.OPEN}>
                        {AvailabilityStatus.OPEN}
                      </SelectItem>
                      <SelectItem value={AvailabilityStatus.CLOSED}>
                        {AvailabilityStatus.CLOSED}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6'>
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
                    Add Establishment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className='text-center py-8 text-gray-600'>
        <Link href='/about'>About Us</Link>{' '}
        <p>© 2025 SpaceSure. All Rights Reserved</p>
      </footer>
    </div>
  );
}
