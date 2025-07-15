'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaymentStatus } from '@/lib/enums/payment-status.enum';
import { useEffect, useState } from 'react';

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
  };
}

interface Props {
  data: Payment[];
}

export default function PaymentHistoryTable({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState(data);

  useEffect(() => {
    setFilteredPayments(
      data.filter((payment) => {
        const customerName = `${payment.user.first_name} ${
          payment.user.middle_name || ''
        } ${payment.user.last_name}`.toLowerCase();
        return (
          payment.receipt_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.reservation?._id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customerName.includes(searchTerm.toLowerCase()) ||
          payment.parking_space?.establishment_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      })
    );
  }, [searchTerm, data]);

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
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search by receipt, reservation ID, customer name, or establishment...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='flex-1'
        />
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
                <tr key={payment._id}>
                  <td className='px-4 py-4 text-sm text-gray-500'>
                    {payment.receipt_number || 'N/A'}
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-500'>
                    {payment.reservation?._id || 'N/A'}
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-500'>
                    <div>{`${payment.user.first_name} ${
                      payment.user.middle_name || ''
                    } ${payment.user.last_name}`}</div>
                    <div className='text-xs text-gray-400'>
                      {payment.vehicle?.plate_number || 'No Plate'}
                    </div>
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-500'>
                    {payment.parking_space?.establishment_name || 'N/A'}
                  </td>
                  <td className='px-4 py-4 text-sm font-medium text-[#3B4A9C]'>
                    ₱{payment.amount.toFixed(2)}
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-500'>
                    {new Date(payment.payment_date).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
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
                  <span className='font-medium text-gray-500'>Customer:</span>
                  <p>{`${payment.user.first_name} ${
                    payment.user.middle_name || ''
                  } ${payment.user.last_name}`}</p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>
                    Establishment:
                  </span>
                  <p>{payment.parking_space?.establishment_name || 'N/A'}</p>
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
                    {new Date(payment.payment_date).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>No payments found.</p>
        </div>
      )}
    </div>
  );
}
