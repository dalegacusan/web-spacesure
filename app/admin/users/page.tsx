'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
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
import UserTable from '@/components/user-table';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { UserStatus } from '@/lib/enums/user-status.enum';
import {
  Building,
  Filter,
  Search,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface FilterState {
  role: string;
  status: string;
  discountEligible: string;
  hasReservations: string;
  dateRange: string;
}

const UsersPage = () => {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    role: 'all',
    status: 'all',
    discountEligible: 'all',
    hasReservations: 'all',
    dateRange: 'all',
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    establishments: 0,
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch users');
        }

        const users = data ?? [];

        // Compute stats
        const active = users.filter(
          (u: any) => u.status === UserStatus.ENABLED
        ).length;
        const suspended = users.filter(
          (u: any) => u.status === UserStatus.DISABLED
        ).length;
        const establishments = users.filter(
          (u: any) => u.role === UserRole.ADMIN
        ).length;

        setUsers(users);
        setStats({
          totalUsers: users.length,
          activeUsers: active,
          suspendedUsers: suspended,
          establishments: establishments,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Unable to load users.',
          variant: 'destructive',
        });
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token, user, toast]);

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

  // Helper function to check if a date is within last week
  const isLastWeek = (dateString: string) => {
    const date = new Date(dateString);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return date >= lastWeek;
  };

  // Helper function to check if a date is within last month
  const isLastMonth = (dateString: string) => {
    const date = new Date(dateString);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return date >= lastMonth;
  };

  // Get users with reservations
  const usersWithReservations = useMemo(() => {
    return users.filter(
      (u: any) => u.reservations && u.reservations.length > 0
    );
  }, [users]);

  // Get active users
  const activeUsers = useMemo(() => {
    return users.filter((u: any) => u.status === UserStatus.ENABLED);
  }, [users]);

  // Get disabled users
  const disabledUsers = useMemo(() => {
    return users.filter((u: any) => u.status === UserStatus.DISABLED);
  }, [users]);

  // Get establishment admins
  const establishmentAdmins = useMemo(() => {
    return users.filter((u: any) => u.role === UserRole.ADMIN);
  }, [users]);

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user: any) => {
        // Search by name
        if (
          `${user.first_name} ${user.middle_name || ''} ${user.last_name}`
            .toLowerCase()
            .includes(query)
        )
          return true;

        // Search by email
        if (user.email.toLowerCase().includes(query)) return true;

        // Search by phone number
        if (user.phone_number?.toLowerCase().includes(query)) return true;

        // Search by role
        if (user.role.toLowerCase().includes(query)) return true;

        // Search by status
        if (user.status.toLowerCase().includes(query)) return true;

        // Search by discount level
        if (user.discount_level?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Apply filters - only filter if a specific value is selected (not 'all')
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter((u: any) => u.role === filters.role);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((u: any) => u.status === filters.status);
    }

    if (filters.discountEligible && filters.discountEligible !== 'all') {
      if (filters.discountEligible === 'yes') {
        filtered = filtered.filter(
          (u: any) => u.eligible_for_discount === true
        );
      } else if (filters.discountEligible === 'no') {
        filtered = filtered.filter(
          (u: any) => u.eligible_for_discount === false
        );
      }
    }

    if (filters.hasReservations && filters.hasReservations !== 'all') {
      if (filters.hasReservations === 'yes') {
        filtered = filtered.filter(
          (u: any) => u.reservations && u.reservations.length > 0
        );
      } else if (filters.hasReservations === 'no') {
        filtered = filtered.filter(
          (u: any) => !u.reservations || u.reservations.length === 0
        );
      }
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      filtered = filtered.filter((u: any) => {
        switch (filters.dateRange) {
          case 'today':
            return isToday(u.created_at);
          case 'last_week':
            return isLastWeek(u.created_at);
          case 'last_month':
            return isLastMonth(u.created_at);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [users, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({
      role: 'all',
      status: 'all',
      discountEligible: 'all',
      hasReservations: 'all',
      dateRange: 'all',
    });
    setSearchQuery('');
  };

  const activeFiltersCount =
    Object.values(filters).filter((value) => value && value !== 'all').length +
    (searchQuery ? 1 : 0);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <Navbar />

      <main
        className='mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{
          width: '80%',
        }}
      >
        {/* Header */}
        <div className='mb-8 flex justify-between items-start'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              User Management
            </h1>
            <p className='text-gray-600'>
              Manage all users, view their reservations, and monitor activity
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/users/create')}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            <UserPlus className='h-4 w-4 mr-2' />
            Create User
          </Button>
        </div>

        {/* Quick Filter Buttons */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <Button
            variant={
              filters.status === UserStatus.ENABLED ? 'default' : 'outline'
            }
            size='sm'
            onClick={() =>
              setFilters({
                ...filters,
                status:
                  filters.status === UserStatus.ENABLED
                    ? 'all'
                    : UserStatus.ENABLED,
              })
            }
            className='flex items-center space-x-1'
          >
            <UserCheck className='h-4 w-4' />
            <span>Active ({activeUsers.length})</span>
          </Button>
          <Button
            variant={
              filters.status === UserStatus.DISABLED ? 'default' : 'outline'
            }
            size='sm'
            onClick={() =>
              setFilters({
                ...filters,
                status:
                  filters.status === UserStatus.DISABLED
                    ? 'all'
                    : UserStatus.DISABLED,
              })
            }
            className='flex items-center space-x-1'
          >
            <UserX className='h-4 w-4' />
            <span>Disabled ({disabledUsers.length})</span>
          </Button>
          <Button
            variant={filters.role === UserRole.ADMIN ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              setFilters({
                ...filters,
                role: filters.role === UserRole.ADMIN ? 'all' : UserRole.ADMIN,
              })
            }
            className='flex items-center space-x-1'
          >
            <Building className='h-4 w-4' />
            <span>Establishments ({establishmentAdmins.length})</span>
          </Button>
          <Button
            variant={filters.hasReservations === 'yes' ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              setFilters({
                ...filters,
                hasReservations:
                  filters.hasReservations === 'yes' ? 'all' : 'yes',
              })
            }
          >
            With Reservations ({usersWithReservations.length})
          </Button>
          <Button
            variant={filters.discountEligible === 'yes' ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              setFilters({
                ...filters,
                discountEligible:
                  filters.discountEligible === 'yes' ? 'all' : 'yes',
              })
            }
          >
            Discount Eligible
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card className='bg-white shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Users className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Total Users
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <UserCheck className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Active Users
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.activeUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-red-100 rounded-lg'>
                  <UserX className='h-6 w-6 text-red-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Disabled Users
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.suspendedUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Building className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Establishments
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.establishments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold'>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Bar */}
            <div className='mb-6 space-y-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                {/* Search Bar */}
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search by name, email, phone, role, or status...'
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
                    <span className='ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full'>
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
                    {/* Role Filter */}
                    <div>
                      <Label className='text-sm font-medium mb-2 block'>
                        Role
                      </Label>
                      <Select
                        value={filters.role}
                        onValueChange={(value) =>
                          setFilters({ ...filters, role: value })
                        }
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue placeholder='All Roles' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Roles</SelectItem>
                          <SelectItem value={UserRole.SUPER_ADMIN}>
                            Super Admin
                          </SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.DRIVER}>
                            Driver
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <Label className='text-sm font-medium mb-2 block'>
                        Status
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
                          <SelectItem value={UserStatus.ENABLED}>
                            Enabled
                          </SelectItem>
                          <SelectItem value={UserStatus.DISABLED}>
                            Disabled
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Discount Eligible Filter */}
                    <div>
                      <Label className='text-sm font-medium mb-2 block'>
                        Discount Eligible
                      </Label>
                      <Select
                        value={filters.discountEligible}
                        onValueChange={(value) =>
                          setFilters({ ...filters, discountEligible: value })
                        }
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue placeholder='All' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All</SelectItem>
                          <SelectItem value='yes'>Yes</SelectItem>
                          <SelectItem value='no'>No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Reservations Filter */}
                    <div>
                      <Label className='text-sm font-medium mb-2 block'>
                        Has Reservations
                      </Label>
                      <Select
                        value={filters.hasReservations}
                        onValueChange={(value) =>
                          setFilters({ ...filters, hasReservations: value })
                        }
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue placeholder='All' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All</SelectItem>
                          <SelectItem value='yes'>Yes</SelectItem>
                          <SelectItem value='no'>No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <Label className='text-sm font-medium mb-2 block'>
                        Created Date
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
                          <SelectItem value='last_week'>Last Week</SelectItem>
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
              {(searchQuery || activeFiltersCount > 0) && (
                <div className='text-sm text-gray-600'>
                  Showing {filteredUsers.length} of {users.length} users
                  {searchQuery && <span> matching "{searchQuery}"</span>}
                </div>
              )}
            </div>

            {!loading ? (
              <UserTable users={filteredUsers} hideSearch={true} />
            ) : (
              <p>Loading users...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UsersPage;
