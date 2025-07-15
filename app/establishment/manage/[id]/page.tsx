'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { PaymentStatus } from '@/lib/enums/payment-status.enum';
import { ReservationStatus } from '@/lib/enums/reservation-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export interface ParkingSpace {
  _id: string;
  city: string;
  establishment_name: string;
  address: string;
  total_spaces: number;
  available_spaces: number;
  hourlyRate: number;
  whole_day_rate: number;
  availability_status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
  reservations?: Reservation[];
}

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

export interface Vehicle {
  _id: string;
  user_id: string;
  vehicle_type: string;
  year_make_model: string;
  color: string;
  plate_number: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
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
  analytics: Analytics;
  vehicle: Vehicle;
  user: User;
  parking_space?: ParkingSpace;
}

interface Analytics {
  totalRevenue: number;
  totalReservations: number;
  averageOccupancy: number;
  peakHour: string;
}

interface Feedback {
  _id: string;
  user_id: string;
  parking_space_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export default function ManageParkingSpace({
  params,
}: {
  params: { id: string };
}) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [parkingSpace, setParkingSpace] = useState<ParkingSpace | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.ADMIN)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchParkingSpaceData = async () => {
      if (!token || !params.id) return;

      try {
        // Fetch parking space details
        const spaceRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!spaceRes.ok) throw new Error('Failed to fetch parking space');
        const spaceData = await spaceRes.json();
        setParkingSpace(spaceData);
        setReservations(spaceData.reservations ?? []);
        setAnalytics(spaceData.analytics);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Unable to load parking space data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParkingSpaceData();
  }, [token, params.id, toast]);

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!params.id || !token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feedback/parking-space/${params.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch feedbacks');
        const data = await res.json();
        setFeedbacks(data);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }
    };

    fetchFeedbacks();
  }, [params.id, token]);

  // Filter reservations based on search query
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;

    const query = searchQuery.toLowerCase();
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
  }, [reservations, searchQuery]);

  const handleUpdateSpace = async () => {
    if (!parkingSpace || !token) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${params.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            establishment_name: parkingSpace.establishment_name,
            address: parkingSpace.address,
            city: parkingSpace.city,
            total_spaces: parkingSpace.total_spaces,
            available_spaces: parkingSpace.available_spaces,
            hourlyRate: parkingSpace.hourlyRate,
            whole_day_rate: parkingSpace.whole_day_rate,
            availability_status: parkingSpace.availability_status,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to update parking space');

      toast({
        title: 'Success',
        description: 'Parking space updated successfully.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update parking space.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReservationStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
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

      // Refresh reservations
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

  // Render stars for feedback display
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  // Calculate average rating
  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) /
        feedbacks.length
      : 0;

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

  if (loading || isLoading || !parkingSpace) {
    return (
      <div className='min-h-screen bg-slate-100'>
        <Navbar />
        <main className='max-w-7xl mx-auto px-6 py-8'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 rounded w-1/4 mb-6'></div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='h-32 bg-gray-300 rounded'></div>
              <div className='h-32 bg-gray-300 rounded'></div>
              <div className='h-32 bg-gray-300 rounded'></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-100'>
      <Navbar />

      <main className='mx-auto px-6 py-8' style={{ maxWidth: '80%' }}>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push('/establishment/dashboard')}
          className='text-gray-600 hover:text-gray-800 mb-8'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-4'>
            <div>
              <h1 className='text-2xl font-semibold text-gray-800'>
                {parkingSpace.establishment_name}
              </h1>
              <p className='text-gray-600 flex items-center'>
                <MapPin className='h-4 w-4 mr-1' />
                {parkingSpace.address}
              </p>
            </div>
          </div>
          <Badge
            className={getStatusBadgeClass(parkingSpace.availability_status)}
          >
            {parkingSpace.availability_status}
          </Badge>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
            <TabsTrigger value='reservations'>Reservations</TabsTrigger>
            <TabsTrigger value='feedback'>Feedback</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Quick Stats */}
            {analytics && (
              <>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  <Card className='bg-white'>
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-2'>
                        <DollarSign className='h-5 w-5 text-green-600' />
                        <div>
                          <div className='text-2xl font-bold'>
                            ₱{analytics.totalRevenue.toLocaleString()}
                          </div>
                          <p className='text-gray-600'>Total Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-white'>
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-2'>
                        <Users className='h-5 w-5 text-blue-600' />
                        <div>
                          <div className='text-2xl font-bold'>
                            {analytics.totalReservations}
                          </div>
                          <p className='text-gray-600'>Total Reservations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-white'>
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-2'>
                        <TrendingUp className='h-5 w-5 text-purple-600' />
                        <div>
                          <div className='text-2xl font-bold'>
                            {analytics.averageOccupancy}%
                          </div>
                          <p className='text-gray-600'>Avg. Occupancy</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-white'>
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-2'>
                        <Clock className='h-5 w-5 text-orange-600' />
                        <div>
                          <div className='text-lg font-bold'>
                            {analytics.peakHour}
                          </div>
                          <p className='text-gray-600'>Peak Hour</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <Card className='bg-white'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <Car className='h-5 w-5 text-blue-600' />
                    <div>
                      <div className='text-2xl font-bold'>
                        {parkingSpace.total_spaces}
                      </div>
                      <p className='text-gray-600'>Total Spaces</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <div className='h-3 w-3 rounded-full bg-green-500'></div>
                    <div>
                      <div className='text-2xl font-bold text-green-600'>
                        {parkingSpace.available_spaces}
                      </div>
                      <p className='text-gray-600'>Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <div className='h-3 w-3 rounded-full bg-red-500'></div>
                    <div>
                      <div className='text-2xl font-bold text-red-600'>
                        {parkingSpace.total_spaces -
                          parkingSpace.available_spaces}
                      </div>
                      <p className='text-gray-600'>Occupied</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='h-5 w-5 text-green-600' />
                    <div>
                      <div className='text-2xl font-bold'>
                        ₱{parkingSpace.hourlyRate}
                      </div>
                      <p className='text-gray-600'>Hourly Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Occupancy Chart */}
            <Card className='bg-white'>
              <CardHeader>
                <CardTitle>Space Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>Occupancy Rate</span>
                    <span className='text-sm text-gray-600'>
                      {Math.round(
                        ((parkingSpace.total_spaces -
                          parkingSpace.available_spaces) /
                          parkingSpace.total_spaces) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-3'>
                    <div
                      className='bg-blue-600 h-3 rounded-full transition-all duration-300'
                      style={{
                        width: `${
                          ((parkingSpace.total_spaces -
                            parkingSpace.available_spaces) /
                            parkingSpace.total_spaces) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div className='text-center'>
                      <div className='font-semibold text-green-600'>
                        {parkingSpace.available_spaces}
                      </div>
                      <div className='text-gray-600'>Available</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold text-red-600'>
                        {parkingSpace.total_spaces -
                          parkingSpace.available_spaces}
                      </div>
                      <div className='text-gray-600'>Occupied</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold'>
                        {parkingSpace.total_spaces}
                      </div>
                      <div className='text-gray-600'>Total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className='bg-white'>
              <CardHeader className='flex items-center justify-between'>
                <CardTitle>Recent Reservations</CardTitle>
                {reservations.length > 5 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-blue-600 hover:text-blue-800'
                    onClick={() => setActiveTab('reservations')}
                  >
                    Show More →
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {reservations.slice(0, 5).map((reservation) => (
                    <div
                      key={reservation._id}
                      className='border rounded-lg p-4 relative'
                    >
                      {/* Status badge in upper right */}
                      <div className='absolute top-4 right-4'>
                        <Badge
                          className={getReservationStatusBadge(
                            reservation.status
                          )}
                        >
                          {reservation.status}
                        </Badge>
                      </div>

                      {/* Main content with padding-right to avoid badge overlap */}
                      <div className='pr-20'>
                        <p className='font-medium'>
                          Reservation #{reservation._id}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {new Date(
                            reservation.start_time
                          ).toLocaleDateString()}{' '}
                          -{' '}
                          {new Date(reservation.start_time).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}{' '}
                          to{' '}
                          {new Date(reservation.end_time).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>

                        {reservation.payments?.length > 0 && (
                          <div className='mt-1 space-y-1 text-sm text-gray-600'>
                            {reservation.payments.map((payment: Payment) => (
                              <div key={payment._id}>
                                Payment via{' '}
                                <span className='capitalize'>
                                  {payment.payment_method}
                                </span>{' '}
                                {payment.payment_status} on{' '}
                                {new Date(
                                  payment.payment_date
                                ).toLocaleDateString()}
                                {payment.receipt_number ? (
                                  <>
                                    {' '}
                                    with Receipt No.:{' '}
                                    <span className='font-mono'>
                                      {payment.receipt_number}
                                    </span>
                                  </>
                                ) : payment.payment_status ===
                                  PaymentStatus.PENDING ? (
                                  <></>
                                ) : (
                                  <span className='text-red-500 italic'>
                                    {' '}
                                    — No receipt issued
                                  </span>
                                )}
                                <p className='mt-2'>
                                  Name:{' '}
                                  {reservation.user
                                    ? `${reservation.user.first_name} ${reservation.user.last_name}`
                                    : 'Unknown User'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Enhanced Vehicle Information */}
                        {reservation.vehicle && (
                          <div className='mt-2 text-sm text-gray-600'>
                            <div className=''>
                              <p className='text-sm text-gray-700'>
                                Vehicle: {reservation.vehicle.year_make_model} (
                                {reservation.vehicle.vehicle_type})
                              </p>
                              <p className='text-sm mt-2 text-gray-700'>
                                Plate: {reservation.vehicle.plate_number}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      No reservations found for this parking space.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <Card className='bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Settings className='h-5 w-5' />
                  <span>Parking Space Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='establishmentName'>
                        Establishment Name
                      </Label>
                      <Input
                        id='establishmentName'
                        value={parkingSpace.establishment_name}
                        onChange={(e) =>
                          setParkingSpace({
                            ...parkingSpace,
                            establishment_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='city'>City</Label>
                      <Input
                        id='city'
                        value={parkingSpace.city}
                        onChange={(e) =>
                          setParkingSpace({
                            ...parkingSpace,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='address'>Address</Label>
                      <Textarea
                        id='address'
                        value={parkingSpace.address}
                        onChange={(e) =>
                          setParkingSpace({
                            ...parkingSpace,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='totalSpaces'>Total Spaces</Label>
                        <Input
                          id='totalSpaces'
                          type='number'
                          value={parkingSpace.total_spaces}
                          onChange={(e) =>
                            setParkingSpace({
                              ...parkingSpace,
                              total_spaces: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor='availableSpaces'>
                          Available Spaces
                        </Label>
                        <Input
                          id='availableSpaces'
                          type='number'
                          value={parkingSpace.available_spaces}
                          onChange={(e) =>
                            setParkingSpace({
                              ...parkingSpace,
                              available_spaces: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='hourlyRate'>Hourly Rate (₱)</Label>
                        <Input
                          id='hourlyRate'
                          type='number'
                          step='0.01'
                          value={parkingSpace.hourlyRate}
                          onChange={(e) =>
                            setParkingSpace({
                              ...parkingSpace,
                              hourlyRate: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor='wholeDayRate'>Whole Day Rate (₱)</Label>
                        <Input
                          id='wholeDayRate'
                          type='number'
                          step='0.01'
                          value={parkingSpace.whole_day_rate}
                          onChange={(e) =>
                            setParkingSpace({
                              ...parkingSpace,
                              whole_day_rate: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='availabilityStatus'>
                        Availability Status
                      </Label>
                      <Select
                        value={parkingSpace.availability_status}
                        onValueChange={(value: AvailabilityStatus) =>
                          setParkingSpace({
                            ...parkingSpace,
                            availability_status: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select availability status'>
                            {parkingSpace.availability_status}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AvailabilityStatus.OPEN}>
                            {AvailabilityStatus.OPEN}
                          </SelectItem>
                          <SelectItem value={AvailabilityStatus.CLOSED}>
                            {AvailabilityStatus.CLOSED}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end space-x-4 pt-6 border-t'>
                  <Button
                    variant='outline'
                    onClick={() => router.push('/establishment/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateSpace}
                    disabled={isSaving}
                    className='bg-blue-900 hover:bg-blue-800'
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value='reservations' className='space-y-6'>
            <Card className='bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Calendar className='h-5 w-5' />
                  <span>All Reservations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className='mb-6'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      placeholder='Search by reservation ID, customer, vehicle, or establishment...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  {searchQuery && (
                    <div className='mt-2 text-sm text-gray-600'>
                      Showing {filteredReservations.length} of{' '}
                      {reservations.length} reservations
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

                {filteredReservations.length === 0 && searchQuery && (
                  <div className='text-center py-8 text-gray-500'>
                    No reservations found matching "{searchQuery}".
                  </div>
                )}
                {reservations.length === 0 && !searchQuery && (
                  <div className='text-center py-8 text-gray-500'>
                    No reservations found for this parking space.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value='feedback' className='space-y-6'>
            <Card className='bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <MessageSquare className='h-5 w-5' />
                  <span>Customer Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Average Rating Summary */}
                {feedbacks.length > 0 && (
                  <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                          Overall Rating
                        </h3>
                        <div className='flex items-center space-x-2'>
                          <div className='flex items-center'>
                            {renderStars(Math.round(averageRating))}
                          </div>
                          <span className='text-2xl font-bold text-gray-800'>
                            {averageRating.toFixed(1)}
                          </span>
                          <span className='text-gray-600'>
                            ({feedbacks.length} review
                            {feedbacks.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-3xl font-bold text-blue-600'>
                          {feedbacks.length}
                        </div>
                        <div className='text-sm text-gray-600'>
                          Total Reviews
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback List */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                    Recent Reviews
                  </h3>

                  {feedbacks.length > 0 ? (
                    <div className='space-y-4 max-h-96 overflow-y-auto'>
                      {feedbacks.map((feedback) => (
                        <div
                          key={feedback._id}
                          className='bg-gray-50 border border-gray-200 rounded-lg p-4'
                        >
                          <div className='flex items-start justify-between mb-3'>
                            <div className='flex items-center space-x-2'>
                              <div className='flex items-center'>
                                {renderStars(feedback.rating)}
                              </div>
                              <span className='text-sm font-medium text-gray-700'>
                                {feedback.rating}/5 stars
                              </span>
                            </div>
                            <div className='text-xs text-gray-500'>
                              {new Date(feedback.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </div>
                          </div>

                          <p className='text-gray-700 mb-3 leading-relaxed'>
                            {feedback.comment}
                          </p>

                          <div className='flex items-center text-sm text-gray-500'>
                            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2'>
                              <span className='text-blue-600 font-medium'>
                                {feedback.user?.first_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span>
                              {feedback.user
                                ? `${feedback.user.first_name} ${feedback.user.last_name}`
                                : 'Anonymous User'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <MessageSquare className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-lg font-medium text-gray-500 mb-2'>
                        No Reviews Yet
                      </h3>
                      <p className='text-gray-400'>
                        Customer feedback will appear here once users start
                        leaving reviews.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
