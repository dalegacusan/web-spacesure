'use client';

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
import {
  Building,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Search,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';

interface CreateUserForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole | '';
  password: string;
  confirmPassword: string;
}

const CreateUserPage = () => {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateUserForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserForm>>({});

  // Parking space management state
  const [availableParkingSpaces, setAvailableParkingSpaces] = useState<
    ParkingSpace[]
  >([]);
  const [assignedParkingSpaces, setAssignedParkingSpaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch available parking spaces when role is establishment
  useEffect(() => {
    const fetchAvailableParkingSpaces = async () => {
      if (formData.role !== UserRole.ADMIN || !token) return;

      try {
        const availableRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces?unassigned=false`,
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
      } catch (error) {
        console.error('Error fetching parking spaces:', error);
      }
    };

    fetchAvailableParkingSpaces();
  }, [formData.role, token]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (
      formData.password.length < 12 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    ) {
      newErrors.password =
        'Password must be at least 12 characters and include uppercase, lowercase, number, and special character';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const assignedIds = assignedParkingSpaces.map(
        (space) => space.parking_space._id
      );

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          password: formData.password,
          assignedParkingSpaceIds:
            formData.role === UserRole.ADMIN ? assignedIds : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setCreatedUserId(data._id || data.id);

      toast({
        title: 'User Created Successfully',
        description: `User ${formData.firstName} ${formData.lastName} has been created.`,
        variant: 'success',
      });

      // If not establishment role, redirect immediately
      if (formData.role !== UserRole.ADMIN) {
        router.push('/admin/users');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Updated function to handle pre-creation assignment
  const handleAssignParkingSpace = (parkingSpaceId: string) => {
    const spaceToMove = availableParkingSpaces.find(
      (space) => space._id === parkingSpaceId
    );

    if (spaceToMove) {
      // Remove from available spaces
      setAvailableParkingSpaces((prev) =>
        prev.filter((space) => space._id !== parkingSpaceId)
      );

      // Add to assigned spaces with current timestamp
      setAssignedParkingSpaces((prev) => [
        ...prev,
        {
          parking_space: spaceToMove,
          assigned_at: new Date().toISOString(),
        },
      ]);

      toast({
        title: 'Parking Space Added',
        description: 'Parking space has been added to assignment list.',
        variant: 'success',
      });
    }
  };

  // Updated function to handle pre-creation unassignment
  const handleUnassignParkingSpace = (parkingSpaceId: string) => {
    const spaceToMove = assignedParkingSpaces.find(
      (space) => space.parking_space._id === parkingSpaceId
    );

    if (spaceToMove) {
      // Remove from assigned spaces
      setAssignedParkingSpaces((prev) =>
        prev.filter((space) => space.parking_space._id !== parkingSpaceId)
      );

      // Add back to available spaces
      setAvailableParkingSpaces((prev) => [...prev, spaceToMove.parking_space]);

      toast({
        title: 'Parking Space Removed',
        description: 'Parking space has been removed from assignment list.',
        variant: 'success',
      });
    }
  };

  const filteredAvailableSpaces = () => {
    if (!searchQuery) {
      return availableParkingSpaces;
    }
    return availableParkingSpaces.filter(
      (space) =>
        space.establishment_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        space.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
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

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />
      <main className='max-w-6xl mx-auto p-4 sm:p-8'>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-4 text-gray-800'>
            Create New User
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
                    <Label htmlFor='firstName'>
                      First Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='firstName'
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                      className={errors.firstName ? 'border-red-500' : ''}
                      required
                    />
                    {errors.firstName && (
                      <p className='text-sm text-red-500'>{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='middleName'>Middle Name</Label>
                    <Input
                      id='middleName'
                      value={formData.middleName}
                      onChange={(e) =>
                        handleInputChange('middleName', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='lastName'>
                      Last Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='lastName'
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                      className={errors.lastName ? 'border-red-500' : ''}
                      required
                    />
                    {errors.lastName && (
                      <p className='text-sm text-red-500'>{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='email'>
                      Email <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className={errors.email ? 'border-red-500' : ''}
                      required
                    />
                    {errors.email && (
                      <p className='text-sm text-red-500'>{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='phoneNumber'>Phone Number</Label>
                    <Input
                      id='phoneNumber'
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange('phoneNumber', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='role'>
                      Role <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) =>
                        handleInputChange('role', value)
                      }
                    >
                      <SelectTrigger
                        className={errors.role ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder='Select user role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>
                          Establishment
                        </SelectItem>
                        <SelectItem value={UserRole.SUPER_ADMIN}>
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className='text-sm text-red-500'>{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Password <span className='text-red-500'>*</span>
                    </Label>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange('password', e.target.value)
                        }
                        className={
                          errors.password ? 'border-red-500 pr-10' : 'pr-10'
                        }
                        required
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4 text-gray-400' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-400' />
                        )}
                      </Button>
                    </div>

                    {/* 💡 Helper Text */}
                    <p className='text-xs text-gray-400 mt-3'>
                      Password must be at least 12 characters and include
                      uppercase, lowercase, number, and special character.
                    </p>

                    {errors.password && (
                      <p className='text-sm text-red-500'>{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Confirm Password <span className='text-red-500'>*</span>
                    </Label>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange('confirmPassword', e.target.value)
                        }
                        className={
                          errors.confirmPassword
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                        required
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-4 w-4 text-gray-400' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-400' />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className='text-sm text-red-500'>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6'>
                  <Button
                    type='button'
                    onClick={() => router.push('/admin/users')}
                    variant='outline'
                    className='flex-1 bg-transparent'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserPlus className='h-4 w-4 mr-2' />
                        Create User
                      </>
                    )}
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
                                  Added:{' '}
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
                      <Dialog>
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
        <Link href='/about'>About Us</Link>{' '}
        <p>© 2025 SpaceSure. All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default CreateUserPage;
