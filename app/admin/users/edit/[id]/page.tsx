'use client';

import type React from 'react';

import { useAuth } from '@/app/context/auth.context';
import type { ParkingSpace } from '@/app/establishment/manage/[id]/page';
import Navbar from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import { UserStatus } from '@/lib/enums/user-status.enum';
import {
  Building,
  Check,
  CreditCard,
  MapPin,
  Percent,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditUserPage() {
  const { user: currentUser, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [formLoaded, setFormLoaded] = useState(false);
  const [availableParkingSpaces, setAvailableParkingSpaces] = useState<
    ParkingSpace[]
  >([]);
  const [unassignedParkingSpaces, setUnassignedParkingSpaces] = useState<
    ParkingSpace[]
  >([]);
  const [assignedParkingSpaces, setAssignedParkingSpaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState<string | null>(null);
  const [isApprovingDiscount, setIsApprovingDiscount] = useState(false);
  const [isDecliningDiscount, setIsDecliningDiscount] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    status: '',
    assigned_parking_spaces: [],
    eligibleForDiscount: false,
    discountLevel: null,
    discountId: null,
  });

  const fetchAvailableParkingSpaces = async () => {
    try {
      const availableRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces?unassigned=true&userId=${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (availableRes.ok) {
        const availableSpaces = await availableRes.json();
        setUnassignedParkingSpaces(availableSpaces);
      }
    } catch (error) {
      toast({
        title: 'Error fetching unassigned parking spaces',
        description: 'Could not fetch unassigned parking spaces.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (
      !loading &&
      (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN)
    ) {
      router.replace('/login');
    }
  }, [loading, currentUser, router]);

  // Fetch user data from API on load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = params.id as string;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }

        const u = await res.json();
        setFormData({
          firstName: u.first_name || '',
          middleName: u.middle_name || '',
          lastName: u.last_name || '',
          email: u.email || '',
          phoneNumber: u.phone_number || '',
          role: u.role || '',
          status: u.status || '',
          assigned_parking_spaces: u.assigned_parking_spaces,
          eligibleForDiscount: u.eligible_for_discount || false,
          discountLevel: u.discount_level || null,
          discountId: u.discount_id || null,
        });
        setAssignedParkingSpaces(u.assigned_parking_spaces || []);
        setFormLoaded(true);
      } catch (error) {
        toast({
          title: 'Error loading user',
          description: 'Could not load user data. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      fetchUser();
    }
  }, [params.id, currentUser, toast, token]);

  // Fetch parking spaces when user role is establishment
  useEffect(() => {
    const fetchParkingSpaces = async () => {
      if (formData.role !== UserRole.ADMIN) return;

      try {
        // Fetch available parking spaces (not assigned to any establishment)
        const availableRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces?unassigned=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (availableRes.ok) {
          const availableSpaces = await availableRes.json();
          setAvailableParkingSpaces(availableSpaces);
        }

        // Fetch assigned parking spaces for this user
        const assignedRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-space-admins?user_id=${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (assignedRes.ok) {
          const assignedSpaces = await assignedRes.json();
          setAssignedParkingSpaces(assignedSpaces);
        }
      } catch (error) {
        console.error('Error fetching parking spaces:', error);
      }
    };

    if (formLoaded && token) {
      fetchParkingSpaces();
    }
  }, [formData.role, formLoaded, token, params.id]);

  const handleSubmit = async (
    e?: React.FormEvent,
    overrideDiscount?: {
      eligibleForDiscount: boolean;
      discountLevel: string | null;
    }
  ) => {
    if (e) e.preventDefault();

    try {
      const userId = params.id as string;
      const reqBody = {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        role: formData.role,
        status: formData.status,
        eligible_for_discount: overrideDiscount
          ? overrideDiscount.eligibleForDiscount
          : formData.eligibleForDiscount,
        discount_level: overrideDiscount
          ? overrideDiscount.discountLevel
          : formData.discountLevel,
        discount_id: formData.discountId,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reqBody),
        }
      );

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || res.error || 'Update failed');
      }

      toast({
        title: 'User Updated',
        description: 'User information has been successfully updated.',
        variant: 'success',
      });

      // Optionally refresh formData to reflect new state
      setFormData((prev) => ({
        ...prev,
        eligibleForDiscount: reqBody.eligible_for_discount,
        discountLevel: reqBody.discount_level,
      }));
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssignParkingSpace = async (parkingSpaceId: string) => {
    setIsAssigning(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}/assign-parking/${parkingSpaceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: params.id,
            parking_space_id: parkingSpaceId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign parking space');
      }

      const { data: assignedData } = await response.json();
      const spaceToMove = availableParkingSpaces.find(
        (space) => space._id === parkingSpaceId
      );
      if (spaceToMove) {
        setAvailableParkingSpaces((prev) =>
          prev.filter((space) => space._id !== parkingSpaceId)
        );
        setAssignedParkingSpaces((prev) => [
          ...prev,
          {
            parking_space: spaceToMove,
            assigned_at: assignedData.assigned_at,
          },
        ]);
      }

      toast({
        title: 'Parking Space Assigned',
        description:
          'Parking space has been successfully assigned to the user.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignParkingSpace = async (parkingSpaceId: string) => {
    setIsUnassigning(parkingSpaceId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}/unassign-parking/${parkingSpaceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unassign parking space');
      }

      const spaceToMove = assignedParkingSpaces.find(
        (space) => space.parking_space._id === parkingSpaceId
      );
      if (spaceToMove) {
        setAssignedParkingSpaces((prev) =>
          prev.filter((space) => space.parking_space._id !== parkingSpaceId)
        );
        setAvailableParkingSpaces((prev) => [
          ...prev,
          spaceToMove.parking_space,
        ]);
      }

      toast({
        title: 'Parking Space Unassigned',
        description:
          'Parking space has been successfully unassigned from the user.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Unassignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUnassigning(null);
    }
  };

  const handleBack = () => {
    router.push('/admin/users');
  };

  const filteredAvailableSpaces = () => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') {
      return unassignedParkingSpaces;
    }
    return unassignedParkingSpaces.filter((space) => {
      const name = space.establishment_name?.toLowerCase() || '';
      const address = space.address?.toLowerCase() || '';
      const city = space.city?.toLowerCase() || '';
      return (
        name.includes(query) || address.includes(query) || city.includes(query)
      );
    });
  };

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case AvailabilityStatus.OPEN:
        return 'bg-green-100 text-green-800';
      case AvailabilityStatus.CLOSED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountStatusBadge = () => {
    if (formData.eligibleForDiscount && formData.discountLevel) {
      return (
        <Badge className='bg-green-100 text-green-800'>
          Approved -{' '}
          {formData.discountLevel === 'PWD' ? 'PWD' : 'Senior Citizen'} (20%
          discount)
        </Badge>
      );
    } else if (
      formData.discountLevel &&
      formData.discountId &&
      !formData.eligibleForDiscount
    ) {
      return (
        <Badge className='bg-yellow-100 text-yellow-800'>
          Pending Approval
        </Badge>
      );
    } else {
      return (
        <Badge className='bg-gray-100 text-gray-800'>No Discount Applied</Badge>
      );
    }
  };

  if (loading || !currentUser || !formLoaded) return null;

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />
      <main className='max-w-6xl mx-auto p-4 sm:p-8'>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-4 text-gray-800'>
            Edit User
          </h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* User Information Card */}
          <Card className='shadow-lg border-0 bg-white'>
            <CardHeader className='bg-blue-600 text-white rounded-t-lg'>
              <CardTitle className='flex items-center text-xl'>
                <User className='w-6 h-6 mr-3' />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      type='text'
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='middleName'>Middle Name</Label>
                    <Input
                      id='middleName'
                      type='text'
                      value={formData.middleName}
                      onChange={(e) =>
                        setFormData({ ...formData, middleName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      type='text'
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='phoneNumber'>Phone Number</Label>
                    <Input
                      id='phoneNumber'
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='status'>Account Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select account status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserStatus.ENABLED}>
                          Active
                        </SelectItem>
                        <SelectItem value={UserStatus.DISABLED}>
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Management Section - Only show for driver users */}
                  {formData.role === UserRole.DRIVER && (
                    <div className='border-t pt-6'>
                      <div className='space-y-4'>
                        <div>
                          <Label className='text-lg font-medium mb-2 block'>
                            <Percent className='w-5 h-5 inline mr-2' />
                            Discount Management
                          </Label>
                          <div className='mb-4'>{getDiscountStatusBadge()}</div>
                        </div>

                        {/* Show discount details if user has submitted discount info */}
                        {formData.discountLevel && formData.discountId && (
                          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                            <div className='space-y-3'>
                              <div>
                                <Label className='text-sm font-medium text-gray-700'>
                                  Discount Type:
                                </Label>
                                <p className='text-sm text-gray-900'>
                                  {formData.discountLevel === 'PWD'
                                    ? 'PWD ID'
                                    : 'Senior Citizen ID'}{' '}
                                  (20% discount)
                                </p>
                              </div>
                              <div>
                                <Label className='text-sm font-medium text-gray-700'>
                                  <CreditCard className='w-4 h-4 inline mr-1' />
                                  ID Number:
                                </Label>
                                <p className='text-sm text-gray-900 font-mono'>
                                  {formData.discountId}
                                </p>
                              </div>
                            </div>

                            {/* Approval/Decline buttons - only show if not yet approved */}
                            {!formData.eligibleForDiscount && (
                              <div className='flex space-x-3 mt-4'>
                                <Button
                                  type='button'
                                  onClick={() =>
                                    handleSubmit(undefined, {
                                      eligibleForDiscount: true,
                                      discountLevel: formData.discountLevel,
                                    })
                                  }
                                  disabled={isApprovingDiscount}
                                  className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                                >
                                  {isApprovingDiscount ? (
                                    <>
                                      <div className='animate-spin h-4 w-4 mr-2 border border-white border-t-transparent rounded-full' />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <Check className='w-4 h-4 mr-2' />
                                      Approve Discount
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type='button'
                                  onClick={() =>
                                    handleSubmit(undefined, {
                                      eligibleForDiscount: false,
                                      discountLevel: null,
                                    })
                                  }
                                  disabled={isDecliningDiscount}
                                  variant='outline'
                                  className='flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-transparent'
                                >
                                  {isDecliningDiscount ? (
                                    <>
                                      <div className='animate-spin h-4 w-4 mr-2 border border-red-600 border-t-transparent rounded-full' />
                                      Declining...
                                    </>
                                  ) : (
                                    <>
                                      <X className='w-4 h-4 mr-2' />
                                      Decline
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6'>
                  <Button
                    type='button'
                    onClick={handleBack}
                    variant='outline'
                    className='flex-1 bg-transparent'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Parking Space Management Card - Only show for establishment users */}
          {formData.role === UserRole.ADMIN && (
            <Card className='shadow-lg border-0 bg-white'>
              <CardHeader className='bg-green-600 text-white rounded-t-lg'>
                <CardTitle className='flex items-center text-xl'>
                  <Building className='w-6 h-6 mr-3' />
                  Parking Space Management
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-6'>
                  {/* Assigned Parking Spaces */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Assigned Parking Spaces ({assignedParkingSpaces.length})
                    </h3>
                    {assignedParkingSpaces.length > 0 ? (
                      <div className='space-y-3'>
                        {assignedParkingSpaces.map((space) => (
                          <div
                            key={space.parking_space._id}
                            className='border rounded-lg p-4 bg-gray-50'
                          >
                            <div className='flex justify-between items-start'>
                              <div className='flex-1'>
                                <h4 className='font-medium text-gray-900'>
                                  {space.parking_space.establishment_name}
                                </h4>
                                <p className='text-sm text-gray-600 flex items-center mt-1'>
                                  <MapPin className='h-3 w-3 mr-1' />
                                  {space.parking_space.address},{' '}
                                  {space.parking_space.city}
                                </p>
                                <div className='flex items-center space-x-4 mt-2 text-xs text-gray-500'>
                                  <span>
                                    Total: {space.parking_space.total_spaces}{' '}
                                    spaces
                                  </span>
                                  <span>
                                    Available:{' '}
                                    {space.parking_space.available_spaces}
                                  </span>
                                  <span>
                                    ₱{space.parking_space.hourlyRate}/hr
                                  </span>
                                  <Badge
                                    className={`text-xs ${getStatusColor(
                                      space.parking_space.availability_status
                                    )}`}
                                  >
                                    {space.parking_space.availability_status}
                                  </Badge>
                                </div>
                                <p className='text-xs text-gray-400 mt-1'>
                                  Assigned:{' '}
                                  {new Date(
                                    space.assigned_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleUnassignParkingSpace(
                                    space.parking_space._id
                                  )
                                }
                                disabled={
                                  isUnassigning === space.parking_space._id
                                }
                                className='ml-4 border-red-300 text-red-600 hover:bg-red-50'
                              >
                                {isUnassigning === space.parking_space._id ? (
                                  <>
                                    <div className='animate-spin h-3 w-3 mr-1 border border-red-600 border-t-transparent rounded-full' />
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <X className='h-3 w-3 mr-1' />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg'>
                        <Building className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                        <p>No parking spaces assigned yet</p>
                      </div>
                    )}
                  </div>

                  {/* Assign New Parking Space */}
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold'>
                        Assign New Parking Space
                      </h3>
                      <Dialog
                        onOpenChange={(open) => {
                          if (open) {
                            fetchAvailableParkingSpaces();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size='sm'
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Plus className='h-4 w-4 mr-2' />
                            Assign Space
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                          <DialogHeader>
                            <DialogTitle>Assign Parking Space</DialogTitle>
                          </DialogHeader>

                          {/* Search Bar */}
                          <div className='mb-4'>
                            <div className='relative'>
                              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                              <Input
                                placeholder='Search by establishment name, address, or city...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='pl-10'
                              />
                            </div>
                          </div>

                          <div className='space-y-3'>
                            {filteredAvailableSpaces().length > 0 ? (
                              filteredAvailableSpaces().map((space) => (
                                <div
                                  key={space._id}
                                  className='border rounded-lg p-4 hover:bg-gray-50'
                                >
                                  <div className='flex justify-between items-start'>
                                    <div className='flex-1'>
                                      <h4 className='font-medium text-gray-900'>
                                        {space.establishment_name}
                                      </h4>
                                      <p className='text-sm text-gray-600 flex items-center mt-1'>
                                        <MapPin className='h-3 w-3 mr-1' />
                                        {space.address}, {space.city}
                                      </p>
                                      <div className='flex items-center space-x-4 mt-2 text-xs text-gray-500'>
                                        <span>
                                          Total: {space.total_spaces} spaces
                                        </span>
                                        <span>
                                          Available: {space.available_spaces}
                                        </span>
                                        <span>₱{space.hourlyRate}/hr</span>
                                        <Badge
                                          className={`text-xs ${getStatusColor(
                                            space.availability_status
                                          )}`}
                                        >
                                          {space.availability_status}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button
                                      size='sm'
                                      onClick={() =>
                                        handleAssignParkingSpace(space._id)
                                      }
                                      disabled={isAssigning}
                                      className='ml-4 bg-green-600 hover:bg-green-700'
                                    >
                                      {isAssigning ? (
                                        <>
                                          <div className='animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full' />
                                          Assigning...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className='h-3 w-3 mr-1' />
                                          Assign
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className='text-center py-8 text-gray-500'>
                                {searchQuery ? (
                                  <p>
                                    No parking spaces found matching "
                                    {searchQuery}"
                                  </p>
                                ) : (
                                  <p>No available parking spaces to assign</p>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className='text-center py-8 text-gray-600'>
        <p className='mb-2'>
          <Link href='/about'>About Us</Link>
        </p>
        <p>© 2025 SpaceSure. All Rights Reserved</p>
      </footer>
    </div>
  );
}
