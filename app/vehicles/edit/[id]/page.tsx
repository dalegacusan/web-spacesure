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
  const [plateError, setPlateError] = useState('');

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

  const validatePlateNumber = (plateNumber: string) => {
    const cleanPlate = plateNumber.replace(/\s+/g, ''); // Remove spaces
    if (cleanPlate.length < 5) {
      return 'Plate number must be at least 5 characters';
    }
    if (cleanPlate.length > 7) {
      return 'Plate number must not exceed 7 characters';
    }
    return '';
  };

  const handlePlateNumberChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, plateNumber: upperValue });

    const error = validatePlateNumber(upperValue);
    setPlateError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before submit
    const plateValidationError = validatePlateNumber(formData.plateNumber);
    if (plateValidationError) {
      setPlateError(plateValidationError);
      toast({
        title: 'Validation Error',
        description: plateValidationError,
        variant: 'destructive',
      });
      return;
    }

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

  const isFormValid =
    formData.vehicleType &&
    formData.yearMakeModel &&
    formData.color &&
    formData.plateNumber &&
    !plateError;

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
                      setFormData({
                        ...formData,
                        yearMakeModel: e.target.value,
                      })
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
                    onChange={(e) => handlePlateNumberChange(e.target.value)}
                    className={`w-full p-4 text-lg border-2 rounded-lg hover:border-blue-300 transition-colors ${
                      plateError
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200'
                    }`}
                    maxLength={8} // Allow for spaces
                    required
                  />
                  {plateError && (
                    <p className='text-red-600 text-sm mt-2 flex items-center'>
                      <span className='mr-1'>⚠️</span>
                      {plateError}
                    </p>
                  )}
                  <p className='text-gray-500 text-sm mt-2'>
                    Plate number must be 5-7 characters long
                  </p>
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
                    disabled={!isFormValid}
                    className={`flex-1 py-3 text-lg font-semibold ${
                      isFormValid
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
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
