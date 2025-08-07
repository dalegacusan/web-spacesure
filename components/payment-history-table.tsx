'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentStatus } from '@/lib/enums/payment-status.enum';
import { Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Payment {
  _id: string;
  reservation_id: string;
  payment_method: string;
  amount: number;
  payment_status: string;
  payment_date: string;
  receipt_number: string;
  reference_number: string;
  reservation: {
    _id: string;
    user_id: string;
    vehicle_id: string;
    parking_space_id: string;
    start_time: string;
    end_time: string;
    reservation_type: 'hourly' | 'whole_day';
  };
  user: {
    _id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
  };
  vehicle: {
    plate_number: string;
  };
  parking_space: {
    establishment_name: string;
    city: string;
  };
}

interface Props {
  data: Payment[];
}

interface FilterState {
  status: string;
  paymentMethod: string;
  reservationType: string;
  dateRange: string;
  amountRange: string;
  city: string;
}

export default function PaymentHistoryTable({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentMethod: 'all',
    reservationType: 'all',
    dateRange: 'all',
    amountRange: 'all',
    city: 'all',
  });

  // Get unique values for filter options
  const uniqueCities = useMemo(() => {
    const cities = [
      ...new Set(
        data.map((payment) => payment.parking_space?.city).filter(Boolean)
      ),
    ];
    return cities.sort();
  }, [data]);

  const uniquePaymentMethods = useMemo(() => {
    const methods = [
      ...new Set(data.map((payment) => payment.payment_method).filter(Boolean)),
    ];
    return methods.sort();
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

  // Helper function to check if a date is within a range
  const isWithinDateRange = (dateString: string, range: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return isToday(dateString);
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        return date >= yesterday && date < yesterdayEnd;
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return date >= weekStart;
      case 'this_month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return date >= monthStart;
      case 'last_month':
        const lastMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
        return date >= lastMonthStart && date < lastMonthEnd;
      default:
        return true;
    }
  };

  // Filter payments based on search query and filters
  const filteredPayments = useMemo(() => {
    let filtered = data;

    // Apply search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((payment) => {
        const customerName = `${payment.user.first_name} ${
          payment.user.middle_name || ''
        } ${payment.user.last_name}`.toLowerCase();
        return (
          payment.receipt_number?.toLowerCase().includes(query) ||
          payment.reservation?._id?.toLowerCase().includes(query) ||
          customerName.includes(query) ||
          payment.parking_space?.establishment_name
            ?.toLowerCase()
            .includes(query) ||
          payment.parking_space?.city?.toLowerCase().includes(query) ||
          payment.vehicle?.plate_number?.toLowerCase().includes(query) ||
          payment.payment_method?.toLowerCase().includes(query)
        );
      });
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(
        (payment) => payment.payment_status === filters.status
      );
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      filtered = filtered.filter(
        (payment) => payment.payment_method === filters.paymentMethod
      );
    }

    if (filters.reservationType && filters.reservationType !== 'all') {
      filtered = filtered.filter(
        (payment) =>
          payment.reservation?.reservation_type === filters.reservationType
      );
    }

    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(
        (payment) => payment.parking_space?.city === filters.city
      );
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      filtered = filtered.filter((payment) =>
        isWithinDateRange(payment.payment_date, filters.dateRange)
      );
    }

    if (filters.amountRange && filters.amountRange !== 'all') {
      filtered = filtered.filter((payment) => {
        const amount = payment.amount;
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
  }, [data, searchTerm, filters]);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentMethod: 'all',
      reservationType: 'all',
      dateRange: 'all',
      amountRange: 'all',
      city: 'all',
    });
    setSearchTerm('');
  };

  const activeFiltersCount =
    Object.values(filters).filter(
      (value) => value && value !== '' && value !== 'all'
    ).length + (searchTerm ? 1 : 0);

  // Quick filter buttons data
  const todaysPayments = data.filter((payment) =>
    isToday(payment.payment_date)
  );
  const completedPayments = data.filter(
    (payment) => payment.payment_status === PaymentStatus.COMPLETED
  );
  const pendingPayments = data.filter(
    (payment) => payment.payment_status === PaymentStatus.PENDING
  );
  const failedPayments = data.filter(
    (payment) => payment.payment_status === PaymentStatus.FAILED
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'default';
      case PaymentStatus.PENDING:
        return 'secondary';
      case PaymentStatus.FAILED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className='space-y-6'>
      <Card className='bg-white'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <span>Today ({todaysPayments.length})</span>
            </Button>
            <Button
              variant={
                filters.status === PaymentStatus.COMPLETED
                  ? 'default'
                  : 'outline'
              }
              size='sm'
              onClick={() => {
                if (filters.status === PaymentStatus.COMPLETED) {
                  setFilters({ ...filters, status: 'all' });
                } else {
                  setFilters({ ...filters, status: PaymentStatus.COMPLETED });
                }
              }}
            >
              Completed ({completedPayments.length})
            </Button>
            <Button
              variant={
                filters.status === PaymentStatus.PENDING ? 'default' : 'outline'
              }
              size='sm'
              onClick={() => {
                if (filters.status === PaymentStatus.PENDING) {
                  setFilters({ ...filters, status: 'all' });
                } else {
                  setFilters({ ...filters, status: PaymentStatus.PENDING });
                }
              }}
            >
              Pending ({pendingPayments.length})
            </Button>
            <Button
              variant={
                filters.status === PaymentStatus.FAILED ? 'default' : 'outline'
              }
              size='sm'
              onClick={() => {
                if (filters.status === PaymentStatus.FAILED) {
                  setFilters({ ...filters, status: 'all' });
                } else {
                  setFilters({ ...filters, status: PaymentStatus.FAILED });
                }
              }}
            >
              Failed ({failedPayments.length})
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className='mb-6 space-y-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              {/* Search Bar */}
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by receipt, reservation ID, customer name, establishment, or plate number...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {/* Payment Status Filter */}
                  <div>
                    <Label className='text-sm font-medium mb-2 block'>
                      Payment Status
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger className='h-9'>
                        <SelectValue placeholder='All Statuses' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Statuses</SelectItem>
                        <SelectItem value={PaymentStatus.COMPLETED}>
                          Completed
                        </SelectItem>
                        <SelectItem value={PaymentStatus.PENDING}>
                          Pending
                        </SelectItem>
                        <SelectItem value={PaymentStatus.FAILED}>
                          Failed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reservation Type Filter */}
                  <div>
                    <Label className='text-sm font-medium mb-2 block'>
                      Reservation Type
                    </Label>
                    <Select
                      value={filters.reservationType}
                      onValueChange={(value) =>
                        setFilters({ ...filters, reservationType: value })
                      }
                    >
                      <SelectTrigger className='h-9'>
                        <SelectValue placeholder='All Types' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Types</SelectItem>
                        <SelectItem value='hourly'>Hourly</SelectItem>
                        <SelectItem value='whole_day'>Whole Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <Label className='text-sm font-medium mb-2 block'>
                      Date Range
                    </Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) =>
                        setFilters({ ...filters, dateRange: value })
                      }
                    >
                      <SelectTrigger className='h-9'>
                        <SelectValue placeholder='All Dates' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Dates</SelectItem>
                        <SelectItem value='today'>Today</SelectItem>
                        <SelectItem value='yesterday'>Yesterday</SelectItem>
                        <SelectItem value='this_week'>This Week</SelectItem>
                        <SelectItem value='this_month'>This Month</SelectItem>
                        <SelectItem value='last_month'>Last Month</SelectItem>
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
            {(searchTerm || activeFiltersCount > 0) && (
              <div className='text-sm text-gray-600'>
                Showing {filteredPayments.length} of {data.length} payments
                {searchTerm && <span> matching "{searchTerm}"</span>}
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className='hidden lg:block'>
            <div className='bg-white rounded-lg shadow overflow-hidden'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Receipt No.
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Reservation ID
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Customer
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Establishment
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Payment Method
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Amount
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        {payment.receipt_number || 'N/A'}
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        <div
                          className='max-w-[120px] truncate'
                          title={payment.reservation?._id}
                        >
                          {payment.reservation?._id || 'N/A'}
                        </div>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        <div>
                          <div className='font-medium'>
                            {`${payment.user.first_name} ${
                              payment.user.middle_name || ''
                            } ${payment.user.last_name}`}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {payment.vehicle?.plate_number || 'No Plate'}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        <div>
                          <div className='font-medium'>
                            {payment.parking_space?.establishment_name || 'N/A'}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {payment.parking_space?.city || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        <Badge variant='outline' className='capitalize'>
                          {payment.payment_method}
                        </Badge>
                      </td>
                      <td className='px-4 py-4 text-sm font-medium text-[#3B4A9C]'>
                        ₱{payment.amount.toFixed(2)}
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500'>
                        {new Date(payment.payment_date).toLocaleString(
                          'en-PH',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }
                        )}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <Badge variant={getStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className='lg:hidden space-y-4'>
            {filteredPayments.map((payment) => (
              <Card key={payment._id}>
                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <CardTitle className='text-lg'>
                        {payment.receipt_number || 'No Receipt'}
                      </CardTitle>
                      <p className='text-sm text-gray-500'>
                        {payment.reservation?._id}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(payment.payment_status)}>
                      {payment.payment_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='grid grid-cols-1 gap-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-500'>
                        Customer:
                      </span>
                      <p>
                        {`${payment.user.first_name} ${
                          payment.user.middle_name || ''
                        } ${payment.user.last_name}`}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {payment.vehicle?.plate_number || 'No Plate'}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-500'>
                        Establishment:
                      </span>
                      <p>
                        {payment.parking_space?.establishment_name || 'N/A'}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {payment.parking_space?.city || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-500'>
                        Payment Method:
                      </span>
                      <Badge variant='outline' className='capitalize ml-2'>
                        {payment.payment_method}
                      </Badge>
                    </div>
                    <div>
                      <span className='font-medium text-gray-500'>Amount:</span>
                      <p className='font-bold text-[#3B4A9C]'>
                        ₱{payment.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-500'>Date:</span>
                      <p>
                        {new Date(payment.payment_date).toLocaleString(
                          'en-PH',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPayments.length === 0 &&
            (searchTerm || activeFiltersCount > 0) && (
              <div className='text-center py-8'>
                <p className='text-gray-500'>
                  No payments found matching your search criteria.
                </p>
              </div>
            )}

          {data.length === 0 && !searchTerm && activeFiltersCount === 0 && (
            <div className='text-center py-8'>
              <p className='text-gray-500'>No payments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
