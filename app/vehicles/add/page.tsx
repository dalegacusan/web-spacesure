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
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function AddVehiclePage() {
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
  }, [user, loading, router, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_type: formData.vehicleType,
          year_make_model: formData.yearMakeModel,
          color: formData.color,
          plate_number: formData.plateNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast({
        title: 'Vehicle Added Successfully',
        description: 'Your vehicle has been added to your account.',
        variant: 'success',
      });

      setTimeout(() => {
        router.push('/vehicles');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    router.push('/vehicles');
  };

  if (loading || !user) {
    return null; // prevent flashing
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-2xl mx-auto p-8'>
        <div className='flex items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-800'>Add New Vehicle</h1>
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
                <Label
                  htmlFor='vehicleType'
                  className='text-lg font-medium mb-3 block text-gray-700'
                >
                  Vehicle Type
                </Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleType: value })
                  }
                >
                  <SelectTrigger className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
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
                <Label
                  htmlFor='yearMakeModel'
                  className='text-lg font-medium mb-3 block text-gray-700'
                >
                  Year, Make & Model
                </Label>
                <Input
                  id='yearMakeModel'
                  type='text'
                  placeholder='e.g., 2020 Toyota Camry'
                  value={formData.yearMakeModel}
                  onChange={(e) =>
                    setFormData({ ...formData, yearMakeModel: e.target.value })
                  }
                  className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor='color'
                  className='text-lg font-medium mb-3 block text-gray-700'
                >
                  Color
                </Label>
                <Input
                  id='color'
                  type='text'
                  placeholder='e.g., White'
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor='plateNumber'
                  className='text-lg font-medium mb-3 block text-gray-700'
                >
                  Plate Number
                </Label>
                <Input
                  id='plateNumber'
                  type='text'
                  placeholder='e.g., ABC 123'
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plateNumber: e.target.value.toUpperCase(),
                    })
                  }
                  className='w-full p-4 text-lg border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
                  required
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
                  Add Vehicle
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className='text-center py-8 text-gray-600'>
        <Link href='/about'>About Us</Link>{' '}
        <p>© 2025 SpaceSure. All Rights Reserved</p>
      </footer>
    </div>
  );
}
