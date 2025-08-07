'use client';

import { useAuth } from '@/app/context/auth.context';
import type { Reservation } from '@/app/establishment/manage/[id]/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import { formatDateToLong, formatUtcTo12HourTime } from '@/lib/utils';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
  data: Reservation[];
}

interface FilterState {
  status: string;
  paymentStatus: string;
  reservationType: string;
  dateRange: string;
  amountRange: string;
}

export default function ReservationsTable({ data }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentStatus: 'all',
    reservationType: 'all',
    dateRange: 'all',
    amountRange: 'all',
  });

  useEffect(() => {
    if (data.length > 0) {
      setFilteredReservations(data);
    }
  }, [data]);

  // Helper function to check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Helper function to check if a date is upcoming (today or future)
  const isUpcoming = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Get today's reservations
  const todaysReservations = useMemo(() => {
    return data.filter((r) => isToday(r.start_time));
  }, [data]);

  // Get upcoming reservations (today and future)
  const upcomingReservations = useMemo(() => {
    return data.filter((r) => isUpcoming(r.start_time));
  }, [data]);

  // Filter reservations based on search query and filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((reservation) => {
        // Search by reservation ID
        if (reservation._id.toLowerCase().includes(query)) return true;
        // Search by vehicle plate number
        if (reservation.vehicle?.plate_number?.toLowerCase().includes(query))
          return true;
        // Search by vehicle type
        if (reservation.vehicle?.vehicle_type?.toLowerCase().includes(query))
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
        // Search by customer name
        if (
          reservation.user &&
          `${reservation.user.first_name} ${reservation.user.last_name}`
            .toLowerCase()
            .includes(query)
        )
          return true;
        // Search by establishment name
        if (
          reservation.parking_space?.establishment_name
            ?.toLowerCase()
            .includes(query)
        )
          return true;
        return false;
      });
    }

    // Apply filters - only filter if a specific value is selected (not 'all' or empty string)
    if (filters.status && filters.status !== '' && filters.status !== 'all') {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    if (
      filters.paymentStatus &&
      filters.paymentStatus !== '' &&
      filters.paymentStatus !== 'all'
    ) {
      filtered = filtered.filter((r) => {
        const paymentStatus = r.payments?.[0]?.payment_status || 'PENDING';
        return paymentStatus === filters.paymentStatus;
      });
    }

    if (
      filters.reservationType &&
      filters.reservationType !== '' &&
      filters.reservationType !== 'all'
    ) {
      filtered = filtered.filter(
        (r) => r.reservation_type === filters.reservationType
      );
    }

    if (
      filters.dateRange &&
      filters.dateRange !== '' &&
      filters.dateRange !== 'all'
    ) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      filtered = filtered.filter((r) => {
        const reservationStartDate = new Date(r.start_time);
        const reservationCreatedDate = new Date(r.created_at);

        switch (filters.dateRange) {
          case 'today':
            return isToday(r.start_time);
          case 'upcoming':
            return isUpcoming(r.start_time);
          case 'tomorrow':
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            return (
              reservationStartDate >= tomorrow &&
              reservationStartDate < tomorrowEnd
            );
          case 'this_week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return (
              reservationStartDate >= today && reservationStartDate < weekEnd
            );
          case 'created_today':
            return isToday(r.created_at);
          case 'created_yesterday':
            return (
              reservationCreatedDate >= yesterday &&
              reservationCreatedDate < today
            );
          case 'created_last_week':
            return reservationCreatedDate >= lastWeek;
          case 'created_last_month':
            return reservationCreatedDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    if (
      filters.amountRange &&
      filters.amountRange !== '' &&
      filters.amountRange !== 'all'
    ) {
      filtered = filtered.filter((r) => {
        const amount = r.total_price;
        switch (filters.amountRange) {
          case 'under_100':
            return amount < 100;
          case '100_500':
            return amount >= 100 && amount <= 500;
          case '500_1000':
            return amount >= 500 && amount <= 1000;
          case 'over_1000':
            return amount > 1000;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [data, searchQuery, filters]);

  useEffect(() => {
    setFilteredReservations(filteredData);
  }, [filteredData]);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      reservationType: 'all',
      dateRange: 'all',
      amountRange: 'all',
    });
    setSearchQuery('');
  };

  const activeFiltersCount =
    Object.values(filters).filter(
      (value) => value && value !== '' && value !== 'all'
    ).length + (searchQuery ? 1 : 0);

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

  // Extract unique cities from the data
  const cities = [
    ...new Set(data.map((r) => r.parking_space?.city).filter(Boolean)),
  ] as string[];

  return (
    <div className='space-y-6'>
      {/* Quick Filter Buttons */}
      <div className='mb-4 flex flex-wrap gap-2'>
        <Button
          variant={filters.dateRange === 'today' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.dateRange === 'today') {
              setFilters({ ...filters, dateRange: 'all' });
            } else {
              setFilters({ ...filters, dateRange: 'today' });
            }
          }}
          className='flex items-center space-x-1'
        >
          <Clock className='h-4 w-4' />
          <span>Today's Incoming ({todaysReservations.length})</span>
        </Button>
        <Button
          variant={filters.dateRange === 'upcoming' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.dateRange === 'upcoming') {
              setFilters({ ...filters, dateRange: 'all' });
            } else {
              setFilters({ ...filters, dateRange: 'upcoming' });
            }
          }}
          className='flex items-center space-x-1'
        >
          <Calendar className='h-4 w-4' />
          <span>Upcoming ({upcomingReservations.length})</span>
        </Button>
        <Button
          variant={filters.status === 'PAID' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.status === 'PAID') {
              setFilters({ ...filters, status: 'all' });
            } else {
              setFilters({ ...filters, status: 'PAID' });
            }
          }}
        >
          Paid
        </Button>
        <Button
          variant={filters.status === 'COMPLETED' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.status === 'COMPLETED') {
              setFilters({ ...filters, status: 'all' });
            } else {
              setFilters({ ...filters, status: 'COMPLETED' });
            }
          }}
        >
          Completed
        </Button>
        <Button
          variant={filters.paymentStatus === 'PENDING' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.paymentStatus === 'PENDING') {
              setFilters({ ...filters, paymentStatus: 'all' });
            } else {
              setFilters({ ...filters, paymentStatus: 'PENDING' });
            }
          }}
        >
          Pending Payment
        </Button>
        <Button
          variant={filters.status === 'CANCELLED' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            if (filters.status === 'CANCELLED') {
              setFilters({ ...filters, status: 'all' });
            } else {
              setFilters({ ...filters, status: 'CANCELLED' });
            }
          }}
        >
          Cancelled
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className='mb-6 space-y-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search Bar */}
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search by reservation ID, customer, vehicle, or establishment...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          {/* Filter Toggle Button */}
          <Button
            variant='outline'
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center space-x-2'
          >
            <Filter className='h-4 w-4' />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* Status Filter */}
              <div>
                <Label className='text-sm font-medium mb-2 block'>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className='h-9 bg-white'>
                    <SelectValue placeholder='All Statuses' />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='CREATED'>Created</SelectItem>
                    <SelectItem value='PAID'>Paid</SelectItem>
                    <SelectItem value='COMPLETED'>Completed</SelectItem>
                    <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <Label className='text-sm font-medium mb-2 block'>
                  Payment
                </Label>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) =>
                    setFilters({ ...filters, paymentStatus: value })
                  }
                >
                  <SelectTrigger className='h-9 bg-white'>
                    <SelectValue placeholder='All Payments' />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value='all'>All Payments</SelectItem>
                    <SelectItem value='COMPLETED'>Completed</SelectItem>
                    <SelectItem value='PENDING'>Pending</SelectItem>
                    <SelectItem value='FAILED'>Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reservation Type Filter */}
              <div>
                <Label className='text-sm font-medium mb-2 block'>Type</Label>
                <Select
                  value={filters.reservationType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, reservationType: value })
                  }
                >
                  <SelectTrigger className='h-9 bg-white'>
                    <SelectValue placeholder='All Types' />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='hourly'>Hourly</SelectItem>
                    <SelectItem value='whole_day'>Whole Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <Label className='text-sm font-medium mb-2 block'>
                  Reservation Date
                </Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters({ ...filters, dateRange: value })
                  }
                >
                  <SelectTrigger className='h-9 bg-white'>
                    <SelectValue placeholder='All Dates' />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value='all'>All Dates</SelectItem>
                    <SelectItem value='today'>Today</SelectItem>
                    <SelectItem value='upcoming'>Upcoming</SelectItem>
                    <SelectItem value='tomorrow'>Tomorrow</SelectItem>
                    <SelectItem value='this_week'>This Week</SelectItem>
                    <SelectItem value='created_today'>Created Today</SelectItem>
                    <SelectItem value='created_yesterday'>
                      Created Yesterday
                    </SelectItem>
                    <SelectItem value='created_last_week'>
                      Created Last Week
                    </SelectItem>
                    <SelectItem value='created_last_month'>
                      Created Last Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={clearFilters}
                  className='text-gray-600 hover:text-gray-800'
                >
                  <X className='h-4 w-4 mr-2' />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {(searchQuery || activeFiltersCount > 0) && (
          <div className='text-sm text-gray-600'>
            Showing {filteredReservations.length} of {data.length} reservations
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className='hidden lg:block'>
        <div className='bg-white rounded-lg shadow overflow-x-auto'>
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
                function formatDateRange(start: string, end: string) {
                  const startDate = new Date(start);
                  const endDate = new Date(end);
                  const startDateISO = startDate.toISOString().split('T')[0];
                  const endDateISO = endDate.toISOString().split('T')[0];
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
                        <div>{formatDateRange(r.start_time, r.end_time)}</div>
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
                          paymentStatus === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : paymentStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : paymentStatus === 'FAILED'
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
                      paymentStatus === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : paymentStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : paymentStatus === 'FAILED'
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

      {filteredReservations.length === 0 &&
        (searchQuery || activeFiltersCount > 0) && (
          <div className='text-center py-8 text-gray-500'>
            No reservations found matching your search criteria.
          </div>
        )}

      {data.length === 0 && !searchQuery && activeFiltersCount === 0 && (
        <div className='text-center py-8 text-gray-500'>
          No reservations found.
        </div>
      )}
    </div>
  );
}
