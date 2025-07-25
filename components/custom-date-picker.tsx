'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  unavailableDates?: string[];
  minDate?: string;
  required?: boolean;
}

const TIMEZONE = 'Asia/Singapore';

export function CustomDatePicker({
  value,
  onChange,
  label,
  unavailableDates = [],
  minDate,
  required = false,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  // Get current date in Asia/Singapore timezone
  const getCurrentDateInTimezone = () => {
    const now = new Date();
    const singaporeDate = new Date(
      now.toLocaleString('en-US', { timeZone: TIMEZONE })
    );
    return singaporeDate.toISOString().split('T')[0];
  };

  const minDateObj = minDate
    ? new Date(minDate + 'T00:00:00')
    : new Date(getCurrentDateInTimezone() + 'T00:00:00');

  const isDateDisabled = (date: Date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Create date objects at start of day for proper comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const minDateForComparison = new Date(minDateObj);
    minDateForComparison.setHours(0, 0, 0, 0);

    // Get current date in Singapore timezone for comparison
    const currentSingaporeDate = getCurrentDateInTimezone();
    const currentDateObj = new Date(currentSingaporeDate + 'T00:00:00');
    currentDateObj.setHours(0, 0, 0, 0);

    // Disable dates before today (Singapore time)
    if (checkDate < currentDateObj) {
      return true;
    }

    // Disable unavailable dates (fully booked)
    const isUnavailable = unavailableDates.includes(dateString);

    // Debug logging to see what's happening
    if (isUnavailable) {
      console.log(`Date ${dateString} is unavailable (fully booked)`);
    }

    return isUnavailable;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Double-check that the selected date is not unavailable
      if (unavailableDates.includes(dateString)) {
        console.warn(`Attempted to select unavailable date: ${dateString}`);
        return; // Don't allow selection of unavailable dates
      }

      // Check if date is in the past (Singapore time)
      const currentSingaporeDate = getCurrentDateInTimezone();
      if (dateString < currentSingaporeDate) {
        console.warn(`Attempted to select past date: ${dateString}`);
        return;
      }

      onChange(dateString);
      setOpen(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Label className='text-base font-semibold text-gray-700'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300 justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {value ? (
              <span>
                {formatInTimeZone(
                  new Date(value + 'T00:00:00'),
                  TIMEZONE,
                  'PPP'
                )}
                {unavailableDates.includes(value) && (
                  <span className='text-red-500 ml-2'>(Fully Booked)</span>
                )}
              </span>
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
            fromDate={minDateObj}
          />
        </PopoverContent>
      </Popover>
      {value && unavailableDates.includes(value) && (
        <p className='text-xs text-red-600'>⚠️ This date is fully booked</p>
      )}
    </div>
  );
}
