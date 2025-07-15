'use client';

import { useAuth } from '@/app/context/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { AlertTriangle, ArrowLeft, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface PayMayaFailure {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  requestReferenceNumber: string;
  amount?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  fundSource?: {
    details?: {
      masked?: string;
      issuer?: string;
    };
  };
  data?: {
    error: string;
  };
}

function SearchParamFetcher({
  onReady,
}: {
  onReady: (value: string | null) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onReady(searchParams.get('requestReferenceNumber'));
  }, [searchParams, onReady]);
  return null;
}

export default function PaymentCancelledPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [requestReferenceNumber, setRequestReferenceNumber] = useState<
    string | null
  >(null);
  const [details, setDetails] = useState<PayMayaFailure | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && user.role !== UserRole.DRIVER) {
      router.replace('/login');
      return;
    }

    const fetchStatus = async () => {
      if (!requestReferenceNumber) {
        router.push('/home');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/${requestReferenceNumber}?cancel=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setDetails(Array.isArray(data) ? data[0] : data);
        } else {
          setDetails(data);
          toast({
            title: 'Failed to load payment info',
            description:
              data.data?.error ||
              'Could not fetch transaction from the server.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Network Error',
          description: 'An error occurred while fetching payment details.',
          variant: 'destructive',
        });
      }
    };

    if (user && token && requestReferenceNumber) fetchStatus();
  }, [user, loading, token, requestReferenceNumber, router, toast]);

  const getMessage = (code?: string) => {
    switch (code) {
      case 'PY0120':
        return 'Your card was declined by the issuer.';
      default:
        return 'Payment was cancelled.';
    }
  };

  if (loading || !user || user.role !== UserRole.DRIVER) return null;

  const updatedDetails = details ?? null;

  if (!updatedDetails) {
    return (
      <Suspense>
        <SearchParamFetcher onReady={setRequestReferenceNumber} />
      </Suspense>
    );
  }

  if (updatedDetails.data?.error) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <Suspense>
          <SearchParamFetcher onReady={setRequestReferenceNumber} />
        </Suspense>
        <div className='max-w-2xl mx-auto px-4'>
          <div className='text-center mb-8'>
            <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
              <XCircle className='w-8 h-8 text-red-600' />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Transaction not found
            </h1>
            <p className='text-gray-600'>{updatedDetails.data.error}</p>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              variant='outline'
              onClick={() => router.push('/home')}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <Suspense>
        <SearchParamFetcher onReady={setRequestReferenceNumber} />
      </Suspense>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='text-center mb-8'>
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
            <XCircle className='w-8 h-8 text-red-600' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Payment Cancelled
          </h1>
          <p className='text-gray-600'>
            {getMessage(updatedDetails?.errorCode)}
          </p>
        </div>

        <Card className='mb-6 border-red-200'>
          <CardHeader>
            <CardTitle className='text-xl text-red-800 flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5' />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <Detail
                label='Reference No.'
                value={updatedDetails.requestReferenceNumber}
              />
              <Detail
                label='Amount'
                value={`₱${Number(updatedDetails.amount || 0).toFixed(2)} ${
                  updatedDetails.currency || ''
                }`}
              />
              <Detail label='Created At' value={updatedDetails.createdAt} />
              <Detail label='Updated At' value={updatedDetails.updatedAt} />
            </div>

            <div className='border-t pt-4'>
              <h3 className='font-semibold text-gray-800 mb-2'>
                Additional Info
              </h3>
              <div className='text-sm'>
                <p className='text-gray-600'>Description</p>
                <p className='font-semibold'>Reservation is cancelled.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button
            variant='outline'
            onClick={() => router.push('/home')}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Dashboard
          </Button>
        </div>

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-600'>
            Need help? Contact our support team at{' '}
            <a
              href='mailto:support@parkingsystem.com'
              className='text-blue-600 hover:underline'
            >
              support@parkingsystem.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className='text-gray-600'>{label}</p>
      <p className='font-semibold'>{value || '—'}</p>
    </div>
  );
}
