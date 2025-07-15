'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import ReservationsTable from '@/components/reservations-table';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ReservationsPage = () => {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const res = await response.json();

        if (!response.ok) {
          throw new Error(
            res.message || res.error || 'Failed to fetch reservations'
          );
        }

        setReservations(res || []);
      } catch (error: any) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    if (user?.role === UserRole.SUPER_ADMIN) {
      fetchReservations();
    }
  }, [user, token, toast]);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main
        className=' mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{ width: '80%' }}
      >
        <div className='mb-4'>
          <h1 className='text-2xl font-semibold'>Reservations</h1>
        </div>

        <ReservationsTable data={reservations} />
      </main>
    </div>
  );
};

export default ReservationsPage;
