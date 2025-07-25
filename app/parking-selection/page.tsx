'use client';

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth.context';

interface ParkingLot {
  _id: string;
  city: string;
  establishment_name: string;
  address: string;
  total_spaces: number;
  available_spaces: number;
  hourlyRate: number;
  whole_day_rate: number;
  availability_status: string;
  slots_status: string;
}

export default function ParkingSelectionPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in or not a DRIVER
  useEffect(() => {
    if (!loading && (!user || user.role !== 'DRIVER')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch parking lots securely with token
  useEffect(() => {
    const fetchParkingLots = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/parking-spaces?location=${encodeURIComponent(location)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch parking spaces');

        const data = await res.json();
        setParkingLots(data);
      } catch (err) {
        console.error('Error loading parking spaces:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParkingLots();
  }, [token, location]);

  const getAvailabilityColor = (status: string, availabilityStatus: string) => {
    if (availabilityStatus === AvailabilityStatus.CLOSED) {
      return 'bg-gray-500';
    }

    switch (status) {
      case 'Available':
        return 'bg-green-500';
      case 'Limited':
        return 'bg-yellow-500';
      case 'Full':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAvailabilityText = (
    slotsStatus: string,
    availabilityStatus: string
  ) => {
    if (availabilityStatus === AvailabilityStatus.CLOSED) {
      return AvailabilityStatus.CLOSED;
    }

    switch (slotsStatus) {
      case 'Available':
        return 'MANY SLOTS AVAILABLE';
      case 'Limited':
        return 'FEW SLOTS AVAILABLE';
      case 'Full':
        return 'NO SLOTS AVAILABLE';
      default:
        return 'UNKNOWN';
    }
  };

  const handleReserve = (lotId: string) => {
    router.push(`/reservation?lotId=${lotId}`);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % parkingLots.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + parkingLots.length) % parkingLots.length
    );
  };

  if (loading || !user || user.role !== UserRole.DRIVER) return null;

  return (
    <div className='min-h-screen bg-gray-100'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
        <h1 className='text-2xl sm:text-4xl font-bold text-center sm:mb-8'>
          Reserve A Parking Slot
        </h1>

        <p className='text-center text-sm text-gray-600 mb-8'>
          Showing results for: <span className='font-semibold'>{location}</span>
        </p>

        {isLoading ? (
          <p className='text-center text-gray-500'>Loading parking spaces...</p>
        ) : parkingLots.length === 0 ? (
          <p className='text-center text-gray-500'>No parking spaces found.</p>
        ) : (
          <div className='relative'>
            <div className='flex items-center justify-center space-x-4 sm:space-x-8'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl w-full'>
                {parkingLots.map((lot, index) => (
                  <div
                    key={lot._id}
                    className={`bg-white rounded-xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-gray-200 flex flex-col h-full ${
                      lot.availability_status === AvailabilityStatus.OPEN &&
                      lot.slots_status !== 'Full'
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }`}
                    style={{ minHeight: '500px' }}
                    onClick={() =>
                      lot.availability_status === AvailabilityStatus.OPEN &&
                      lot.slots_status !== 'Full' &&
                      handleReserve(lot._id)
                    }
                  >
                    <div className='relative'>
                      <img
                        src={`/placeholder.svg?height=250&width=400&text=${encodeURIComponent(
                          lot.establishment_name
                        )}+Map`}
                        alt={`${lot.establishment_name} map`}
                        className='w-full h-48 sm:h-64 object-cover'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
                    </div>

                    <div className='p-4 sm:p-6 flex flex-col flex-grow'>
                      <div className='h-16 sm:h-20 mb-3 sm:mb-4'>
                        <h3 className='text-lg sm:text-2xl font-bold text-gray-800 leading-tight'>
                          {lot.establishment_name}
                        </h3>
                      </div>

                      <div className='space-y-2 mb-4 sm:mb-6'>
                        <div className='flex items-center text-gray-600'>
                          <MapPin className='w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0' />
                          <span className='font-medium text-sm sm:text-base'>
                            {lot.city}
                          </span>
                        </div>
                        <p className='text-gray-600 text-xs sm:text-sm leading-relaxed'>
                          {lot.address}
                        </p>
                        <div className='bg-gray-50 rounded-lg p-2 sm:p-3 mt-3'>
                          <p className='text-xs sm:text-sm text-gray-700'>
                            <span className='font-semibold'>Available:</span>{' '}
                            {lot.available_spaces}/{lot.total_spaces} spaces
                          </p>
                        </div>

                        <div className='mt-2 bg-gray-200 rounded-full h-2 w-full'>
                          <div
                            className='bg-blue-600 h-2 rounded-full'
                            style={{
                              width: `${
                                (lot.available_spaces / lot.total_spaces) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className='bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6'>
                        <p className='text-lg sm:text-xl font-bold text-blue-800'>
                          ₱{lot.hourlyRate.toFixed(2)}
                          <span className='text-xs sm:text-sm font-normal text-blue-600'>
                            /hour
                          </span>
                        </p>
                        <p className='text-xs sm:text-sm text-blue-600'>
                          ₱{lot.whole_day_rate.toFixed(2)} whole day
                        </p>
                      </div>

                      <div className='mt-auto'>
                        <Button
                          onClick={() => handleReserve(lot._id)}
                          disabled={
                            lot.availability_status !==
                              AvailabilityStatus.OPEN ||
                            lot.slots_status === 'Full'
                          }
                          className={`w-full py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 ${
                            lot.availability_status !==
                              AvailabilityStatus.OPEN ||
                            lot.slots_status === 'Full'
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {lot.availability_status === AvailabilityStatus.CLOSED
                            ? 'Closed'
                            : lot.slots_status === 'Full'
                            ? 'No Spaces Available'
                            : 'Reserve Now'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex justify-center space-x-4 mt-6 sm:hidden'>
              <Button onClick={prevSlide} variant='outline' size='sm'>
                <ChevronLeft className='w-4 h-4 mr-1' />
                Previous
              </Button>
              <Button onClick={nextSlide} variant='outline' size='sm'>
                Next
                <ChevronRight className='w-4 h-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
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
