'use client';

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityStatus } from '@/lib/enums/availability-status.enum';
import { UserRole } from '@/lib/enums/roles.enum';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  Home,
  MapPin,
  MessageSquare,
  Percent,
  Send,
  Star,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth.context';

interface ReservedSlot {
  date: string;
  reserved_count: number;
}

export default function ReservationPage() {
  const searchParams = useSearchParams();
  const lotId = searchParams.get('lotId');
  const router = useRouter();
  const { toast } = useToast();
  const { user, token, loading } = useAuth();

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vehicle: '',
    dateFrom: '',
    dateTo: '',
    timeIn: '16:00',
    timeOut: '20:00',
    reservationType: 'hourly',
  });
  const [total, setTotal] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [parkingLot, setParkingLot] = useState<any>(null);
  const [reservedSlots, setReservedSlots] = useState<ReservedSlot[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    comment: '',
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Check if user is eligible for discount
  const isEligibleForDiscount = user?.eligible_for_discount === true;
  const discountPercentage = 20; // 20% discount for PWD/Senior Citizens

  // Redirect if not driver
  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.DRIVER)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch parking space and reserved slots
  useEffect(() => {
    const fetchLot = async () => {
      if (!lotId || !token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/parking-spaces/${lotId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error('Failed to load parking lot info');

        const reservedSlotsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservations/${lotId}/reserved-slots`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setParkingLot(data);

        if (reservedSlotsRes.ok) {
          const slotsData = await reservedSlotsRes.json();
          setReservedSlots(slotsData);

          // Check for unavailable dates where reserved_count equals available_spaces
          const fullyBookedDates = slotsData
            .filter(
              (slot: ReservedSlot) =>
                slot.reserved_count >= data.available_spaces
            )
            .map((slot: ReservedSlot) => slot.date);
          setUnavailableDates(fullyBookedDates);
        }

        computeTotal(
          formData.dateFrom,
          formData.dateTo,
          formData.timeIn,
          formData.timeOut,
          formData.reservationType,
          data.hourlyRate,
          data.whole_day_rate
        );
      } catch (err) {
        toast({
          title: 'Error loading reservation',
          description: 'Failed to fetch parking space details.',
          variant: 'destructive',
        });
      }
    };

    fetchLot();
  }, [lotId, token, toast]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch vehicles');

        const data = await res.json();
        setVehicles(data);
      } catch (err) {
        toast({
          title: 'Error loading vehicles',
          description: 'Could not retrieve your vehicle list.',
          variant: 'destructive',
        });
      }
    };

    fetchVehicles();
  }, [token, toast]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!lotId) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feedback/parking-space/${lotId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch feedbacks');

        const data = await res.json();
        setFeedbacks(data);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }
    };

    fetchFeedbacks();
  }, [lotId, token, showFeedbackForm]);

  // Check availability based on reserved slots
  const checkDateAvailability = (dateFrom: string, dateTo: string) => {
    if (!dateFrom || !dateTo || !parkingLot || reservedSlots.length === 0) {
      return;
    }

    setIsCheckingAvailability(true);
    const unavailable: string[] = [];

    // Generate array of dates in the range
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const dateArray: string[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    // Check each date for availability
    dateArray.forEach((date) => {
      const dateSlot = reservedSlots.find((slot) => slot.date === date);

      // If this date is fully booked (reserved_count >= available_spaces)
      if (dateSlot && dateSlot.reserved_count >= parkingLot.available_spaces) {
        unavailable.push(date);
      }
    });

    const newUnavailableDates = [
      ...new Set([...unavailableDates, ...unavailable]),
    ];
    setUnavailableDates(newUnavailableDates);
    setIsCheckingAvailability(false);

    // Show warning if there are unavailable dates in the selected range
    if (unavailable.length > 0) {
      toast({
        title: 'Some dates unavailable',
        description: `${unavailable.length} date(s) in your range are fully booked. Please adjust your selection.`,
        variant: 'destructive',
      });
    }
  };

  const computeTotal = (
    dateFrom: string,
    dateTo: string,
    timeIn: string,
    timeOut: string,
    reservationType: string,
    hourlyRate: number,
    wholeDayRate: number
  ) => {
    if (!dateFrom || !dateTo) {
      setOriginalTotal(0);
      setTotal(0);
      setDiscountAmount(0);
      return;
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const daysDifference =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Generate array of dates in the range to check availability
    const dateArray: string[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    // Count available days (exclude fully booked dates)
    const availableDays = dateArray.filter(
      (date) => !unavailableDates.includes(date)
    ).length;

    if (availableDays <= 0) {
      setOriginalTotal(0);
      setTotal(0);
      setDiscountAmount(0);
      return;
    }

    let calculatedTotal = 0;

    if (reservationType === 'whole_day') {
      calculatedTotal = availableDays * wholeDayRate;
    } else {
      const [startHour] = timeIn.split(':').map(Number);
      const [endHour] = timeOut.split(':').map(Number);
      const hoursPerDay = Math.max(1, endHour - startHour);

      calculatedTotal = availableDays * hoursPerDay * hourlyRate;
    }

    setOriginalTotal(calculatedTotal);

    // Apply discount if eligible
    if (isEligibleForDiscount) {
      const discount = calculatedTotal * (discountPercentage / 100);
      setDiscountAmount(discount);
      setTotal(calculatedTotal - discount);
    } else {
      setDiscountAmount(0);
      setTotal(calculatedTotal);
    }
  };

  const addHoursToTime = (time: string, hours: number): string => {
    const [hour, minute] = time.split(':').map(Number);
    const newHour = Math.min(23, hour + hours);
    return `${newHour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  };

  const isTimeAfter = (time1: string, time2: string): boolean => {
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);
    return hour1 > hour2 || (hour1 === hour2 && minute1 > minute2);
  };

  const handleTimeInChange = (newTimeIn: string) => {
    let updatedForm = { ...formData, timeIn: newTimeIn };

    if (isTimeAfter(newTimeIn, formData.timeOut)) {
      const newTimeOut = addHoursToTime(newTimeIn, 1);
      updatedForm = { ...updatedForm, timeOut: newTimeOut };
      toast({
        title: 'Time Adjusted',
        description:
          'Time Out has been automatically adjusted to be after Time In.',
        variant: 'default',
      });
    }

    setFormData(updatedForm);

    if (parkingLot) {
      computeTotal(
        updatedForm.dateFrom,
        updatedForm.dateTo,
        updatedForm.timeIn,
        updatedForm.timeOut,
        updatedForm.reservationType,
        parkingLot.hourlyRate,
        parkingLot.whole_day_rate
      );
    }
  };

  const handleTimeOutChange = (newTimeOut: string) => {
    if (isTimeAfter(formData.timeIn, newTimeOut)) {
      toast({
        title: 'Invalid Time Selection',
        description:
          'Time Out cannot be before Time In. Please select a later time.',
        variant: 'destructive',
      });
      return;
    }

    const updatedForm = { ...formData, timeOut: newTimeOut };
    setFormData(updatedForm);

    if (parkingLot) {
      computeTotal(
        updatedForm.dateFrom,
        updatedForm.dateTo,
        updatedForm.timeIn,
        updatedForm.timeOut,
        updatedForm.reservationType,
        parkingLot.hourlyRate,
        parkingLot.whole_day_rate
      );
    }
  };

  const handleDateFromChange = (newDateFrom: string) => {
    // Check if the selected date is unavailable
    if (unavailableDates.includes(newDateFrom)) {
      toast({
        title: 'Date Unavailable',
        description:
          'This date is fully booked. Please select a different date.',
        variant: 'destructive',
      });
      return;
    }

    let updatedForm = { ...formData, dateFrom: newDateFrom };

    // If dateTo is before dateFrom, adjust dateTo to be the same as dateFrom
    if (formData.dateTo && newDateFrom > formData.dateTo) {
      updatedForm = { ...updatedForm, dateTo: newDateFrom };
      toast({
        title: 'Date Adjusted',
        description: 'End date has been adjusted to match the start date.',
        variant: 'default',
      });
    }

    setFormData(updatedForm);

    if (parkingLot) {
      // Check availability when date changes
      if (updatedForm.dateTo) {
        checkDateAvailability(updatedForm.dateFrom, updatedForm.dateTo);
      }

      computeTotal(
        updatedForm.dateFrom,
        updatedForm.dateTo,
        updatedForm.timeIn,
        updatedForm.timeOut,
        updatedForm.reservationType,
        parkingLot.hourlyRate,
        parkingLot.whole_day_rate
      );
    }
  };

  const handleDateToChange = (newDateTo: string) => {
    // Check if the selected date is unavailable
    if (unavailableDates.includes(newDateTo)) {
      toast({
        title: 'Date Unavailable',
        description:
          'This date is fully booked. Please select a different date.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.dateFrom && newDateTo < formData.dateFrom) {
      toast({
        title: 'Invalid Date Selection',
        description: 'End date cannot be before start date.',
        variant: 'destructive',
      });
      return;
    }

    const updatedForm = { ...formData, dateTo: newDateTo };
    setFormData(updatedForm);

    if (parkingLot) {
      // Check availability when date changes
      if (updatedForm.dateFrom) {
        checkDateAvailability(updatedForm.dateFrom, updatedForm.dateTo);
      }

      computeTotal(
        updatedForm.dateFrom,
        updatedForm.dateTo,
        updatedForm.timeIn,
        updatedForm.timeOut,
        updatedForm.reservationType,
        parkingLot.hourlyRate,
        parkingLot.whole_day_rate
      );
    }
  };

  const handleReservationTypeChange = (value: string) => {
    const updatedForm = { ...formData, reservationType: value };
    setFormData(updatedForm);

    if (parkingLot) {
      computeTotal(
        updatedForm.dateFrom,
        updatedForm.dateTo,
        updatedForm.timeIn,
        updatedForm.timeOut,
        value,
        parkingLot.hourlyRate,
        parkingLot.whole_day_rate
      );
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    if (!formData.dateFrom || !formData.dateTo) {
      toast({
        title: 'Incomplete Details',
        description: 'Please select both start and end dates.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.dateFrom > formData.dateTo) {
      toast({
        title: 'Invalid Date Selection',
        description: 'End date must be on or after the start date.',
        variant: 'destructive',
      });
      return;
    }

    // Check if any selected dates are unavailable
    const startDate = new Date(formData.dateFrom);
    const endDate = new Date(formData.dateTo);
    const selectedDates: string[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      selectedDates.push(d.toISOString().split('T')[0]);
    }

    const conflictingDates = selectedDates.filter((date) =>
      unavailableDates.includes(date)
    );

    if (conflictingDates.length === selectedDates.length) {
      toast({
        title: 'No Available Dates',
        description:
          'All dates in your selected range are fully booked. Please choose different dates.',
        variant: 'destructive',
      });
      return;
    }

    if (conflictingDates.length > 0) {
      toast({
        title: 'Some Dates Unavailable',
        description: `${conflictingDates.length} date(s) in your range are fully booked. Only available dates will be reserved.`,
        variant: 'destructive',
      });
    }

    // Validate that selected dates are not in the past
    const currentDate = getCurrentDateTime().currentDate;
    if (formData.dateFrom < currentDate) {
      toast({
        title: 'Invalid Date Selection',
        description:
          'Please select today or a future date for your reservation.',
        variant: 'destructive',
      });
      return;
    }

    // For hourly reservations, validate time on the first day if it's today
    if (
      formData.reservationType === 'hourly' &&
      formData.dateFrom === currentDate
    ) {
      if (isTimeInPast(formData.dateFrom, formData.timeIn)) {
        toast({
          title: 'Invalid Time Selection',
          description: "Please select a future time for today's reservation.",
          variant: 'destructive',
        });
        return;
      }
    }

    if (!formData.vehicle || !formData.reservationType) {
      toast({
        title: 'Incomplete Details',
        description: 'Please complete all required fields before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (
      formData.reservationType === 'hourly' &&
      (!formData.timeIn || !formData.timeOut)
    ) {
      toast({
        title: 'Incomplete Details',
        description:
          'Please select both time in and time out for hourly reservations.',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmReservation = async () => {
    setIsSubmitting(true);

    try {
      const startTime =
        formData.reservationType === 'whole_day' ? '00:00' : formData.timeIn;
      const endTime =
        formData.reservationType === 'whole_day' ? '23:59' : formData.timeOut;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parking_space_id: lotId,
            vehicle_id: formData.vehicle,
            start_time: `${formData.dateFrom}T${startTime}:00.000Z`,
            end_time: `${formData.dateTo}T${endTime}:00.000Z`,
            reservation_type: formData.reservationType,
            hourly_rate: parkingLot.hourlyRate,
            whole_day_rate: parkingLot.whole_day_rate,
            total_price: total,
            discount: discountAmount,
            discount_note: isEligibleForDiscount
              ? `${user?.discount_level} Discount (${discountPercentage}%)`
              : null,
            unavailable_dates: unavailableDates, // Send unavailable dates to backend
          }),
        }
      );

      const response = await res.json();

      if (!res.ok) {
        toast({
          title: 'Reservation Failed',
          description:
            response.message || response.error || 'Something went wrong',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reservation Created!',
          description: 'Redirecting to payment...',
          variant: 'success',
        });
        window.location.assign(response.checkoutUrl);
      }
    } catch (error) {
      toast({
        title: 'Reservation Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackData.rating || !feedbackData.comment.trim()) {
      toast({
        title: 'Incomplete Feedback',
        description: 'Please provide both rating and comment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parking_space_id: lotId,
          user_id: user?._id,
          rating: feedbackData.rating,
          comment: feedbackData.comment,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit feedback');

      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for your feedback.',
        variant: 'success',
      });

      setFeedbackData({ rating: 0, comment: '' });
      setShowFeedbackForm(false);
    } catch (err) {
      toast({
        title: 'Feedback Failed',
        description: 'Could not submit your feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleStarClick = (rating: number) => {
    setFeedbackData({ ...feedbackData, rating });
  };

  const handleStarHover = (rating: number) => {
    setHoveredStar(rating);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const renderStars = (rating = 0, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = interactive
        ? i <= (hoveredStar || feedbackData.rating)
        : i <= rating;

      if (interactive) {
        stars.push(
          <button
            key={i}
            type='button'
            onClick={() => handleStarClick(i)}
            onMouseEnter={() => handleStarHover(i)}
            onMouseLeave={handleStarLeave}
            className='focus:outline-none transition-colors duration-200'
          >
            <Star
              className={`w-8 h-8 ${
                isFilled
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              } transition-colors duration-200`}
            />
          </button>
        );
      } else {
        stars.push(
          <Star
            key={i}
            className={`w-4 h-4 ${
              isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        );
      }
    }
    return stars;
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    return { currentDate, currentTime };
  };

  const isTimeInPast = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) return false;

    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return selectedDateTime < now;
  };

  const getSelectedVehicle = () => {
    return vehicles
      ? vehicles.find((v) => v._id === formData.vehicle)
      : undefined;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysCount = () => {
    if (!formData.dateFrom || !formData.dateTo) return 0;
    const startDate = new Date(formData.dateFrom);
    const endDate = new Date(formData.dateTo);
    return (
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  const getAvailableDaysCount = () => {
    if (!formData.dateFrom || !formData.dateTo) return 0;

    const startDate = new Date(formData.dateFrom);
    const endDate = new Date(formData.dateTo);
    const dateArray: string[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    return dateArray.filter((date) => !unavailableDates.includes(date)).length;
  };

  const getDisabledDatesString = () => {
    return unavailableDates.join(',');
  };

  if (
    loading ||
    !parkingLot ||
    !user ||
    user.role !== UserRole.DRIVER ||
    !lotId
  )
    return null;

  if (
    parkingLot?.availability_status?.toLowerCase() ===
    AvailabilityStatus.CLOSED.toLowerCase()
  ) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-red-100'>
        <Navbar userRole='driver' userName={user?.first_name || 'User'} />
        <main className='max-w-4xl mx-auto px-4 sm:px-6 py-12'>
          <div className='mb-6'>
            <Button
              onClick={() => router.push('/parking-selection')}
              variant='ghost'
              className='text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'
            >
              <ArrowLeft className='w-5 h-5 mr-2' />
              Back to Parking Selection
            </Button>
          </div>

          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6'>
              <XCircle className='w-10 h-10 text-red-600' />
            </div>
            <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
              Parking Space Unavailable
            </h1>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              We apologize for the inconvenience. This parking facility is
              currently closed and not accepting new reservations.
            </p>
          </div>

          <div className='bg-white rounded-2xl shadow-xl border border-red-200 p-6 sm:p-8 mb-8'>
            <div className='flex items-start justify-between mb-6'>
              <div className='flex-1'>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  {parkingLot.establishment_name}
                </h2>
                <div className='flex items-center text-gray-600 mb-4'>
                  <MapPin className='w-5 h-5 mr-2' />
                  <span>
                    {parkingLot.address}, {parkingLot.city}
                  </span>
                </div>
              </div>
              <div className='bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold text-sm'>
                CLOSED
              </div>
            </div>

            <div className='bg-red-50 border border-red-200 rounded-xl p-6'>
              <div className='flex items-start space-x-4'>
                <AlertTriangle className='w-6 h-6 text-red-600 mt-1 flex-shrink-0' />
                <div>
                  <h3 className='font-semibold text-red-900 mb-2'>
                    Temporarily Closed
                  </h3>
                  <p className='text-red-700 text-sm leading-relaxed'>
                    This parking facility is currently not operational. This
                    could be due to maintenance, renovations, or other
                    operational reasons. Please check back later or choose an
                    alternative parking location.
                  </p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-400'>
                  {parkingLot.total_spaces}
                </div>
                <div className='text-sm text-gray-500'>Total Spaces</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-400'>
                  ₱{parkingLot.hourlyRate}
                </div>
                <div className='text-sm text-gray-500'>Per Hour</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-400'>
                  ₱{parkingLot.whole_day_rate}
                </div>
                <div className='text-sm text-gray-500'>Whole Day</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-500'>0</div>
                <div className='text-sm text-gray-500'>Available</div>
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={() => router.push('/home')}
              className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2'
            >
              <Home className='w-5 h-5' />
              <span>Back to Home</span>
            </Button>
            <Button
              onClick={() => router.push('/parking-selection')}
              variant='outline'
              className='border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2'
            >
              <MapPin className='w-5 h-5' />
              <span>Find Other Parking</span>
            </Button>
          </div>

          <div className='mt-12 text-center'>
            <div className='bg-blue-50 border border-blue-200 rounded-xl p-6'>
              <Clock className='w-8 h-8 text-blue-600 mx-auto mb-4' />
              <h3 className='font-semibold text-blue-900 mb-2'>
                Need Help Finding Parking?
              </h3>
              <p className='text-blue-700 text-sm mb-4'>
                We can help you find alternative parking spaces in the same
                area.
              </p>
              <Button
                onClick={() =>
                  router.push(
                    '/parking-selection?city=' +
                      encodeURIComponent(parkingLot.city)
                  )
                }
                variant='outline'
                size='sm'
                className='border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
              >
                Search Nearby Parking
              </Button>
            </div>
          </div>
        </main>

        <footer className='text-center py-8 text-gray-600 border-t border-gray-200 bg-white'>
          <p className='mb-2'>
            <Link href='/about'>About Us</Link>
          </p>
          <p>© 2025 SpaceSure. All Rights Reserved</p>
        </footer>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <Navbar />

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4'>
                <CheckCircle className='w-8 h-8 text-blue-600' />
              </div>
              <h2 className='text-2xl font-bold text-center text-gray-900 mb-2'>
                Confirm Your Reservation
              </h2>
              <p className='text-gray-600 text-center mb-6'>
                Please review your booking details before proceeding to payment.
              </p>

              <div className='space-y-4 mb-6'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center mb-2'>
                    <MapPin className='w-5 h-5 text-gray-500 mr-2' />
                    <span className='font-semibold text-gray-900'>
                      Location
                    </span>
                  </div>
                  <p className='text-gray-700 ml-7'>
                    {parkingLot.establishment_name}
                  </p>
                  <p className='text-sm text-gray-500 ml-7'>
                    {parkingLot.address}, {parkingLot.city}
                  </p>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center mb-2'>
                    <Car className='w-5 h-5 text-gray-500 mr-2' />
                    <span className='font-semibold text-gray-900'>Vehicle</span>
                  </div>
                  <p className='text-gray-700 ml-7'>
                    {getSelectedVehicle()?.year_make_model} -{' '}
                    {getSelectedVehicle()?.plate_number}
                  </p>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center mb-2'>
                    <Calendar className='w-5 h-5 text-gray-500 mr-2' />
                    <span className='font-semibold text-gray-900'>
                      Date Range
                    </span>
                  </div>
                  <p className='text-gray-700 ml-7'>
                    {formData.dateFrom === formData.dateTo
                      ? formatDate(formData.dateFrom)
                      : `${formatDate(formData.dateFrom)} - ${formatDate(
                          formData.dateTo
                        )}`}
                  </p>
                  <p className='text-sm text-gray-500 ml-7'>
                    {getAvailableDaysCount()} available day
                    {getAvailableDaysCount() !== 1 ? 's' : ''}
                    {unavailableDates.length > 0 && (
                      <span className='text-red-600'>
                        {' '}
                        ({unavailableDates.length} day
                        {unavailableDates.length !== 1 ? 's' : ''} unavailable)
                      </span>
                    )}
                  </p>
                  {formData.reservationType === 'hourly' ? (
                    <p className='text-sm text-gray-500 ml-7'>
                      {formatTime(formData.timeIn)} -{' '}
                      {formatTime(formData.timeOut)} daily
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500 ml-7'>
                      Whole Day (12:00 AM - 11:59 PM) daily
                    </p>
                  )}
                </div>

                {/* Discount Information */}
                {isEligibleForDiscount && (
                  <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                    <div className='flex items-center mb-2'>
                      <Percent className='w-5 h-5 text-green-600 mr-2' />
                      <span className='font-semibold text-green-900'>
                        {user?.discount_level} Discount Applied
                      </span>
                    </div>
                    <div className='ml-7 space-y-1'>
                      <p className='text-sm text-green-700'>
                        Original Amount: ₱{originalTotal.toFixed(2)}
                      </p>
                      <p className='text-sm text-green-700'>
                        Discount ({discountPercentage}%): -₱
                        {discountAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <CreditCard className='w-5 h-5 text-blue-600 mr-2' />
                      <span className='font-semibold text-blue-900'>
                        Total Amount
                      </span>
                    </div>
                    <span className='text-2xl font-bold text-blue-600'>
                      ₱{total.toFixed(2)}
                    </span>
                  </div>
                  <p className='text-sm text-blue-700 ml-7'>
                    {formData.reservationType === 'whole_day'
                      ? `${getAvailableDaysCount()} available day${
                          getAvailableDaysCount() !== 1 ? 's' : ''
                        } @ ₱${parkingLot.whole_day_rate}/day`
                      : `${getAvailableDaysCount()} available day${
                          getAvailableDaysCount() !== 1 ? 's' : ''
                        } × ${Math.max(
                          1,
                          Number.parseInt(formData.timeOut.split(':')[0]) -
                            Number.parseInt(formData.timeIn.split(':')[0])
                        )} hour${
                          Math.max(
                            1,
                            Number.parseInt(formData.timeOut.split(':')[0]) -
                              Number.parseInt(formData.timeIn.split(':')[0])
                          ) !== 1
                            ? 's'
                            : ''
                        } @ ₱${parkingLot.hourlyRate}/hr`}
                  </p>
                </div>
              </div>

              <div className='flex gap-3'>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant='outline'
                  className='flex-1'
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReservation}
                  className='flex-1 bg-blue-600 hover:bg-blue-700'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className='w-4 h-4 mr-2' />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
        <div className='mb-6'>
          <Button
            onClick={() => router.push('/parking-selection')}
            variant='ghost'
            className='text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'
          >
            <ArrowLeft className='w-5 h-5 mr-2' />
            Back to Parking Selection
          </Button>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12'>
          <div className='space-y-4 sm:space-y-6'>
            <div className='relative rounded-xl overflow-hidden shadow-2xl'>
              <img
                src={
                  parkingLot.mapImage ||
                  `/placeholder.svg?height=400&width=500&text=${
                    encodeURIComponent(parkingLot.establishment_name) ||
                    '/placeholder.svg'
                  }+Map`
                }
                alt='Parking location map'
                className='w-full h-64 sm:h-96 object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
            </div>

            <div className='bg-white rounded-xl shadow-xl p-4 sm:p-6 text-center'>
              <h2 className='text-xl sm:text-3xl font-bold mb-3 text-gray-800'>
                {parkingLot.establishment_name}
              </h2>
              <div className='space-y-2 text-gray-600'>
                <p className='flex items-center justify-center text-sm sm:text-base'>
                  <MapPin className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                  {parkingLot.city}
                </p>
                <p className='text-base sm:text-lg'>{parkingLot.address}</p>
              </div>

              {/* Simple Capacity Display */}
              <div className='mt-6 space-y-2'>
                <p className='text-sm sm:text-base text-gray-700'>
                  Total Capacity:{' '}
                  <span className='font-bold'>
                    {parkingLot.total_spaces} spaces
                  </span>
                </p>
                <p className='text-sm sm:text-base text-gray-700'>
                  Available Spaces:{' '}
                  <span className='font-bold'>
                    {parkingLot.available_spaces} spaces
                  </span>
                </p>
                <p className='text-xs text-gray-500'>
                  Availability varies by date and time
                </p>
              </div>

              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mt-4 space-y-2'>
                <p className='text-lg sm:text-xl font-bold text-blue-800'>
                  Rate: ₱{parkingLot.hourlyRate.toFixed(2)} / hour
                </p>
                <p className='text-sm text-blue-700'>
                  Whole Day Rate: ₱{parkingLot.whole_day_rate.toFixed(2)}
                </p>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-xl p-6 border-0'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-gray-800 flex items-center'>
                  <Star className='w-5 h-5 mr-2 text-yellow-500' />
                  Customer Feedback
                </h2>
                {/* Only show button if feedbackEnabled is true */}
                {parkingLot.feedbackEnabled && !showFeedbackForm && (
                  <Button
                    onClick={() => setShowFeedbackForm(true)}
                    variant='outline'
                    className='border-blue-600 text-blue-600 hover:bg-blue-50'
                  >
                    <MessageSquare className='w-4 h-4 mr-2' />
                    Leave Feedback
                  </Button>
                )}
              </div>

              {/* Show form only if feedbackEnabled and showFeedbackForm is true */}
              {parkingLot.feedbackEnabled && showFeedbackForm && (
                <form onSubmit={handleFeedbackSubmit} className='space-y-6'>
                  <div>
                    <Label className='text-sm font-medium mb-3 block text-gray-700'>
                      Rating
                    </Label>
                    <div className='flex items-center space-x-1'>
                      {renderStars(0, true)}
                      {feedbackData.rating > 0 && (
                        <span className='ml-3 text-sm text-gray-600'>
                          {feedbackData.rating} out of 5 stars
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor='comment'
                      className='text-sm font-medium mb-2 block text-gray-700'
                    >
                      Comment
                    </Label>
                    <Textarea
                      id='comment'
                      value={feedbackData.comment}
                      onChange={(e) =>
                        setFeedbackData({
                          ...feedbackData,
                          comment: e.target.value,
                        })
                      }
                      placeholder='Share your thoughts about this parking space...'
                      className='w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-blue-300 min-h-[100px] resize-vertical'
                      required
                    />
                  </div>

                  <div className='flex gap-4'>
                    <Button
                      type='button'
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setFeedbackData({ rating: 0, comment: '' });
                      }}
                      variant='outline'
                      className='flex-1'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={isSubmittingFeedback}
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className='h-4 w-4 mr-2' />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Always show feedback list, regardless of feedbackEnabled */}
              <div className='space-y-6 mt-8'>
                {feedbacks.length > 0 ? (
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                      Recent Reviews
                    </h3>
                    <div className='space-y-4 max-h-96 overflow-y-auto'>
                      {feedbacks.map((fb, idx) => (
                        <div
                          key={idx}
                          className='bg-gray-50 border border-gray-200 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center space-x-1'>
                              {renderStars(fb.rating)}
                              <span className='ml-2 text-sm font-medium text-gray-700'>
                                {fb.rating}/5 stars
                              </span>
                            </div>
                            <span className='text-xs text-gray-500'>
                              {new Date(fb.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className='text-gray-700 text-sm leading-relaxed'>
                            {fb.comment}
                          </p>
                          {fb.user && (
                            <p className='text-xs text-gray-500 mt-2'>
                              By {fb.user.first_name} {fb.user.last_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <MessageSquare className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <p>
                      No reviews yet. Be the first to share your experience!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-2xl p-6 sm:p-8 border-0'>
            <h1 className='text-xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              RESERVATION FORM
            </h1>

            {/* Discount Status Banner */}
            {isEligibleForDiscount && (
              <div className='bg-green-50 border border-green-200 rounded-xl p-4 mb-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Percent className='w-5 h-5 text-green-600' />
                  <h3 className='font-semibold text-green-900'>
                    {user?.discount_level} Discount Active
                  </h3>
                </div>
                <p className='text-green-700 text-sm'>
                  You're eligible for a {discountPercentage}% discount on all
                  reservations. The discount will be automatically applied at
                  checkout.
                </p>
              </div>
            )}

            <form
              onSubmit={handleFormSubmit}
              className='space-y-4 sm:space-y-6'
            >
              <div>
                <Label
                  htmlFor='vehicle'
                  className='text-base font-semibold mb-2 text-gray-700'
                >
                  Select Vehicle:
                </Label>
                <Select
                  value={formData.vehicle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle: value })
                  }
                >
                  <SelectTrigger className='w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'>
                    <SelectValue placeholder='Select From Enrolled Vehicles' />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length > 0 ? (
                      vehicles.map((v) => (
                        <SelectItem key={v._id} value={v._id}>
                          {v?.year_make_model} - {v?.plate_number}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='p-2 text-gray-500'>No vehicles found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Selection */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label
                    htmlFor='dateFrom'
                    className='text-base font-semibold mb-2 block text-gray-700'
                  >
                    Start Date
                  </Label>
                  <Input
                    id='dateFrom'
                    type='date'
                    value={formData.dateFrom}
                    min={getCurrentDateTime().currentDate}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className='w-full p-3 text-base bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'
                    required
                  />
                  {unavailableDates.length > 0 && (
                    <p className='text-xs text-red-600 mt-1'>
                      Unavailable dates:{' '}
                      {unavailableDates
                        .map((date) => new Date(date).toLocaleDateString())
                        .join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='dateTo'
                    className='text-base font-semibold mb-2 block text-gray-700'
                  >
                    End Date
                  </Label>
                  <Input
                    id='dateTo'
                    type='date'
                    value={formData.dateTo}
                    min={formData.dateFrom || getCurrentDateTime().currentDate}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className='w-full p-3 text-base bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'
                    required
                  />
                </div>
              </div>

              {/* Date Range Info */}
              {formData.dateFrom && formData.dateTo && (
                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <Calendar className='w-5 h-5 text-blue-600' />
                    <h3 className='font-semibold text-blue-900'>
                      Date Range Selected
                    </h3>
                    {isCheckingAvailability && (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                    )}
                  </div>
                  <p className='text-blue-700 text-sm'>
                    {formData.dateFrom === formData.dateTo
                      ? `Single day reservation for ${formatDate(
                          formData.dateFrom
                        )}`
                      : `${getDaysCount()} day${
                          getDaysCount() !== 1 ? 's' : ''
                        } from ${formatDate(formData.dateFrom)} to ${formatDate(
                          formData.dateTo
                        )}`}
                  </p>
                  {getAvailableDaysCount() !== getDaysCount() && (
                    <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded'>
                      <p className='text-red-700 text-xs'>
                        ⚠️ {getDaysCount() - getAvailableDaysCount()} date
                        {getDaysCount() - getAvailableDaysCount() !== 1
                          ? 's'
                          : ''}{' '}
                        in your range{' '}
                        {getDaysCount() - getAvailableDaysCount() === 1
                          ? 'is'
                          : 'are'}{' '}
                        fully booked. Only {getAvailableDaysCount()} day
                        {getAvailableDaysCount() !== 1 ? 's' : ''} will be
                        reserved.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label
                  htmlFor='reservationType'
                  className='text-base font-semibold mb-2 block text-gray-700'
                >
                  Reservation Type
                </Label>
                <Select
                  value={formData.reservationType}
                  onValueChange={handleReservationTypeChange}
                >
                  <SelectTrigger className='w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'>
                    <SelectValue placeholder='Select reservation type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='hourly'>
                      Hourly - ₱{parkingLot?.hourlyRate?.toFixed(2)}/hr
                    </SelectItem>
                    <SelectItem value='whole_day'>
                      Whole Day - ₱{parkingLot?.whole_day_rate?.toFixed(2)}/day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.reservationType === 'hourly' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Label
                      htmlFor='timeIn'
                      className='text-base font-semibold mb-2 block text-gray-700'
                    >
                      Time In (Daily)
                    </Label>
                    <Input
                      id='timeIn'
                      type='time'
                      value={formData.timeIn}
                      min={
                        formData.dateFrom === getCurrentDateTime().currentDate
                          ? getCurrentDateTime().currentTime
                          : undefined
                      }
                      onChange={(e) => handleTimeInChange(e.target.value)}
                      className='w-full p-3 text-base bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor='timeOut'
                      className='text-base font-semibold mb-2 block text-gray-700'
                    >
                      Time Out (Daily)
                    </Label>
                    <Input
                      id='timeOut'
                      type='time'
                      value={formData.timeOut}
                      min={addHoursToTime(formData.timeIn, 0)}
                      onChange={(e) => handleTimeOutChange(e.target.value)}
                      className='w-full p-3 text-base bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300'
                      required
                    />
                  </div>
                </div>
              )}

              {formData.reservationType === 'whole_day' && (
                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <Clock className='w-5 h-5 text-blue-600' />
                    <h3 className='font-semibold text-blue-900'>
                      Whole Day Reservation
                    </h3>
                  </div>
                  <p className='text-blue-700 text-sm'>
                    Your vehicle can be parked from 12:00 AM to 11:59 PM each
                    day during your selected date range.
                  </p>
                </div>
              )}

              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border-2 border-blue-100'>
                <div className='text-right'>
                  <div className='mb-2'>
                    <p className='text-sm text-gray-600'>
                      {formData.reservationType === 'whole_day'
                        ? `Whole Day Rate × ${getAvailableDaysCount()} available day${
                            getAvailableDaysCount() !== 1 ? 's' : ''
                          }`
                        : `Hourly Rate × ${getAvailableDaysCount()} available day${
                            getAvailableDaysCount() !== 1 ? 's' : ''
                          } × ${
                            formData.timeIn && formData.timeOut
                              ? Math.max(
                                  1,
                                  Number.parseInt(
                                    formData.timeOut.split(':')[0]
                                  ) -
                                    Number.parseInt(
                                      formData.timeIn.split(':')[0]
                                    )
                                )
                              : 1
                          } hour${
                            Math.max(
                              1,
                              Number.parseInt(
                                formData.timeOut?.split(':')[0] || '0'
                              ) -
                                Number.parseInt(
                                  formData.timeIn?.split(':')[0] || '0'
                                )
                            ) !== 1
                              ? 's'
                              : ''
                          }`}
                    </p>
                  </div>

                  {/* Show discount breakdown if eligible */}
                  {isEligibleForDiscount && originalTotal > 0 && (
                    <div className='mb-4 space-y-1'>
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Original Amount:</span>
                        <span>₱{originalTotal.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between text-sm text-green-600'>
                        <span>
                          {user?.discount_level} Discount ({discountPercentage}
                          %):
                        </span>
                        <span>-₱{discountAmount.toFixed(2)}</span>
                      </div>
                      <hr className='border-gray-300' />
                    </div>
                  )}

                  <p className='text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                    Total: PHP {total.toFixed(2)}
                    {isEligibleForDiscount && (
                      <span className='text-sm text-green-600 block'>
                        (You saved ₱{discountAmount.toFixed(2)}!)
                      </span>
                    )}
                  </p>
                  <Button
                    type='submit'
                    disabled={
                      getAvailableDaysCount() <= 0 || isCheckingAvailability
                    }
                    className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {getAvailableDaysCount() <= 0
                      ? 'No Available Dates'
                      : isCheckingAvailability
                      ? 'Checking Availability...'
                      : 'Review Reservation'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
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
