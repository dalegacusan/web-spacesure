'use client';

import { useAuth } from '@/app/context/auth.context';
import HistoryTable from '@/components/history-table';
import Navbar from '@/components/navbar';
import { UserRole } from '@/lib/enums/roles.enum';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HistoryPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main
        className='mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{ width: '80%' }}
      >
        <div className='mb-4'>
          <h1 className='text-2xl font-semibold'>History</h1>
        </div>

        <HistoryTable />
      </main>
    </div>
  );
};

export default HistoryPage;
