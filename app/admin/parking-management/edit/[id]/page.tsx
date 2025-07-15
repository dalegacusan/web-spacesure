'use client';

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
import { useParams, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';

export default function EditEstablishmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, token, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    establishmentName: '',
    city: '',
    address: '',
    totalSpaces: 0,
    availableSpaces: 0,
    hourlyRate: 0,
    wholeDayRate: 0,
    availabilityStatus: '',
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Access control
  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login'); // or show an Access Denied page
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchParkingSpace = async () => {
      const id = params?.id?.toString();
      if (!id || !token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch parking space data');
        }

        const data = await res.json();
        setFormData({
          establishmentName: data.establishment_name ?? '',
          city: data.city ?? '',
          address: data.address ?? '',
          totalSpaces: data.total_spaces ?? 0,
          availableSpaces: data.available_spaces ?? 0,
          hourlyRate: data.hourlyRate ?? 0,
          wholeDayRate: data.whole_day_rate ?? 0,
          availabilityStatus: data.availability_status ?? '',
        });
        setIsDataLoaded(true); // ✅ Set to true after form data is ready
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Unable to load parking space data.',
          variant: 'destructive',
        });
      }
    };

    fetchParkingSpace();
  }, [params.id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${params.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            establishment_name: formData.establishmentName,
            city: formData.city,
            address: formData.address,
            total_spaces: formData.totalSpaces,
            available_spaces: formData.availableSpaces,
            hourlyRate: formData.hourlyRate,
            whole_day_rate: formData.wholeDayRate,
            availability_status: formData.availabilityStatus,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update establishment');
      }

      toast({
        title: 'Establishment Updated',
        description: 'Parking establishment has been successfully updated.',
        variant: 'success',
      });

      // Redirect back to parking management page
      setTimeout(() => {
        router.push('/admin/parking-management');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/parking-management');
  };

  if (loading || !isDataLoaded) return null;

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main className='max-w-4xl mx-auto p-4 sm:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6 sm:mb-8'>
            <h1 className='text-2xl font-semibold mb-4 text-gray-800'>
              Edit Establishment
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
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Establishment Name
                    </Label>
                    <Input
                      id='establishmentName'
                      type='text'
                      value={formData.establishmentName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          establishmentName: e.target.value,
                        })
                      }
                      className='w-full'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='city'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      City
                    </Label>
                    <Input
                      id='city'
                      type='text'
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className='w-full'
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='address'
                    className='text-sm font-medium mb-2 block text-gray-700'
                  >
                    Address
                  </Label>
                  <Input
                    id='address'
                    type='text'
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className='w-full'
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='totalSpaces'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Total Spaces
                    </Label>
                    <Input
                      id='totalSpaces'
                      type='number'
                      value={formData.totalSpaces}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalSpaces: Number(e.target.value),
                        })
                      }
                      className='w-full'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='availableSpaces'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Available Spaces
                    </Label>
                    <Input
                      id='availableSpaces'
                      type='number'
                      value={formData.availableSpaces}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableSpaces: Number(e.target.value),
                        })
                      }
                      className='w-full'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='hourlyRate'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Hourly Rate (₱)
                    </Label>
                    <Input
                      id='hourlyRate'
                      type='number'
                      step='0.01'
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourlyRate: Number(e.target.value),
                        })
                      }
                      className='w-full'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='wholeDayRate'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Whole Day Rate (₱)
                    </Label>
                    <Input
                      id='wholeDayRate'
                      type='number'
                      step='0.01'
                      value={formData.wholeDayRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wholeDayRate: Number(e.target.value),
                        })
                      }
                      className='w-full'
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='availabilityStatus'
                    className='text-sm font-medium mb-2 block text-gray-700'
                  >
                    Availability Status
                  </Label>
                  <Select
                    value={formData.availabilityStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availabilityStatus: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
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
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Updating Establishment...
                      </>
                    ) : (
                      <>
                        <MapPin className='h-4 w-4 mr-2' />
                        Update Establishment
                      </>
                    )}
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
