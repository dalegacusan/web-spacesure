'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/lib/enums/roles.enum';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminDashboard() {
  const { user, loading, token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getReservationStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className='h-3 w-3' />;
      case 'pending':
        return <Clock className='h-3 w-3' />;
      case 'cancelled':
        return <XCircle className='h-3 w-3' />;
      case 'paid':
        return <DollarSign className='h-3 w-3' />;
      default:
        return <AlertCircle className='h-3 w-3' />;
    }
  };

  function formatDateRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const datePart = startDate.toLocaleDateString('en-PH', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const startTime = startDate.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} - ${startTime} to ${endTime}`;
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.role === UserRole.SUPER_ADMIN && token) {
      setIsLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch dashboard data');
          return res.json();
        })
        .then((data) => {
          setSummary(data);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to load dashboard summary', err);
          setError('Failed to load dashboard data. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [loading, token]);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  // Loading State
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <Navbar />
        <main className='max-w-7xl mx-auto px-6 py-8'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 rounded w-1/4 mb-8'></div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='h-32 bg-gray-300 rounded-xl'></div>
              ))}
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='h-96 bg-gray-300 rounded-xl'></div>
              <div className='h-96 bg-gray-300 rounded-xl'></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <Navbar />
        <main className='max-w-7xl mx-auto px-6 py-8'>
          <div className='text-center py-12'>
            <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>
              Something went wrong
            </h2>
            <p className='text-gray-600 mb-4'>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className='bg-blue-600 hover:bg-blue-700'
            >
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!summary) return null;

  const {
    total_users,
    total_establishments,
    total_reservations,
    total_revenue,
    recent_users,
    recent_reservations,
    parking_spaces,
  } = summary;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <Navbar />
      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Admin Dashboard
          </h1>
          <p className='text-gray-600'>
            Welcome back! Here's what's happening with your parking system.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-100 text-sm font-medium'>
                    Total Users
                  </p>
                  <p className='text-3xl font-bold'>{total_users}</p>
                </div>
                <div className='bg-white/20 p-3 rounded-full'>
                  <Users className='h-6 w-6' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-100 text-sm font-medium'>
                    Establishments
                  </p>
                  <p className='text-3xl font-bold'>{total_establishments}</p>
                </div>
                <div className='bg-white/20 p-3 rounded-full'>
                  <Building2 className='h-6 w-6' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-purple-100 text-sm font-medium'>
                    Reservations
                  </p>
                  <p className='text-3xl font-bold'>{total_reservations}</p>
                </div>
                <div className='bg-white/20 p-3 rounded-full'>
                  <Calendar className='h-6 w-6' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-orange-100 text-sm font-medium'>
                    Total Revenue
                  </p>
                  <p className='text-3xl font-bold'>
                    ₱{total_revenue.toFixed(2)}
                  </p>
                </div>
                <div className='bg-white/20 p-3 rounded-full'>
                  <DollarSign className='h-6 w-6' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* Recent Users */}
          <Card className='shadow-lg border-0 bg-white hover:shadow-xl transition-shadow duration-300'>
            <CardHeader className='border-b border-gray-100'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-2'>
                  <Users className='h-5 w-5 text-blue-600' />
                  <CardTitle className='text-lg font-semibold'>
                    Recent Users
                  </CardTitle>
                </div>
                <Button
                  onClick={() => (window.location.href = '/admin/users')}
                  variant='outline'
                  size='sm'
                  className='hover:bg-blue-50 hover:border-blue-300'
                >
                  View All
                  <ArrowRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {recent_users.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <User className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                  <p>No recent users found</p>
                </div>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {recent_users.map((user: any) => (
                    <div
                      key={user._id}
                      className='p-4 hover:bg-gray-50 transition-colors duration-200'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <div className='bg-blue-100 p-2 rounded-full'>
                            <User className='h-4 w-4 text-blue-600' />
                          </div>
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {user.first_name} {user.last_name}
                            </p>
                            <div className='flex items-center space-x-1 text-sm text-gray-500'>
                              <Mail className='h-3 w-3' />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <Badge
                            className={
                              user.role === 'SUPER_ADMIN'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : user.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {user.role}
                          </Badge>
                          <p className='text-xs text-gray-500 mt-1'>
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reservations */}
          <Card className='shadow-lg border-0 bg-white hover:shadow-xl transition-shadow duration-300'>
            <CardHeader className='border-b border-gray-100'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-2'>
                  <Activity className='h-5 w-5 text-green-600' />
                  <CardTitle className='text-lg font-semibold'>
                    Recent Reservations
                  </CardTitle>
                </div>
                <Button
                  onClick={() => (window.location.href = '/admin/reservations')}
                  variant='outline'
                  size='sm'
                  className='hover:bg-green-50 hover:border-green-300'
                >
                  View All
                  <ArrowRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {recent_reservations.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Calendar className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                  <p>No recent reservations found</p>
                </div>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {recent_reservations.map((r: any) => (
                    <div
                      key={r._id}
                      className='p-4 hover:bg-gray-50 transition-colors duration-200'
                    >
                      <div className='flex justify-between items-start'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <Car className='h-4 w-4 text-blue-600' />
                            <p className='font-semibold text-gray-900'>
                              Reservation #{r._id.slice(-6)}
                            </p>
                          </div>
                          <div className='space-y-1 text-sm text-gray-600'>
                            <p>
                              <span className='font-medium'>Vehicle:</span>{' '}
                              {r.vehicle.year_make_model} (
                              {r.vehicle.vehicle_type})
                            </p>
                            <p>
                              <span className='font-medium'>Plate:</span>{' '}
                              <span className='font-mono'>
                                {r.vehicle.plate_number}
                              </span>
                            </p>
                            <div className='flex items-center space-x-1'>
                              <MapPin className='h-3 w-3' />
                              <span>
                                {r.parking_space.establishment_name},{' '}
                                {r.parking_space.city}
                              </span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <Clock className='h-3 w-3' />
                              <span>
                                {formatDateRange(r.start_time, r.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right ml-4'>
                          <p className='font-bold text-lg text-gray-900'>
                            ₱{r.total_price}
                          </p>
                          <Badge
                            className={`${getReservationStatusBadge(
                              r.status
                            )} flex items-center space-x-1 mt-1`}
                          >
                            {getStatusIcon(r.status)}
                            <span>{r.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Parking Establishments */}
        <Card className='shadow-lg border-0 bg-white hover:shadow-xl transition-shadow duration-300'>
          <CardHeader className='border-b border-gray-100'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <Building2 className='h-5 w-5 text-purple-600' />
                <CardTitle className='text-lg font-semibold'>
                  Parking Establishments Overview
                </CardTitle>
              </div>
              <Button
                onClick={() =>
                  (window.location.href = '/admin/parking-management')
                }
                variant='outline'
                size='sm'
                className='hover:bg-purple-50 hover:border-purple-300'
              >
                Manage All
                <ArrowRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {parking_spaces.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Building2 className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p>No parking establishments found</p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Establishment
                        </th>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Location
                        </th>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Spaces
                        </th>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Rate
                        </th>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Status
                        </th>
                        <th className='text-left p-4 font-semibold text-gray-700'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {parking_spaces.slice(0, 5).map((space: any) => (
                        <tr
                          key={space._id}
                          className='hover:bg-gray-50 transition-colors duration-200'
                        >
                          <td className='p-4'>
                            <div className='flex items-center space-x-2'>
                              <Building2 className='h-4 w-4 text-gray-400' />
                              <span className='font-medium text-gray-900'>
                                {space.establishment_name}
                              </span>
                            </div>
                          </td>
                          <td className='p-4'>
                            <div className='flex items-center space-x-1 text-gray-600'>
                              <MapPin className='h-3 w-3' />
                              <span>{space.city}</span>
                            </div>
                          </td>
                          <td className='p-4'>
                            <div className='flex items-center space-x-2'>
                              <div className='text-sm'>
                                <span className='font-semibold text-green-600'>
                                  {space.available_spaces}
                                </span>
                                <span className='text-gray-500'>
                                  /{space.total_spaces}
                                </span>
                              </div>
                              <div className='w-16 bg-gray-200 rounded-full h-2'>
                                <div
                                  className='bg-green-500 h-2 rounded-full transition-all duration-300'
                                  style={{
                                    width: `${
                                      (space.available_spaces /
                                        space.total_spaces) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className='p-4'>
                            <div className='flex items-center space-x-1'>
                              <DollarSign className='h-3 w-3 text-green-600' />
                              <span className='font-medium'>
                                ₱{space.hourlyRate}/hr
                              </span>
                            </div>
                          </td>
                          <td className='p-4'>
                            <Badge
                              className={
                                space.availability_status === 'OPEN'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : space.availability_status === 'Limited'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {space.availability_status}
                            </Badge>
                          </td>
                          <td className='p-4'>
                            <Link
                              href={`/admin/parking-management/edit/${space._id}`}
                            >
                              <Button
                                size='sm'
                                variant='outline'
                                className='hover:bg-blue-50 hover:border-blue-300 bg-transparent'
                              >
                                Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parking_spaces.length > 5 && (
                  <div className='text-center p-4 text-gray-500 bg-gray-50 border-t'>
                    <p>
                      And {parking_spaces.length - 5} more establishments...{' '}
                      <Link
                        href='/admin/parking-management'
                        className='text-blue-600 hover:text-blue-800 font-medium'
                      >
                        View all
                      </Link>
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
