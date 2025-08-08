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
  CreditCard,
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
  discount_level?: string;
  discount_id?: string;
  eligible_for_discount?: boolean;
}

interface UserTableProps {
  users: User[];
  hideSearch?: boolean; // New prop to hide the search functionality
}

export default function UserTable({
  users,
  hideSearch = false,
}: UserTableProps) {
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

  // Add these state variables after the existing useState declarations
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<any[]>([]);
  const [selectedReservationId, setSelectedReservationId] =
    useState<string>('');

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

  // Only use internal search if hideSearch is false
  const displayUsers = useMemo(() => {
    if (hideSearch || !searchTerm.trim()) {
      return users;
    }

    const query = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, searchTerm, hideSearch]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
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
        variant: 'default',
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

  const getPreferredPaymentStatus = (
    reservation: Reservation
  ): PaymentStatus => {
    if (!reservation.payments || reservation.payments.length === 0) {
      return PaymentStatus.PENDING;
    }

    const completedPayment = reservation.payments.find(
      (payment) => payment.payment_status === PaymentStatus.COMPLETED
    );

    if (completedPayment) {
      return PaymentStatus.COMPLETED;
    }

    const failedPayment = reservation.payments.find(
      (payment) => payment.payment_status === PaymentStatus.FAILED
    );

    if (failedPayment) {
      return PaymentStatus.FAILED;
    }

    return PaymentStatus.PENDING;
  };

  const PaymentIcon = ({ reservation }: { reservation: Reservation }) => {
    const paymentCount = reservation.payments?.length || 0;
    const paymentStatus = getPreferredPaymentStatus(reservation);

    const openPaymentModal = () => {
      setSelectedPayments(reservation.payments || []);
      setSelectedReservationId(reservation._id);
      setShowPaymentModal(true);
    };

    return (
      <div className='flex flex-col items-center space-y-1'>
        {/* Payment Status Badge */}
        <Badge
          className={
            paymentStatus === PaymentStatus.COMPLETED
              ? 'bg-blue-100 text-blue-800'
              : paymentStatus === PaymentStatus.PENDING
              ? 'bg-yellow-100 text-yellow-800'
              : paymentStatus === PaymentStatus.FAILED
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }
        >
          {paymentStatus}
        </Badge>

        {/* Payment Count Button */}
        {paymentCount > 0 ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={openPaymentModal}
            className='h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          >
            <CreditCard className='h-4 w-4 mr-1' />
            <span className='text-xs'>{paymentCount}</span>
          </Button>
        ) : (
          <span className='text-xs text-gray-400'>No payments</span>
        )}
      </div>
    );
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRIVER':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'DRIVER':
        return 'Driver';
      default:
        return role;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case UserStatus.ENABLED:
        return 'Enabled';
      case UserStatus.DISABLED:
        return 'Disabled';
      default:
        return status;
    }
  };

  return (
    <div className='space-y-4'>
      {/* Internal Search - only show if hideSearch is false */}
      {!hideSearch && (
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
      )}

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
                Created At
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Reservations
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Discount
              </th>
              <th className='px-6 py-3' />
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {displayUsers.map((user) => (
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
                    className={`text-xs px-2 py-0.5 rounded-md ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {formatRole(user.role)}
                  </Badge>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <Badge
                    variant={getStatusColor(user.status)}
                    className='text-xs px-2 py-0.5 rounded-md'
                  >
                    {formatStatus(user.status)}
                  </Badge>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.reservations?.length || 0}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {user.eligible_for_discount ? (
                    <div className='text-xs'>
                      <div className='text-green-600 font-medium'>Eligible</div>
                      {user.discount_level && (
                        <div className='text-blue-600'>
                          {user.discount_level} - {user.discount_id}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className='text-gray-400'>Not Eligible</span>
                  )}
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
                                  Payments
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
                                      <PaymentIcon reservation={r} />
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
                                  {/* Replace the existing payment status badges with */}
                                  <div className='mt-3 pt-3 border-t border-gray-200'>
                                    <div className='flex justify-between items-center'>
                                      <span className='text-sm font-medium text-gray-500'>
                                        Payments:
                                      </span>
                                      <PaymentIcon reservation={r} />
                                    </div>
                                  </div>
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

      {/* Results Summary - only show if using internal search */}
      {!hideSearch && searchTerm && (
        <div className='text-sm text-gray-600'>
          Showing {displayUsers.length} of {users.length} users
        </div>
      )}

      {displayUsers.length === 0 && (
        <div className='text-center text-sm text-gray-500 mt-6'>
          No users found matching your criteria.
        </div>
      )}
      {/* Payment Details Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Payment Details - {selectedReservationId}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {selectedPayments.length > 0 ? (
              <div className='space-y-3'>
                {selectedPayments.map((payment, index) => (
                  <div
                    key={payment._id || index}
                    className='border rounded-lg p-4 bg-gray-50'
                  >
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm font-medium text-gray-700'>
                          Payment Method
                        </p>
                        <p className='text-sm text-gray-900'>
                          {payment.payment_method}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-700'>
                          Status
                        </p>
                        <Badge
                          className={
                            payment.payment_status === PaymentStatus.COMPLETED
                              ? 'bg-green-100 text-green-800'
                              : payment.payment_status === PaymentStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.payment_status === PaymentStatus.FAILED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {payment.payment_status}
                        </Badge>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-700'>
                          Amount
                        </p>
                        <p className='text-sm text-gray-900'>
                          ₱{payment.amount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-700'>
                          Date
                        </p>
                        <p className='text-sm text-gray-900'>
                          {payment.payment_date
                            ? new Date(
                                payment.payment_date
                              ).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      {payment.receipt_number && (
                        <div>
                          <p className='text-sm font-medium text-gray-700'>
                            Receipt Number
                          </p>
                          <p className='text-sm text-gray-900'>
                            {payment.receipt_number}
                          </p>
                        </div>
                      )}
                      {payment.reference_number && (
                        <div>
                          <p className='text-sm font-medium text-gray-700'>
                            Reference Number
                          </p>
                          <p className='text-sm text-gray-900'>
                            {payment.reference_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedPayments.length > 1 && (
                  <div className='border-t pt-3'>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium text-gray-700'>
                        Total Payments:
                      </span>
                      <span className='font-bold text-lg'>
                        ₱
                        {selectedPayments
                          .reduce((sum, p) => sum + (p.amount || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                No payment information available for this reservation.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
