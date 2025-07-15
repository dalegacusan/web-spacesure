'use client';

import { useAuth } from '@/app/context/auth.context';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserTable from '@/components/user-table';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { UserStatus } from '@/lib/enums/user-status.enum';
import { UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const UsersPage = () => {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
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

        setUsers(users);
        setStats({
          totalUsers: users.length,
          activeUsers: active,
          suspendedUsers: suspended,
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
  }, [token, user]);

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

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
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
        </div>

        {/* User Table */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold'>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading ? <UserTable users={users} /> : <p>Loading users...</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UsersPage;
