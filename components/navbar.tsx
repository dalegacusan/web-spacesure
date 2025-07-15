'use client';

import { useAuth } from '@/app/context/auth.context';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/enums/roles.enum';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'User';
  const currentRole = user?.role || UserRole.DRIVER;

  const getNavItems = () => {
    switch (currentRole) {
      case UserRole.SUPER_ADMIN:
        return [
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/reservations', label: 'Reservation History' },
          { href: '/admin/payment-history', label: 'Payment History' },
          { href: '/admin/parking-management', label: 'Parking Management' },
        ];
      case UserRole.ADMIN:
        return [
          { href: '/establishment/dashboard', label: 'Dashboard' },
          { href: '/establishment/account', label: 'Account' },
        ];
      default:
        return [
          { href: '/home', label: 'Dashboard' },
          { href: '/account', label: 'Account' },
          { href: '/vehicles', label: 'Vehicles' },
          { href: '/history', label: 'Reservation History' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className='bg-blue-900 text-white px-4 sm:px-6 py-3 sm:py-4'>
      <div
        className='flex justify-between items-center mx-auto'
        style={{
          width: '80%',
        }}
      >
        <div className='hidden md:flex items-center space-x-8'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-lg font-medium hover:text-gray-200 ${
                pathname === item.href ? 'text-white' : 'text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className='md:hidden'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='text-white hover:bg-blue-800'
          >
            {isMobileMenuOpen ? (
              <X className='w-6 h-6' />
            ) : (
              <Menu className='w-6 h-6' />
            )}
          </Button>
        </div>

        <div className='flex items-center space-x-2 sm:space-x-4'>
          <span className='text-sm sm:text-lg hidden sm:inline'>
            Hello, {displayName}!
          </span>
          <span className='text-sm md:hidden'>
            Hi, {user?.first_name || 'User'}!
          </span>
          <button
            onClick={logout}
            className='text-sm sm:text-lg font-medium hover:text-gray-200 whitespace-nowrap'
          >
            Logout
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden mt-4 pb-4 border-t border-blue-800'>
          <div className='flex flex-col space-y-2 pt-4'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-lg font-medium hover:text-gray-200 py-2 px-2 rounded ${
                  pathname === item.href
                    ? 'text-white bg-blue-800'
                    : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
