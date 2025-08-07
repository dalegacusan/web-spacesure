'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import PaymentHistoryTable from '@/components/payment-history-table';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PaymentHistoryPage = () => {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const res = await response.json();
        if (!response.ok) {
          throw new Error(
            res.message || res.error || 'Failed to fetch payments'
          );
        }
        setPayments(res || []);
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    if (user?.role === UserRole.SUPER_ADMIN) {
      fetchPayments();
    }
  }, [user, token, toast]);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />
      <main
        className='mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{ width: '80%' }}
      >
        <h1 className='text-2xl font-semibold mb-4'>Payment History</h1>
        <PaymentHistoryTable data={payments} />
      </main>
    </div>
  );
};

export default PaymentHistoryPage;
