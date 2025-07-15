'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ParkingSpace {
  _id: string;
  city: string;
  establishment_name: string;
  address: string;
  total_spaces: number;
  available_spaces: number;
  hourlyRate: number;
  whole_day_rate: number;
  availability_status: AvailabilityStatus;
  slots_status: string;
  created_at: string;
  updated_at: string;
}

export default function EstablishmentDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [managedSpaces, setManagedSpaces] = useState<ParkingSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.ADMIN)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!token || user?.role !== UserRole.ADMIN) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch parking spaces');
        const data = await res.json();
        setManagedSpaces(data);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Unable to load parking spaces.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, [token, user, toast]);

  const getDisplayStatus = (
    slotsStatus: string,
    availabilityStatus: string
  ) => {
    return availabilityStatus === AvailabilityStatus.CLOSED
      ? 'Closed'
      : slotsStatus;
  };

  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = managedSpaces.reduce(
    (acc, lot) => {
      acc.total += lot.total_spaces;
      acc.available += lot.available_spaces;
      acc.occupied += lot.total_spaces - lot.available_spaces;
      return acc;
    },
    { total: 0, available: 0, occupied: 0 }
  );

  if (loading || !user || user.role !== UserRole.ADMIN) return null;

  return (
    <div className='min-h-screen bg-slate-100'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-6 py-8'>
        <h1 className='text-2xl font-semibold mb-6'>Establishment Dashboard</h1>

        <div className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8'>
          <Card className='bg-white'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>{managedSpaces.length}</div>
              <p className='text-gray-600'>Managed Spaces</p>
            </CardContent>
          </Card>
          <Card className='bg-white'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>{stats.total}</div>
              <p className='text-gray-600'>Total Spaces</p>
            </CardContent>
          </Card>
          <Card className='bg-white'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.available}
              </div>
              <p className='text-gray-600'>Available</p>
            </CardContent>
          </Card>
          <Card className='bg-white'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-red-600'>
                {stats.occupied}
              </div>
              <p className='text-gray-600'>Occupied</p>
            </CardContent>
          </Card>
        </div>

        <h2 className='text-xl font-semibold mb-4'>
          Your Managed Parking Spaces
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {managedSpaces.map((space) => (
            <Card
              key={space._id}
              className='border border-gray-200 shadow-md hover:shadow-lg bg-white transition-shadow'
            >
              <CardContent className='p-4 space-y-3'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-semibold'>
                    {space.establishment_name}
                  </h3>
                  <Badge
                    className={getBadgeClass(
                      getDisplayStatus(
                        space.slots_status,
                        space.availability_status
                      )
                    )}
                  >
                    {getDisplayStatus(
                      space.slots_status,
                      space.availability_status
                    )}
                  </Badge>
                </div>
                <div className='flex items-center text-sm text-gray-600'>
                  <MapPin className='h-4 w-4 mr-1' />
                  {space.address}
                </div>
                <div className='grid grid-cols-2 text-sm gap-1'>
                  <div>Total: {space.total_spaces}</div>
                  <div>Available: {space.available_spaces}</div>
                  <div>Hourly: ₱{space.hourlyRate.toFixed(2)}</div>
                  <div>Daily: ₱{space.whole_day_rate.toFixed(2)}</div>
                </div>
                <div className='mt-2 bg-gray-200 rounded-full h-2 w-full'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{
                      width: `${
                        (space.available_spaces / space.total_spaces) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <Button
                  className='w-full mt-2 bg-blue-900 hover:bg-blue-800'
                  size='sm'
                  onClick={() =>
                    router.push(`/establishment/manage/${space._id}`)
                  }
                >
                  Manage Space
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
