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
import { UserRole } from '@/lib/enums/roles.enum';
import { Car } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditVehiclePage() {
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [formData, setFormData] = useState({
    vehicleType: '',
    yearMakeModel: '',
    color: '',
    plateNumber: '',
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
    }

    const fetchVehicle = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Vehicle not found');
        const data = await res.json();

        setFormData({
          vehicleType: data.vehicle_type || '',
          yearMakeModel: data.year_make_model || '',
          color: data.color || '',
          plateNumber: data.plate_number || '',
        });
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Unable to load vehicle details.',
          variant: 'destructive',
        });
        router.push('/vehicles');
      }
    };

    if (token && user?.role === UserRole.DRIVER && params.id) {
      fetchVehicle();
    }
  }, [user, loading, params.id, router, toast, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${params.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vehicle_type: formData.vehicleType,
            year_make_model: formData.yearMakeModel,
            color: formData.color,
            plate_number: formData.plateNumber.toUpperCase(),
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to update vehicle');

      toast({
        title: 'Vehicle Updated Successfully',
        description: 'Your vehicle information has been updated.',
        variant: 'success',
      });

      setTimeout(() => {
        router.push('/vehicles');
      }, 1500);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update vehicle.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    router.push('/vehicles');
  };

  if (loading || !user) return null;

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-2xl mx-auto p-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='flex items-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-800'>Edit Vehicle</h1>
          </div>

          <Card className='shadow-lg border-0'>
            <CardHeader className='bg-blue-600 text-white rounded-t-lg'>
              <CardTitle className='flex items-center text-xl'>
                <Car className='w-6 h-6 mr-3' />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-8'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                  <Label htmlFor='vehicleType'>Vehicle Type</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vehicleType: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select vehicle type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Sedan'>Sedan</SelectItem>
                      <SelectItem value='SUV'>SUV</SelectItem>
                      <SelectItem value='Hatchback'>Hatchback</SelectItem>
                      <SelectItem value='Pickup'>Pickup Truck</SelectItem>
                      <SelectItem value='Van'>Van</SelectItem>
                      <SelectItem value='Motorcycle'>Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='yearMakeModel'>Year, Make & Model</Label>
                  <Input
                    id='yearMakeModel'
                    type='text'
                    value={formData.yearMakeModel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearMakeModel: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='color'>Color</Label>
                  <Input
                    id='color'
                    type='text'
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='plateNumber'>Plate Number</Label>
                  <Input
                    id='plateNumber'
                    type='text'
                    value={formData.plateNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plateNumber: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>

                <div className='flex space-x-4 pt-6'>
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
                    className='flex-1 bg-blue-600 text-white'
                  >
                    Update Vehicle
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
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
