'use client';

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/auth.context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAreas, setFilteredAreas] = useState<string[]>([]);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allAreas = [
    'Makati',
    'Bonifacio Global City',
    'Taguig',
    'Pasay',
    'Manila',
    'Mandaluyong',
    'Ortigas Center',
    'Pasig',
    'Rockwell Center',
    'Poblacion',
    'Makati',
    'San Antonio Village',
    'Legazpi Village',
    'Salcedo Village',
    'Ayala Center',
    'Greenbelt',
    'Glorietta',
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(
        `/parking-selection?location=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  const handleSuggestedArea = (area: string) => {
    router.push(`/parking-selection?location=${encodeURIComponent(area)}`);
    setSearchQuery(''); // Clear input
    setFilteredAreas([]); // Hide dropdown
  };

  const handleViewAllParkingSpaces = () => {
    router.push('/parking-selection');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allAreas.filter((area) =>
        area.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAreas(filtered);
    } else {
      setFilteredAreas([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilteredAreas([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) return null;

  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12'>
        <div
          style={{
            display: 'block',
            margin: 'auto',
            width: '50%',
            marginBottom: '32px',
          }}
        >
          <Image
            src='SPACESURE.png'
            height={130}
            width={130}
            alt='logo'
            style={{
              display: 'block',
              margin: 'auto',
              width: '50%',
            }}
          />
        </div>

        {/* Search Section */}
        <div className='bg-blue-900 rounded-2xl p-6 sm:p-12 text-center shadow-xl'>
          <h2 className='text-2xl sm:text-5xl font-bold text-white mb-6 sm:mb-8'>
            Where do you want to park today?
          </h2>

          <div
            className='max-w-3xl mx-auto mb-6 sm:mb-8 relative'
            ref={dropdownRef}
          >
            <div className='flex w-full'>
              <Input
                type='text'
                placeholder='Type a name of a city...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full text-lg sm:text-xl rounded-none border-0 shadow-xl bg-white text-gray-500 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0'
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                className='px-4 sm:px-6 bg-gray-100 hover:bg-gray-200 rounded-none shadow-xl border-2 border-l-0 border-white'
              >
                <Search className='w-5 h-5 sm:w-6 sm:h-6 text-blue-900' />
              </Button>
            </div>

            {filteredAreas.length > 0 && (
              <div className='absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg text-left'>
                {filteredAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleSuggestedArea(area)}
                    className='w-full text-left px-4 py-2 hover:bg-gray-100 text-sm sm:text-base text-gray-700'
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className='space-y-4 sm:space-y-6'>
            <p className='text-white text-lg sm:text-xl italic font-medium'>
              Suggested Areas
            </p>
            <div className='flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4'>
              <div className='flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4'>
                {allAreas.slice(0, 3).map((area) => (
                  <Button
                    key={area}
                    onClick={() => handleSuggestedArea(area)}
                    className='bg-white text-gray-700 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full font-semibold shadow-lg transition-all duration-200'
                  >
                    {area}
                  </Button>
                ))}
              </div>
            </div>

            {/* View All Parking Spaces Button */}
            <div className='mt-8 pt-6 border-t border-white/20'>
              <p className='text-white text-base sm:text-lg mb-4'>
                or browse all available parking spaces
              </p>
              <Button
                onClick={handleViewAllParkingSpaces}
                variant='outline'
                className='bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-base sm:text-lg rounded-full font-semibold shadow-lg transition-all duration-200'
              >
                View All Parking Spaces
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className='text-center py-8 sm:py-12 text-gray-600 bg-slate-200'>
        <p className='text-xs sm:text-sm mb-2'>
          <Link href='/about'>About Us</Link>
        </p>
        <p className='text-xs sm:text-sm'>
          © 2025 SpaceSure. All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
