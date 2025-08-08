'use client';

import { useAuth } from '@/app/context/auth.context';
import { Vehicle } from '@/app/establishment/manage/[id]/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import { AlertTriangle, CreditCard, Receipt, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Payment {
  _id: string;
  reservation_id: string;
  payment_method: string;
  amount: number;
  payment_status: string;
  payment_date: string | null;
  receipt_number: string | null;
  reference_number: string | null;
}

interface HistoryItem {
  id: string;
  establishment: string;
  date: string;
  time: string;
  duration: string;
  amount: string;
  status: ReservationStatus;
  vehicle: Vehicle;
  payments: Payment[];
}

export default function HistoryTable() {
  const { token, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Payment[]>([]);
  const [selectedReservationId, setSelectedReservationId] =
    useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservations/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch reservation history');

        const data = await res.json();
        setHistory(data);
        setFilteredHistory(data);
      } catch (err) {
        console.error(err);
        setHistory([]);
        setFilteredHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && token && user) {
      fetchHistory();
    }
  }, [token, user, authLoading]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = history.filter(
      (item) =>
        item.establishment.toLowerCase().includes(term.toLowerCase()) ||
        item.vehicle?.plate_number.toLowerCase().includes(term.toLowerCase()) ||
        item.status.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredHistory(filtered);
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

      setFilteredHistory((prev) =>
        prev.map((item) =>
          item.id === reservationId
            ? { ...item, status: ReservationStatus.CANCELLED }
            : item
        )
      );

      toast({
        title: 'Reservation Cancelled',
        description: 'Your reservation has been successfully cancelled.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Cancel failed:', error);
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

  const openPaymentModal = (payments: Payment[], reservationId: string) => {
    setSelectedPayments(payments);
    setSelectedReservationId(reservationId);
    setShowPaymentModal(true);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPaymentDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PaymentIcon = ({ item }: { item: HistoryItem }) => {
    const paymentCount = item.payments?.length || 0;

    if (paymentCount === 0) {
      return (
        <div className='flex items-center justify-center'>
          <span className='text-xs text-gray-400 italic'>No payments</span>
        </div>
      );
    }

    return (
      <Button
        variant='ghost'
        size='sm'
        onClick={() => openPaymentModal(item.payments, item.id)}
        className='flex items-center space-x-1 hover:bg-blue-50'
      >
        <CreditCard className='h-4 w-4 text-blue-600' />
        <span className='text-xs text-blue-600'>
          {paymentCount} payment{paymentCount > 1 ? 's' : ''}
        </span>
      </Button>
    );
  };

  const CancelButton = ({ item }: { item: HistoryItem }) => {
    if (item.status !== ReservationStatus.CREATED) return null;

    return (
      <div className='relative'>
        {showConfirmDialog === item.id ? (
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
                onClick={() => handleCancelReservation(item.id)}
                disabled={cancellingId === item.id}
                className='flex-1 h-8'
              >
                {cancellingId === item.id ? (
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
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
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowConfirmDialog(item.id)}
            className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 flex items-center space-x-1'
          >
            <XCircle className='h-4 w-4' />
            <span className='hidden sm:inline'>Cancel</span>
          </Button>
        )}
      </div>
    );
  };

  const MobileCancelButton = ({ item }: { item: HistoryItem }) => {
    if (item.status !== ReservationStatus.CREATED) return null;

    return (
      <div className='mt-3 pt-3 border-t border-gray-200'>
        {showConfirmDialog === item.id ? (
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
                onClick={() => handleCancelReservation(item.id)}
                disabled={cancellingId === item.id}
                className='flex-1'
              >
                {cancellingId === item.id ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
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
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowConfirmDialog(item.id)}
            className='w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 flex items-center justify-center space-x-2'
          >
            <XCircle className='h-4 w-4' />
            <span>Cancel Reservation</span>
          </Button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <p className='text-center py-10 text-gray-500'>Loading history...</p>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search by establishment, vehicle, or status...'
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className='flex-1'
        />
      </div>

      {/* Desktop Table */}
      <div className='hidden lg:block'>
        <div className='bg-white rounded-lg shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Establishment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Vehicle
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Time
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Duration
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Payments
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredHistory.map((item) => (
                <tr key={item.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {item.establishment}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {item.vehicle ? (
                      <div className='text-sm text-gray-700'>
                        <div className='font-medium'>
                          {item.vehicle?.vehicle_type}
                        </div>
                        <div className='text-gray-500'>
                          {item.vehicle?.plate_number}
                        </div>
                        <div className='text-gray-500'>
                          {item.vehicle?.year_make_model}
                        </div>
                      </div>
                    ) : (
                      'Unknown Vehicle'
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {item.date}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {item.time}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {item.duration}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {item.amount}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <Badge
                      className={
                        item.status === 'PAID'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <PaymentIcon item={item} />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap relative'>
                    <CancelButton item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className='lg:hidden space-y-4'>
        {filteredHistory.map((item) => (
          <Card key={item.id}>
            <CardHeader className='pb-3'>
              <div className='flex justify-between items-start'>
                <CardTitle className='text-lg'>{item.establishment}</CardTitle>
                <Badge
                  className={
                    item.status === 'PAID'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium text-gray-500'>Vehicle:</span>
                  <p>
                    {item.vehicle ? (
                      <>
                        <div className='font-semibold'>
                          {item.vehicle?.vehicle_type}
                        </div>
                        <div className='text-gray-600'>
                          {item.vehicle?.plate_number}
                        </div>
                        <div className='text-gray-600'>
                          {item.vehicle?.year_make_model}
                        </div>
                      </>
                    ) : (
                      'Unknown Vehicle'
                    )}
                  </p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>Date:</span>
                  <p>{item.date}</p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>Time:</span>
                  <p>{item.time}</p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>Duration:</span>
                  <p>{item.duration}</p>
                </div>
              </div>

              <div className='pt-2 border-t'>
                <div className='flex justify-between items-center mb-3'>
                  <span className='font-medium text-gray-500'>
                    Total Amount:
                  </span>
                  <span className='text-lg font-bold text-[#3B4A9C]'>
                    {item.amount}
                  </span>
                </div>
              </div>

              {/* Payment Button for Mobile */}
              <div className='pt-2 border-t'>
                <PaymentIcon item={item} />
              </div>

              <MobileCancelButton item={item} />
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No history found matching your search.
          </p>
        </div>
      )}

      {/* Payment Details Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center space-x-2'>
              <Receipt className='h-5 w-5' />
              <span>Payment Details</span>
            </DialogTitle>
            <p className='text-sm text-gray-600'>
              Reservation ID: {selectedReservationId}
            </p>
          </DialogHeader>

          <div className='space-y-4'>
            {selectedPayments.map((payment, index) => (
              <div
                key={payment._id}
                className='bg-gray-50 rounded-lg p-4 border'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-2'>
                    <CreditCard className='h-4 w-4 text-gray-600' />
                    <span className='font-medium text-gray-700'>
                      Payment #{index + 1}
                    </span>
                  </div>
                  <Badge
                    className={getPaymentStatusBadge(payment.payment_status)}
                  >
                    {payment.payment_status.toUpperCase()}
                  </Badge>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='text-sm text-gray-500'>Method:</span>
                    <p className='font-medium capitalize'>
                      {payment.payment_method}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm text-gray-500'>Amount:</span>
                    <p className='font-bold text-[#3B4A9C]'>
                      ₱{payment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm text-gray-500'>Date:</span>
                    <p className='font-medium'>
                      {formatPaymentDate(payment.payment_date)}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm text-gray-500'>Receipt:</span>
                    <p className='font-medium'>
                      {payment.receipt_number ? (
                        <span className='font-mono text-xs bg-white px-2 py-1 rounded border'>
                          {payment.receipt_number}
                        </span>
                      ) : (
                        <span className='text-gray-400 italic'>No receipt</span>
                      )}
                    </p>
                  </div>
                </div>

                {payment.reference_number && (
                  <div className='mt-3 pt-3 border-t border-gray-200'>
                    <span className='text-sm text-gray-500'>Reference: </span>
                    <span className='font-mono text-sm bg-white px-2 py-1 rounded border'>
                      {payment.reference_number}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {selectedPayments.length > 1 && (
              <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-blue-700'>
                    Total Payments:
                  </span>
                  <span className='text-xl font-bold text-blue-800'>
                    ₱
                    {selectedPayments
                      .reduce((sum, payment) => sum + payment.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
