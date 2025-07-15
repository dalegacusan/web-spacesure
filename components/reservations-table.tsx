'use client';

import { useAuth } from '@/app/context/auth.context';
import type { Reservation } from '@/app/establishment/manage/[id]/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  data: Reservation[];
}

export default function ReservationsTable({ data }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReservations, setFilteredReservations] =
    useState<Reservation[]>(data);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(
    null
  );
  const [showCompleteDialog, setShowCompleteDialog] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (data.length > 0) {
      setFilteredReservations(data);
    }
  }, [data]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = data.filter((reservation) => {
      const customerName = `${reservation.user.first_name} ${reservation.user.last_name}`;
      return (
        reservation._id.toLowerCase().includes(term.toLowerCase()) ||
        customerName.toLowerCase().includes(term.toLowerCase()) ||
        reservation.vehicle.plate_number
          .toLowerCase()
          .includes(term.toLowerCase()) ||
        reservation.parking_space?.establishment_name
          .toLowerCase()
          .includes(term.toLowerCase())
      );
    });
    setFilteredReservations(filtered);
  };

  const handleCancelReservation = async (reservationId: string) => {
    setCancellingId(reservationId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to cancel reservation');

      setFilteredReservations((prev) =>
        prev.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.CANCELLED }
            : r
        )
      );

      toast({
        title: 'Reservation Cancelled',
        description: 'The reservation has been successfully cancelled.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: 'Unable to cancel reservation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
      setShowConfirmDialog(null);
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    setCompletingId(reservationId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to complete reservation');

      setFilteredReservations((prev) =>
        prev.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.COMPLETED }
            : r
        )
      );

      toast({
        title: 'Reservation Completed',
        description: 'The reservation has been marked as completed.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Complete failed:', error);
      toast({
        title: 'Completion Failed',
        description: 'Unable to complete reservation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCompletingId(null);
      setShowCompleteDialog(null);
    }
  };

  const ActionButtons = ({ reservation }: { reservation: Reservation }) => {
    return (
      <div className='flex gap-2'>
        {/* Cancel Button - only for CREATED reservations */}
        {reservation.status === 'CREATED' && (
          <div className='relative'>
            {showConfirmDialog === reservation._id ? (
              // Cancel Confirmation Dialog
              <div className='absolute right-0 top-0 z-50 bg-white border-2 border-red-200 rounded-lg shadow-lg p-3 min-w-[280px]'>
                <div className='flex items-center space-x-2 mb-3'>
                  <AlertTriangle className='h-4 w-4 text-red-600 flex-shrink-0' />
                  <span className='text-sm text-red-700 font-medium'>
                    Cancel this reservation?
                  </span>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleCancelReservation(reservation._id)}
                    disabled={cancellingId === reservation._id}
                    className='flex-1 h-8'
                  >
                    {cancellingId === reservation._id ? (
                      <div className='flex items-center space-x-1'>
                        <Loader2 className='w-3 h-3 animate-spin' />
                        <span>Cancelling...</span>
                      </div>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowConfirmDialog(null)}
                    className='flex-1 h-8 border-gray-300'
                  >
                    No, Keep
                  </Button>
                </div>
              </div>
            ) : (
              // Cancel Button
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowConfirmDialog(reservation._id)}
                className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 flex items-center space-x-1'
              >
                <XCircle className='h-4 w-4' />
                <span className='hidden sm:inline'>Cancel</span>
              </Button>
            )}
          </div>
        )}

        {/* Complete Button - only for PAID reservations */}
        {reservation.status === 'PAID' && (
          <div className='relative'>
            {showCompleteDialog === reservation._id ? (
              // Complete Confirmation Dialog
              <div className='absolute right-0 top-0 z-50 bg-white border-2 border-green-200 rounded-lg shadow-lg p-3 min-w-[280px]'>
                <div className='flex items-center space-x-2 mb-3'>
                  <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0' />
                  <span className='text-sm text-green-700 font-medium'>
                    Mark this reservation as completed?
                  </span>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    size='sm'
                    onClick={() => handleCompleteReservation(reservation._id)}
                    disabled={completingId === reservation._id}
                    className='flex-1 h-8 bg-green-600 hover:bg-green-700'
                  >
                    {completingId === reservation._id ? (
                      <div className='flex items-center space-x-1'>
                        <Loader2 className='w-3 h-3 animate-spin' />
                        <span>Completing...</span>
                      </div>
                    ) : (
                      'Yes, Complete'
                    )}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowCompleteDialog(null)}
                    className='flex-1 h-8 border-gray-300'
                  >
                    No, Keep
                  </Button>
                </div>
              </div>
            ) : (
              // Complete Button
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowCompleteDialog(reservation._id)}
                className='border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-all duration-200 flex items-center space-x-1'
              >
                <CheckCircle className='h-4 w-4' />
                <span className='hidden sm:inline'>Complete</span>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const MobileActionButtons = ({
    reservation,
  }: {
    reservation: Reservation;
  }) => {
    return (
      <div className='mt-3 pt-3 border-t border-gray-200 space-y-2'>
        {/* Cancel Button for Mobile */}
        {reservation.status === 'CREATED' && (
          <div>
            {showConfirmDialog === reservation._id ? (
              // Mobile Cancel Confirmation Dialog
              <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                <div className='flex items-center space-x-2 mb-3'>
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                  <span className='text-sm font-medium text-red-700'>
                    Are you sure you want to cancel this reservation?
                  </span>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleCancelReservation(reservation._id)}
                    disabled={cancellingId === reservation._id}
                    className='flex-1'
                  >
                    {cancellingId === reservation._id ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Cancelling...</span>
                      </div>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowConfirmDialog(null)}
                    className='flex-1 border-gray-300'
                  >
                    Keep Reservation
                  </Button>
                </div>
              </div>
            ) : (
              // Mobile Cancel Button
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowConfirmDialog(reservation._id)}
                className='w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 flex items-center justify-center space-x-2'
              >
                <XCircle className='h-4 w-4' />
                <span>Cancel Reservation</span>
              </Button>
            )}
          </div>
        )}

        {/* Complete Button for Mobile */}
        {reservation.status === 'PAID' && (
          <div>
            {showCompleteDialog === reservation._id ? (
              // Mobile Complete Confirmation Dialog
              <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                <div className='flex items-center space-x-2 mb-3'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <span className='text-sm font-medium text-green-700'>
                    Mark this reservation as completed?
                  </span>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    size='sm'
                    onClick={() => handleCompleteReservation(reservation._id)}
                    disabled={completingId === reservation._id}
                    className='flex-1 bg-green-600 hover:bg-green-700'
                  >
                    {completingId === reservation._id ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Completing...</span>
                      </div>
                    ) : (
                      'Yes, Complete'
                    )}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowCompleteDialog(null)}
                    className='flex-1 border-gray-300'
                  >
                    Keep as Paid
                  </Button>
                </div>
              </div>
            ) : (
              // Mobile Complete Button
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowCompleteDialog(reservation._id)}
                className='w-full border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-all duration-200 flex items-center justify-center space-x-2'
              >
                <CheckCircle className='h-4 w-4' />
                <span>Complete Reservation</span>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search by reservation ID, customer, vehicle, or establishment...'
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className='flex-1'
        />
      </div>

      {/* Desktop Table - Fixed width consistency */}
      <div className='hidden lg:block'>
        <div className='bg-white rounded-lg shadow overflow-x-auto'>
          {/* Added overflow-x-auto for horizontal scrolling when needed */}
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Reservation ID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Customer
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Establishment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Vehicle
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date & Time
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Payment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredReservations.map((r) => {
                const start = new Date(r.start_time);
                const end = new Date(r.end_time);
                const timeRange = `${start.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} - ${end.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`;
                const paymentStatus =
                  r.payments?.[0]?.payment_status || 'pending';

                return (
                  <tr key={r._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      <div className='max-w-[150px]' title={r._id}>
                        {r._id}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <div
                        className='max-w-[120px] truncate'
                        title={`${r.user.first_name} ${r.user.last_name}`}
                      >
                        {r.user.first_name} {r.user.last_name}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <div
                        className='max-w-[150px] truncate'
                        title={r.parking_space?.establishment_name || 'N/A'}
                      >
                        {r.parking_space?.establishment_name || 'N/A'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {r.vehicle ? (
                        <div className='text-sm text-gray-700 max-w-[120px]'>
                          <div className='font-medium truncate'>
                            {r.vehicle.vehicle_type}
                          </div>
                          <div className='text-gray-500 truncate'>
                            {r.vehicle.plate_number}
                          </div>
                          <div className='text-gray-500 truncate text-xs'>
                            {r.vehicle.year_make_model}
                          </div>
                        </div>
                      ) : (
                        'Unknown Vehicle'
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <div className='max-w-[120px]'>
                        <div>{start.toISOString().split('T')[0]}</div>
                        <div className='text-xs text-gray-400 truncate'>
                          {timeRange}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-[#3B4A9C]'>
                      ₱{r.total_price.toFixed(2)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Badge
                        className={
                          r.status === 'PAID'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : r.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Badge
                        className={
                          paymentStatus === 'paid'
                            ? 'bg-blue-100 text-blue-800'
                            : paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : paymentStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {paymentStatus}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap relative'>
                      <ActionButtons reservation={r} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className='lg:hidden space-y-4'>
        {filteredReservations.map((r) => {
          const start = new Date(r.start_time);
          const end = new Date(r.end_time);
          const timeRange = `${start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${end.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
          const paymentStatus = r.payments?.[0]?.payment_status || 'pending';

          return (
            <div key={r._id} className='bg-white rounded-lg shadow p-4'>
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h3 className='font-medium text-gray-900 truncate'>
                    {r._id}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    {r.user.first_name} {r.user.last_name}
                  </p>
                </div>
                <div className='flex flex-col gap-1'>
                  <Badge
                    className={
                      r.status === 'PAID'
                        ? 'bg-blue-100 text-blue-800'
                        : r.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {r.status}
                  </Badge>
                  <Badge
                    className={
                      paymentStatus === 'paid'
                        ? 'bg-blue-100 text-blue-800'
                        : paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className='space-y-2 text-sm'>
                <div>
                  <span className='font-medium text-gray-500'>
                    Establishment:
                  </span>
                  <p className='truncate'>
                    {r.parking_space?.establishment_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>Vehicle:</span>
                  <p>
                    {r.vehicle ? (
                      <>
                        <div className='font-semibold'>
                          {r.vehicle.vehicle_type}
                        </div>
                        <div className='text-gray-600'>
                          {r.vehicle.plate_number}
                        </div>
                        <div className='text-gray-600'>
                          {r.vehicle.year_make_model}
                        </div>
                      </>
                    ) : (
                      'Unknown Vehicle'
                    )}
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='font-medium text-gray-500'>Date:</span>
                    <p>{start.toISOString().split('T')[0]}</p>
                  </div>
                  <div>
                    <span className='font-medium text-gray-500'>Time:</span>
                    <p>{timeRange}</p>
                  </div>
                </div>
              </div>

              <div className='pt-2 border-t'>
                <div className='flex justify-between items-center'>
                  <span className='font-medium text-gray-500'>Amount:</span>
                  <span className='text-lg font-bold text-[#3B4A9C]'>
                    ₱{r.total_price.toFixed(2)}
                  </span>
                </div>
              </div>

              <MobileActionButtons reservation={r} />
            </div>
          );
        })}
      </div>

      {filteredReservations.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No reservations found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
