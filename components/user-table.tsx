'use client';

import { useAuth } from '@/app/context/auth.context';
import type {
  ParkingSpace,
  Reservation,
} from '@/app/establishment/manage/[id]/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PaymentStatus } from '@/lib/enums/payment-status.enum';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import type { UserRole } from '@/lib/enums/roles.enum';
import { UserStatus } from '@/lib/enums/user-status.enum';
import { formatDateToLong, formatUtcTo12HourTime } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface User {
  _id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  reservations?: Reservation[];
  assigned_parking_spaces?: ParkingSpace[];
}

interface UserTableProps {
  users: User[];
}

export default function UserTable({ users }: UserTableProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState<
    string | null
  >(null);
  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(
    null
  );
  const [completingReservation, setCompletingReservation] = useState<
    string | null
  >(null);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  // Filter reservations in modal based on search query
  const filteredModalReservations = useMemo(() => {
    if (!selectedUser?.reservations || !modalSearchQuery.trim()) {
      return selectedUser?.reservations || [];
    }

    const query = modalSearchQuery.toLowerCase();
    return selectedUser.reservations.filter((reservation) => {
      // Search by reservation ID
      if (reservation._id.toLowerCase().includes(query)) return true;

      // Search by parking space name
      if (
        reservation.parking_space?.establishment_name
          ?.toLowerCase()
          .includes(query)
      )
        return true;

      // Search by vehicle plate number
      if (reservation.vehicle?.plate_number?.toLowerCase().includes(query))
        return true;

      // Search by vehicle model
      if (reservation.vehicle?.year_make_model?.toLowerCase().includes(query))
        return true;

      // Search by reservation status
      if (reservation.status.toLowerCase().includes(query)) return true;

      // Search by payment method
      if (
        reservation.payments?.some((payment) =>
          payment.payment_method.toLowerCase().includes(query)
        )
      )
        return true;

      return false;
    });
  }, [selectedUser, modalSearchQuery]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(term.toLowerCase()) ||
        user.last_name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.role.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case UserStatus.ENABLED:
        return 'secondary';
      case UserStatus.DISABLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getReservationStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ReservationStatus.PAID:
        return 'bg-blue-100 text-blue-800';
      case ReservationStatus.CREATED:
        return 'bg-gray-100 text-gray-800';
      case ReservationStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    setCancellingReservation(reservationId);
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

      toast({
        title: 'Reservation Cancelled',
        description: 'Reservation has been successfully cancelled.',
        variant: 'destructive',
      });

      if (selectedUser) {
        const updatedReservations = selectedUser.reservations?.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.CANCELLED }
            : r
        );
        const updatedUser = {
          ...selectedUser,
          reservations: updatedReservations || [],
        };
        setSelectedUser(updatedUser);

        // Also update user in main list
        setFilteredUsers((prev) =>
          prev.map((u) => (u._id === selectedUser._id ? updatedUser : u))
        );
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to cancel reservation.',
        variant: 'destructive',
      });
    } finally {
      setCancellingReservation(null);
      setConfirmingCancel(null);
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    setCompletingReservation(reservationId);
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

      toast({
        title: 'Reservation Completed',
        description: 'Reservation has been marked as completed.',
        variant: 'success',
      });

      // Update reservation status in the selected user's reservations
      if (selectedUser) {
        const updatedReservations = selectedUser.reservations?.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.COMPLETED }
            : r
        );
        const updatedUser = {
          ...selectedUser,
          reservations: updatedReservations || [],
        };
        setSelectedUser(updatedUser);

        // Also update user in main list
        setFilteredUsers((prev) =>
          prev.map((u) => (u._id === selectedUser._id ? updatedUser : u))
        );
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to complete reservation.',
        variant: 'destructive',
      });
    } finally {
      setCompletingReservation(null);
      setConfirmingComplete(null);
    }
  };

  const handleModalOpen = (user: User) => {
    setSelectedUser(user);
    setModalSearchQuery(''); // Reset search when opening modal
  };

  // Action buttons component for desktop table
  const ActionButtons = ({ reservation }: { reservation: Reservation }) => {
    return (
      <div className='flex gap-2'>
        {/* Cancel Button - only for CREATED reservations */}
        {reservation.status === 'CREATED' && (
          <div className='relative'>
            {confirmingCancel === reservation._id ? (
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
                    disabled={cancellingReservation === reservation._id}
                    className='flex-1 h-8'
                  >
                    {cancellingReservation === reservation._id ? (
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
                    onClick={() => setConfirmingCancel(null)}
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
                onClick={() => setConfirmingCancel(reservation._id)}
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
            {confirmingComplete === reservation._id ? (
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
                    disabled={completingReservation === reservation._id}
                    className='flex-1 h-8 bg-green-600 hover:bg-green-700'
                  >
                    {completingReservation === reservation._id ? (
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
                    onClick={() => setConfirmingComplete(null)}
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
                onClick={() => setConfirmingComplete(reservation._id)}
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

  // Mobile action buttons component
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
            {confirmingCancel === reservation._id ? (
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
                    disabled={cancellingReservation === reservation._id}
                    className='flex-1'
                  >
                    {cancellingReservation === reservation._id ? (
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
                    onClick={() => setConfirmingCancel(null)}
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
                onClick={() => setConfirmingCancel(reservation._id)}
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
            {confirmingComplete === reservation._id ? (
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
                    disabled={completingReservation === reservation._id}
                    className='flex-1 bg-green-600 hover:bg-green-700'
                  >
                    {completingReservation === reservation._id ? (
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
                    onClick={() => setConfirmingComplete(null)}
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
                onClick={() => setConfirmingComplete(reservation._id)}
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
      {/* Search Only */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search by name, email, or user type...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className='overflow-x-auto border rounded-md shadow-sm'>
        <table className='min-w-full divide-y divide-gray-200 bg-white'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Phone
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Role
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Reservations
              </th>
              <th className='px-6 py-3' />
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.first_name} {user.middle_name} {user.last_name}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.email}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.phone_number || '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <Badge
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : user.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <Badge
                    variant={getStatusColor(user.status)}
                    className='text-xs px-2 py-0.5 rounded-md'
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.reservations?.length || 0}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='bg-blue-50 hover:bg-blue-100 border-blue-200'
                        onClick={() => handleModalOpen(user)}
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='w-[80%] max-w-none max-h-[90vh] overflow-y-auto'>
                      <DialogHeader>
                        <DialogTitle>
                          Reservations for {user.first_name} {user.last_name}
                        </DialogTitle>
                      </DialogHeader>

                      {/* Search Bar in Modal */}
                      <div className='mb-6'>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                          <Input
                            placeholder='Search by reservation ID, parking space, vehicle plate, status...'
                            value={modalSearchQuery}
                            onChange={(e) =>
                              setModalSearchQuery(e.target.value)
                            }
                            className='pl-10'
                          />
                        </div>
                        {modalSearchQuery && (
                          <div className='mt-2 text-sm text-gray-600'>
                            Showing {filteredModalReservations.length} of{' '}
                            {selectedUser?.reservations?.length || 0}{' '}
                            reservations
                          </div>
                        )}
                      </div>

                      {/* Desktop Table in Modal */}
                      <div className='hidden lg:block'>
                        <div className='bg-white rounded-lg shadow overflow-x-auto'>
                          <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                              <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                  Reservation ID
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
                              {filteredModalReservations.map((r) => {
                                function formatDateRange(
                                  start: string,
                                  end: string
                                ) {
                                  const startDate = new Date(start);
                                  const endDate = new Date(end);

                                  const startDateISO = startDate
                                    .toISOString()
                                    .split('T')[0];
                                  const endDateISO = endDate
                                    .toISOString()
                                    .split('T')[0];

                                  const displayDate =
                                    startDateISO === endDateISO
                                      ? formatDateToLong(startDateISO)
                                      : `${formatDateToLong(
                                          startDateISO
                                        )} to ${formatDateToLong(endDateISO)}`;

                                  return `${displayDate}`;
                                }

                                const timeRange = `${formatUtcTo12HourTime(
                                  r.start_time
                                )} – ${formatUtcTo12HourTime(r.end_time)}`;

                                const paymentStatus =
                                  r.payments?.[0]?.payment_status;

                                return (
                                  <tr key={r._id} className='hover:bg-gray-50'>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                      <div
                                        className='max-w-[150px]'
                                        title={r._id}
                                      >
                                        {r._id}
                                      </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                      <div
                                        className='max-w-[150px] truncate'
                                        title={
                                          r.parking_space?.establishment_name ||
                                          'N/A'
                                        }
                                      >
                                        {r.parking_space?.establishment_name ||
                                          'N/A'}
                                      </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                      {r.vehicle ? (
                                        <div className='text-sm text-gray-700 max-w-[120px]'>
                                          <div className='font-medium truncate'>
                                            {r.vehicle?.vehicle_type}
                                          </div>
                                          <div className='text-gray-500 truncate'>
                                            {r.vehicle?.plate_number}
                                          </div>
                                          <div className='text-gray-500 truncate text-xs'>
                                            {r.vehicle?.year_make_model}
                                          </div>
                                        </div>
                                      ) : (
                                        'Unknown Vehicle'
                                      )}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                      <div className='max-w-[120px]'>
                                        <div>
                                          {formatDateRange(
                                            r.start_time,
                                            r.end_time
                                          )}
                                        </div>
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
                                        variant={
                                          paymentStatus ===
                                          PaymentStatus.COMPLETED
                                            ? 'default'
                                            : paymentStatus ===
                                              PaymentStatus.PENDING
                                            ? 'secondary'
                                            : paymentStatus ===
                                              PaymentStatus.FAILED
                                            ? 'destructive'
                                            : 'default'
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

                      {/* Mobile Cards in Modal */}
                      <div className='lg:hidden space-y-4'>
                        {filteredModalReservations.map((r) => {
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
                            <div
                              key={r._id}
                              className='bg-white rounded-lg shadow p-4'
                            >
                              <div className='flex justify-between items-start mb-3'>
                                <div>
                                  <h3 className='font-medium text-gray-900 truncate'>
                                    {r._id}
                                  </h3>
                                  <p className='text-sm text-gray-500'>
                                    {r.parking_space?.establishment_name ||
                                      'N/A'}
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
                                    Vehicle:
                                  </span>
                                  <p>
                                    {r.vehicle ? (
                                      <>
                                        <div className='font-semibold'>
                                          {r.vehicle?.vehicle_type}
                                        </div>
                                        <div className='text-gray-600'>
                                          {r.vehicle?.plate_number}
                                        </div>
                                        <div className='text-gray-600'>
                                          {r.vehicle?.year_make_model}
                                        </div>
                                      </>
                                    ) : (
                                      'Unknown Vehicle'
                                    )}
                                  </p>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                  <div>
                                    <span className='font-medium text-gray-500'>
                                      Date:
                                    </span>
                                    <p>{start.toISOString().split('T')[0]}</p>
                                  </div>
                                  <div>
                                    <span className='font-medium text-gray-500'>
                                      Time:
                                    </span>
                                    <p>{timeRange}</p>
                                  </div>
                                </div>
                              </div>

                              <div className='pt-2 border-t'>
                                <div className='flex justify-between items-center'>
                                  <span className='font-medium text-gray-500'>
                                    Amount:
                                  </span>
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

                      {filteredModalReservations.length === 0 &&
                        modalSearchQuery && (
                          <div className='text-center py-8 text-gray-500'>
                            No reservations found matching "{modalSearchQuery}
                            ".
                          </div>
                        )}

                      {(!selectedUser?.reservations ||
                        selectedUser.reservations.length === 0) &&
                        !modalSearchQuery && (
                          <div className='text-center py-8 text-gray-500'>
                            No reservations found for this user.
                          </div>
                        )}
                    </DialogContent>
                  </Dialog>
                  <Link href={`/admin/users/edit/${user._id}`}>
                    <Button size='icon' variant='outline'>
                      <Edit className='h-4 w-4' />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className='text-center text-sm text-gray-500 mt-6'>
          No users found matching your criteria.
        </div>
      )}
    </div>
  );
}
