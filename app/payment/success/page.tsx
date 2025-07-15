'use client';

import { useAuth } from '@/app/context/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface PayMayaStatus {
  id: string;
  isPaid: boolean;
  status: string;
  amount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  requestReferenceNumber: string;
  receiptNumber?: string;
  description?: string;
  fundSource?: {
    type: string;
    description: string;
    details?: {
      masked: string;
      issuer: string;
    };
  };
  receipt?: {
    transactionId?: string;
  };
  data?: {
    error: string;
  };
}

// Wrapper component to safely access useSearchParams in a Suspense boundary
function SearchParamFetcher({
  onReady,
}: {
  onReady: (value: string | null) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('requestReferenceNumber');
    onReady(ref);
  }, [searchParams, onReady]);
  return null;
}

export default function PaymentSuccessPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [requestReferenceNumber, setRequestReferenceNumber] = useState<
    string | null
  >(null);
  const [paymentDetails, setPaymentDetails] = useState<PayMayaStatus | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
      return;
    }

    const fetchPaymentDetails = async () => {
      if (!requestReferenceNumber) {
        router.push('/home');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/${requestReferenceNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setPaymentDetails(Array.isArray(data) ? data[0] : data);
        } else {
          setPaymentDetails(data);
          toast({
            title: 'Failed to load payment info',
            description:
              data?.data?.error ||
              'Could not fetch transaction from the server.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Network Error',
          description: 'Unable to reach server. Please try again.',
          variant: 'destructive',
        });
      }
    };

    if (user && token && requestReferenceNumber) {
      fetchPaymentDetails();
    }
  }, [user, loading, token, requestReferenceNumber, router, toast]);

  if (loading || !user || user.role !== UserRole.DRIVER) return null;

  const isSuccess = paymentDetails?.status === 'PAYMENT_SUCCESS';
  const updatedDetails = paymentDetails ?? null;

  if (!updatedDetails)
    return (
      <Suspense>
        <SearchParamFetcher onReady={setRequestReferenceNumber} />
      </Suspense>
    );

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
            <p className='text-gray-600'>{updatedDetails?.data.error}</p>
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
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isSuccess ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className='w-8 h-8 text-green-600' />
            ) : (
              <Clock className='w-8 h-8 text-yellow-500' />
            )}
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Payment {isSuccess ? 'Successful' : 'Pending'}
          </h1>
          <p className='text-gray-600'>
            {isSuccess
              ? 'Your parking reservation has been confirmed.'
              : 'Waiting for confirmation from PayMaya.'}
          </p>
        </div>

        {isSuccess && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='text-xl text-gray-800'>
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Summary Fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-600'>Receipt Number</p>
                  <p className='font-semibold'>
                    {updatedDetails.receiptNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Transaction ID</p>
                  <p className='font-semibold'>
                    {updatedDetails.receipt?.transactionId || '—'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Request Reference No.</p>
                  <p className='font-semibold'>
                    {updatedDetails.requestReferenceNumber}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Amount</p>
                  <p className='font-semibold text-green-600'>
                    ₱{Number(updatedDetails.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Currency</p>
                  <p className='font-semibold'>{updatedDetails.currency}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Description</p>
                  <p className='font-semibold'>
                    {updatedDetails.description || '—'}
                  </p>
                </div>
              </div>

              {/* Card Info */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold text-gray-800 mb-2'>
                  Card Details
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Card</p>
                    <p className='font-semibold'>
                      {updatedDetails.fundSource?.details?.masked || '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Issuer</p>
                    <p className='font-semibold'>
                      {updatedDetails.fundSource?.details?.issuer || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold text-gray-800 mb-2'>Timestamps</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Created At</p>
                    <p className='font-semibold'>
                      {new Date(updatedDetails.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Updated At</p>
                    <p className='font-semibold'>
                      {new Date(updatedDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
