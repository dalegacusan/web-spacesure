'use client';

import { useAuth } from '@/app/context/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Vehicle {
  id: string;
  plateNumber: string;
  yearMakeModel: string;
  color: string;
  status: 'active' | 'inactive';
}

export default function VehicleTable() {
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch vehicles');

        const data = await res.json();

        const mapped: Vehicle[] = data.map((v: any) => {
          return {
            id: v._id,
            plateNumber: v.plate_number,
            yearMakeModel: v.year_make_model,
            color: v.color,
          };
        });

        setVehicles(mapped);
        setFilteredVehicles(mapped);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Unable to load vehicles.',
          variant: 'destructive',
        });
      }
    };

    if (token && user?.role === UserRole.DRIVER) {
      fetchVehicles();
    }
  }, [token, user, toast]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = vehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(term.toLowerCase()) ||
        v.yearMakeModel.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredVehicles(filtered);
  };

  const handleDelete = (id: string) => {
    setFilteredVehicles((prev) => prev.filter((v) => v.id !== id));
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Delete failed');
        return res.json();
      })
      .then(() => {
        toast({
          title: 'Vehicle Deleted',
          description: 'The vehicle was removed from your account.',
          variant: 'success',
        });
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: 'Failed to delete',
          description: 'An error occurred while deleting the vehicle.',
          variant: 'destructive',
        });
      });
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h1 className='text-2xl font-bold'>My Vehicles</h1>
        <Link href='/vehicles/add'>
          <Button className='bg-[#3B4A9C] hover:bg-[#2A3A7C] w-full sm:w-auto'>
            <Plus className='w-4 h-4 mr-2' />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search by plate number, make, or model...'
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
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
                  Plate Number
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Year, Make & Model
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Color
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle?.id}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {vehicle?.plateNumber}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {vehicle?.yearMakeModel}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {vehicle?.color}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex space-x-2'>
                      <Link href={`/vehicles/edit/${vehicle?.id}`}>
                        <Button variant='outline' size='sm'>
                          <Edit className='w-4 h-4' />
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(vehicle?.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
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
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle?.id}>
            <CardHeader className='pb-3'>
              <div className='flex justify-between items-start'>
                <CardTitle className='text-lg'>
                  {vehicle?.plateNumber}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium text-gray-500'>
                    Year, Make & Model:
                  </span>
                  <p>{vehicle?.yearMakeModel}</p>
                </div>
                <div>
                  <span className='font-medium text-gray-500'>Color:</span>
                  <p>{vehicle?.color}</p>
                </div>
              </div>
              <div className='flex gap-2 pt-2 border-t'>
                <Link href={`/vehicles/edit/${vehicle?.id}`} className='flex-1'>
                  <Button variant='outline' size='sm' className='w-full'>
                    <Edit className='w-4 h-4 mr-2' />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleDelete(vehicle?.id)}
                  className='flex-1 text-red-600 hover:text-red-700'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No vehicles found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
