'use client';

import { useAuth } from '@/app/context/auth.context';
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
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  MapPin,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface Payment {
  _id: string;
  reservation_id: string;
  payment_method: string;
  amount: number;
  payment_status: string;
  payment_date: string;
  receipt_number: string;
  reference_number: string;
}

interface User {
  first_name: string;
  middle_name: string;
  last_name: string;
}

interface Vehicle {
  _id: string;
  user_id: string;
  vehicle_type: string;
  year_make_model: string;
  color: string;
  plate_number: string;
  created_at: string;
  updated_at: string;
}

interface Reservation {
  _id: string;
  user_id: string;
  parking_space_id: string;
  vehicle_id: string;
  start_time: string;
  end_time: string;
  reservation_type: 'hourly' | 'whole_day';
  hourly_rate: number;
  whole_day_rate: number;
  discount: number;
  tax: number;
  total_price: number;
  discount_note: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
  vehicle: Vehicle;
  user: User;
}

interface ParkingEstablishment {
  _id: string;
  establishment_name: string;
  address: string;
  city: string;
  total_spaces: number;
  available_spaces: number;
  hourlyRate: number;
  whole_day_rate: number;
  availability_status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
  reservations?: Reservation[];
}

export default function ParkingManagement() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [establishments, setEstablishments] = useState<ParkingEstablishment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedEstablishment, setSelectedEstablishment] =
    useState<ParkingEstablishment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');

  // Action states
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
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setEstablishments(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Unable to load establishments.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();
  }, [token, toast]);

  // Filter establishments based on search term
  const filteredEstablishments = useMemo(() => {
    if (!searchTerm.trim()) return establishments;

    const query = searchTerm.toLowerCase();
    return establishments.filter(
      (establishment) =>
        establishment.establishment_name.toLowerCase().includes(query) ||
        establishment.city.toLowerCase().includes(query) ||
        establishment.address.toLowerCase().includes(query)
    );
  }, [establishments, searchTerm]);

  // Filter reservations based on search query
  const filteredReservations = useMemo(() => {
    if (!reservationSearchQuery.trim()) return reservations;

    const query = reservationSearchQuery.toLowerCase();
    return reservations.filter((reservation) => {
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
      return false;
    });
  }, [reservations, reservationSearchQuery]);

  const handleViewReservations = async (
    establishment: ParkingEstablishment
  ) => {
    setSelectedEstablishment(establishment);
    setIsModalOpen(true);
    setIsLoadingReservations(true);
    setReservationSearchQuery('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${establishment._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch reservations');

      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Unable to load reservations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReservations(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const establishment = establishments.find((e) => e._id === id);
      if (!establishment) return;

      const newStatus =
        establishment.availability_status === AvailabilityStatus.OPEN
          ? AvailabilityStatus.CLOSED
          : AvailabilityStatus.OPEN;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...establishment,
            availability_status: newStatus,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to update status');

      setEstablishments((prev) =>
        prev.map((e) =>
          e._id === id ? { ...e, availability_status: newStatus } : e
        )
      );

      toast({
        title: 'Status Updated',
        description: `Establishment status changed to ${newStatus.toLowerCase()}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update establishment status.',
        variant: 'destructive',
      });
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

      // Update reservation status in state
      setReservations((prev) =>
        prev.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.CANCELLED }
            : r
        )
      );
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

      // Update reservation status in state
      setReservations((prev) =>
        prev.map((r) =>
          r._id === reservationId
            ? { ...r, status: ReservationStatus.COMPLETED }
            : r
        )
      );
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

  const getStatusBadgeClass = (status: AvailabilityStatus) => {
    switch (status) {
      case AvailabilityStatus.OPEN:
        return 'bg-green-100 text-green-800';
      case AvailabilityStatus.CLOSED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Action buttons component for table
  const ActionButtons = ({ reservation }: { reservation: Reservation }) => {
    return (
      <div className='flex gap-2'>
        {/* Cancel Button - only for CREATED reservations */}
        {reservation.status === ReservationStatus.CREATED && (
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
        {reservation.status === ReservationStatus.PAID && (
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
        {reservation.status === ReservationStatus.CREATED && (
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
        {reservation.status === ReservationStatus.PAID && (
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

  if (loading || isLoading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-300 rounded w-1/4 mb-6'></div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='h-32 bg-gray-300 rounded'></div>
            <div className='h-32 bg-gray-300 rounded'></div>
            <div className='h-32 bg-gray-300 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h1 className='text-2xl font-semibold'>Parking Management</h1>
        <Link href='/admin/parking-management/add'>
          <Button className='bg-[#3B4A9C] hover:bg-[#2A3A7C] w-full sm:w-auto'>
            <Plus className='w-4 h-4 mr-2' />
            Add New Establishment
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search by name, city, or address...'
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
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Establishment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Location
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Spots
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Rate
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredEstablishments.map((establishment) => (
                <tr key={establishment._id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {establishment.establishment_name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {establishment.city}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    <div className='flex items-center'>
                      <MapPin className='w-4 h-4 mr-1' />
                      {establishment.address}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    <div>
                      <div>
                        {establishment.available_spaces}/
                        {establishment.total_spaces}
                      </div>
                      <div className='text-xs text-gray-400'>
                        Available/Total
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    ₱{establishment.hourlyRate}/hr
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <Badge
                      className={getStatusBadgeClass(
                        establishment.availability_status
                      )}
                    >
                      {establishment.availability_status}
                    </Badge>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='bg-blue-50 hover:bg-blue-100 border-blue-200'
                        onClick={() => handleViewReservations(establishment)}
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                      <Link
                        href={`/admin/parking-management/edit/${establishment._id}`}
                      >
                        <Button variant='outline' size='sm'>
                          <Edit className='w-4 h-4' />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className='lg:hidden space-y-4'>
        {filteredEstablishments.map((establishment) => (
          <Card key={establishment._id}>
            <CardHeader className='pb-3'>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-lg'>
                    {establishment.establishment_name}
                  </CardTitle>
                  <p className='text-sm text-gray-500 mt-1'>
                    {establishment.city}
                  </p>
                </div>
                <Badge
                  className={getStatusBadgeClass(
                    establishment.availability_status
                  )}
                >
                  {establishment.availability_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-start'>
                <MapPin className='w-4 h-4 mr-2 mt-0.5 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {establishment.address}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium text-gray-500'>
                    Available Spots:
                  </span>
                  <p>
                    {establishment.available_spaces}/
                    {establishment.total_spaces}
                  </p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>
                    Hourly Rate:
                  </span>
                  <p className='font-bold text-[#3B4A9C]'>
                    ₱{establishment.hourlyRate}
                  </p>
                </div>
              </div>
              <div className='flex gap-2 pt-2 border-t'>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200'
                  onClick={() => handleViewReservations(establishment)}
                >
                  <Eye className='w-4 h-4 mr-2' />
                  View Reservations
                </Button>
                <Link
                  href={`/admin/parking-management/edit/${establishment._id}`}
                  className='flex-1'
                >
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full bg-transparent'
                  >
                    <Edit className='w-4 h-4 mr-2' />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEstablishments.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No establishments found matching your search.
          </p>
        </div>
      )}

      {/* Reservations Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-[80%] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center space-x-2'>
              <Calendar className='h-5 w-5' />
              <span>
                Reservations - {selectedEstablishment?.establishment_name}
              </span>
            </DialogTitle>
            <p className='text-sm text-gray-600 flex items-center'>
              <MapPin className='h-4 w-4 mr-1' />
              {selectedEstablishment?.address}
            </p>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Search Bar */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search by reservation ID, customer, vehicle...'
                value={reservationSearchQuery}
                onChange={(e) => setReservationSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            {reservationSearchQuery && (
              <div className='text-sm text-gray-600'>
                Showing {filteredReservations.length} of {reservations.length}{' '}
                reservations
              </div>
            )}

            {isLoadingReservations ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className='hidden lg:block'>
                  <div className='bg-white rounded-lg border overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Reservation ID
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Customer
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Vehicle
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Date & Time
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Amount
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Status
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Payment
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
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
                              <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                <div className='max-w-[120px] ' title={r._id}>
                                  {r._id}
                                </div>
                              </td>
                              <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                                <div
                                  className='max-w-[100px] truncate'
                                  title={`${r.user.first_name} ${r.user.last_name}`}
                                >
                                  {r.user.first_name} {r.user.last_name}
                                </div>
                              </td>
                              <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                                {r.vehicle ? (
                                  <div className='text-sm text-gray-700 max-w-[100px]'>
                                    <div className='font-medium truncate'>
                                      {r.vehicle.vehicle_type}
                                    </div>
                                    <div className='text-gray-500 truncate'>
                                      {r.vehicle.plate_number}
                                    </div>
                                  </div>
                                ) : (
                                  'Unknown Vehicle'
                                )}
                              </td>
                              <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                                <div className='max-w-[100px]'>
                                  <div>{start.toISOString().split('T')[0]}</div>
                                  <div className='text-xs text-gray-400 truncate'>
                                    {timeRange}
                                  </div>
                                </div>
                              </td>
                              <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-[#3B4A9C]'>
                                ₱{r.total_price.toFixed(2)}
                              </td>
                              <td className='px-4 py-4 whitespace-nowrap'>
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
                              <td className='px-4 py-4 whitespace-nowrap'>
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
                              <td className='px-4 py-4 whitespace-nowrap relative'>
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
                <div className='lg:hidden space-y-4 max-h-96 overflow-y-auto'>
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
                      <div key={r._id} className='bg-gray-50 rounded-lg p-4'>
                        <div className='flex justify-between items-start mb-3'>
                          <div>
                            <h3 className='font-medium text-gray-900 truncate text-sm'>
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
                              Vehicle:
                            </span>
                            <p>
                              {r.vehicle ? (
                                <>
                                  <div className='font-semibold'>
                                    {r.vehicle.vehicle_type}
                                  </div>
                                  <div className='text-gray-600'>
                                    {r.vehicle.plate_number}
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

                {filteredReservations.length === 0 &&
                  reservationSearchQuery && (
                    <div className='text-center py-8 text-gray-500'>
                      No reservations found matching "{reservationSearchQuery}".
                    </div>
                  )}
                {reservations.length === 0 && !reservationSearchQuery && (
                  <div className='text-center py-8 text-gray-500'>
                    No reservations found for this establishment.
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
