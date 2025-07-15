'use client';

import { UserRole } from '@/lib/enums/roles.enum';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Car,
  CreditCard,
  History,
  Home,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return [
          { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
          { href: '/admin/users', label: 'Users', icon: Users },
          {
            href: '/admin/reservations',
            label: 'Reservations',
            icon: Calendar,
          },
          {
            href: '/admin/payment-history',
            label: 'Payment History',
            icon: CreditCard,
          },
          {
            href: '/admin/parking-management',
            label: 'Parking Management',
            icon: MapPin,
          },
          { href: '/admin/account', label: 'Account', icon: User },
        ];
      case UserRole.ADMIN:
        return [
          { href: '/establishment/dashboard', label: 'Dashboard', icon: Home },
          {
            href: '/establishment/reservations',
            label: 'Reservations',
            icon: Calendar,
          },
          {
            href: '/establishment/payment-history',
            label: 'Payment History',
            icon: CreditCard,
          },
          { href: '/establishment/account', label: 'Account', icon: User },
        ];
      default: // driver
        return [
          { href: '/home', label: 'Home', icon: Home },
          { href: '/account', label: 'Account', icon: User },
          { href: '/vehicles', label: 'Vehicles', icon: Car },
          { href: '/history', label: 'History', icon: History },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className='w-64 bg-white shadow-lg h-screen sticky top-0'>
      <div className='p-6'>
        <h2 className='text-xl font-bold text-gray-800 mb-6'>
          {userRole === UserRole.SUPER_ADMIN
            ? 'Admin Panel'
            : userRole === UserRole.ADMIN
            ? 'Establishment'
            : 'Driver Menu'}
        </h2>

        <nav className='space-y-2'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className='w-5 h-5 mr-3' />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
