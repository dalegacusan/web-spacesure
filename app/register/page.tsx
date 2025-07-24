'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/enums/roles.enum';
import { Eye, EyeOff, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth.context';

export default function RegisterPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showDataPolicy, setShowDataPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.DRIVER,
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && token) {
      switch (user.role) {
        case UserRole.DRIVER:
          router.replace('/home');
          break;
        case UserRole.ADMIN:
          router.replace('/establishment/dashboard');
          break;
        case UserRole.SUPER_ADMIN:
          router.replace('/admin/dashboard');
          break;
        default:
          router.back();
      }
    } else {
      setCheckingAuth(false);
    }
  }, [user, token, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPasswordStrong = (password: string) => {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!agreedToTerms) {
      toast({
        title: 'Agreement Required',
        description:
          'Please agree to the Terms of Service and Privacy Policy to continue.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Registration Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!isPasswordStrong(formData.password)) {
      toast({
        title: 'Weak Password',
        description:
          'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!formData.role) {
      toast({
        title: 'Registration Failed',
        description: 'Please select a user type.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName || undefined,
            phoneNumber: formData.phoneNumber || undefined,
            role: UserRole.DRIVER,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Registration Successful',
          description:
            'Your account has been created. Please login to continue.',
          variant: 'success',
        });

        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast({
          title: 'Registration Failed',
          description: result.message || result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: 'Registration Failed',
        description: 'Network or server error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) return null; // prevent flashing

  return (
    <div className='min-h-screen bg-[#3B4A9C] flex items-center justify-center px-4 py-8'>
      {/* Data Privacy Policy Modal */}
      {showDataPolicy && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-gray-900 flex items-center'>
                  <Shield className='w-6 h-6 mr-2 text-[#3B4A9C]' />
                  Data Privacy Policy
                </h2>
                <Button
                  onClick={() => setShowDataPolicy(false)}
                  variant='ghost'
                  size='sm'
                  className='text-gray-500 hover:text-gray-700'
                >
                  ×
                </Button>
              </div>
            </div>

            <div className='p-6 space-y-6 text-gray-700'>
              <p className='text-sm text-gray-600'>
                SpaceSure is committed to protecting the privacy and security of
                its users' personal data in compliance with the Data Privacy Act
                of 2012 (Republic Act No. 10173). This policy outlines how user
                information is collected, processed, stored, and protected
                within the system.
              </p>

              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    1. Collection of Personal Data
                  </h3>
                  <p className='mb-2'>
                    SpaceSure collects only the minimum necessary personal data
                    from users, including:
                  </p>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>Full Name</li>
                    <li>Contact Number</li>
                    <li>Vehicle Plate Number</li>
                    <li>Email Address (optional for notifications)</li>
                  </ul>
                  <p className='mt-2'>
                    This data is collected solely for the purpose of enabling
                    seamless parking reservations and managing user accounts.
                  </p>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    2. Use and Processing of Data
                  </h3>
                  <p className='mb-2'>
                    Personal data is processed fairly and lawfully, and is used
                    strictly for the following purposes:
                  </p>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>Parking space reservation and availability tracking</li>
                    <li>Communication with users regarding their bookings</li>
                    <li>Generation of reports for administrative purposes</li>
                    <li>System usage analysis and improvements</li>
                  </ul>
                  <p className='mt-2'>
                    Users are informed of the data collection and must provide
                    explicit consent before data is processed.
                  </p>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    3. Data Sharing
                  </h3>
                  <p>
                    SpaceSure does not sell or share user data with third
                    parties without consent. The system may integrate with
                    third-party services (e.g., payment gateways like PayMaya)
                    that are also compliant with the Data Privacy Act. Data
                    Sharing Agreements (DSAs) are enforced with all partners to
                    ensure proper handling of user data.
                  </p>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    4. User Rights
                  </h3>
                  <p className='mb-2'>Users have the right to:</p>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>Access and review their personal data</li>
                    <li>Request correction or deletion of their data</li>
                    <li>Withdraw consent at any time</li>
                    <li>
                      Be informed of any data breaches that may affect them
                    </li>
                  </ul>
                  <p className='mt-2'>
                    These rights can be exercised by contacting SpaceSure's Data
                    Privacy Officer or through the in-app data request feature.
                  </p>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    5. Data Security Measures
                  </h3>
                  <p className='mb-2'>
                    SpaceSure uses strong security protocols to protect personal
                    data, including:
                  </p>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Secure HTTPS connections</li>
                    <li>Role-based access control for administrators</li>
                    <li>Regular system audits and penetration testing</li>
                    <li>Hosting on ISO 27001-certified servers</li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    6. Data Retention and Disposal
                  </h3>
                  <p>
                    User data is retained only as long as necessary for service
                    delivery. Inactive accounts and their associated data are
                    securely deleted after 36 months of non-use. Anonymized data
                    may be used for research and statistical purposes.
                  </p>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    7. Policy Updates
                  </h3>
                  <p>
                    This policy may be updated to reflect changes in legal
                    requirements or system functionality. Users will be notified
                    of significant changes and must agree to the updated terms
                    to continue using the service.
                  </p>
                </div>
              </div>
            </div>

            <div className='p-6 border-t border-gray-200'>
              <Button
                onClick={() => setShowDataPolicy(false)}
                className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white'
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-gray-900 flex items-center'>
                  <FileText className='w-6 h-6 mr-2 text-[#3B4A9C]' />
                  Terms of Service
                </h2>
                <Button
                  onClick={() => setShowTermsOfService(false)}
                  variant='ghost'
                  size='sm'
                  className='text-gray-500 hover:text-gray-700'
                >
                  ×
                </Button>
              </div>
            </div>

            <div className='p-6 space-y-6 text-gray-700'>
              <p className='text-sm text-gray-600'>
                <strong>Objective:</strong> This policy establishes clear
                guidelines for the use of the SpaceSure parking reservation
                system to promote organized, fair, and efficient use of parking
                resources.
              </p>

              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    User Classification
                  </h3>
                  <div className='space-y-2'>
                    <p>
                      <strong>Short-Term Users</strong> are individuals who use
                      the parking facility for brief periods and are charged
                      based on hourly rates. These users typically include
                      walk-ins, guests, or one-time users who do not require
                      long-term parking access.
                    </p>
                    <p>
                      <strong>Long-Term Users</strong> are individuals who use
                      the facility more frequently and are charged using daily
                      rate.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Eligibility
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Only authorized users with a valid parking account may
                      access the reservation system.
                    </li>
                    <li>
                      Vehicles must be registered in the parking reservation
                      system to be eligible for booking a parking space.
                    </li>
                    <li>
                      Each user account must include accurate vehicle details
                      such as license plate number, make, model, and color.
                    </li>
                    <li>
                      Only vehicles with a valid reservation and matching
                      registered plate number and details are allowed to use the
                      reserved parking space.
                    </li>
                    <li>
                      Only one vehicle may be reserved per user per time slot or
                      day. Multiple simultaneous reservations for different
                      vehicles under the same user are not permitted.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Reservation Process
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Reservations can be made through the SpaceSure web or
                      mobile platform.
                    </li>
                    <li>
                      The system will automatically reserve a parking space upon
                      confirmation.
                    </li>
                    <li>
                      Reservations may be modified or canceled with partial
                      refund up to 24 hours prior to the scheduled time.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Confirmation and Access
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      A confirmation number/detail will be provided after a
                      successful reservation.
                    </li>
                    <li>
                      Entry to the parking facility will be granted only to
                      vehicles whose plate number matches the registered
                      reservation details.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Parking Duration
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Users must park only within their reserved time slot.
                    </li>
                    <li>
                      Staying beyond the allotted time may result in additional
                      charges or penalties.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Fees and Charges
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Total amount of the booking must be paid upon reservation.
                    </li>
                    <li>
                      Refunds will only be issued for cancellations made within
                      the allowed time frame. 50% if cancelled within 72 hours
                      prior to the reservation. No refund if cancellation is
                      made within 24 hours prior to the reservation.
                    </li>
                    <li>No-shows or late cancellations are non-refundable.</li>
                    <li>
                      Drivers must update discount priveleges on the Edit
                      Account page.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    System Availability
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      The system may occasionally be unavailable due to
                      maintenance or updates; notice will be provided when
                      possible.
                    </li>
                    <li>
                      The management reserves the right to change or update this
                      policy and the system at any time.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    User Responsibility
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Users must ensure their vehicle information is current and
                      accurate in the system.
                    </li>
                    <li>
                      The management is not liable for any damage, theft, or
                      loss that occurs within the parking facility.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Compliance
                  </h3>
                  <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>
                      Users are expected to comply with all terms outlined in
                      this policy.
                    </li>
                    <li>
                      Repeated or serious violations may lead to permanent
                      suspension of access to the parking reservation system.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='p-6 border-t border-gray-200'>
              <Button
                onClick={() => setShowTermsOfService(false)}
                className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white'
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='bg-[#3B4A9C] p-6 sm:p-8 w-full max-w-md'>
        <div className='text-center mb-6 sm:mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-white mb-2'>
            SPACE
            <br />
            SURE
          </h1>
          <p className='text-white/80 text-sm sm:text-base mt-4'>
            Create Your Account
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label
                htmlFor='firstName'
                className='text-white text-xs font-medium mb-2 block'
              >
                First Name *
              </Label>
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className='w-full p-2.5 text-xs bg-gray-200 border-none rounded'
                required
              />
            </div>

            <div>
              <Label
                htmlFor='lastName'
                className='text-white text-xs font-medium mb-2 block'
              >
                Last Name *
              </Label>
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className='w-full p-2.5 text-xs bg-gray-200 border-none rounded'
                required
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor='middleName'
              className='text-white text-xs font-medium mb-2 block'
            >
              Middle Name
            </Label>
            <Input
              id='middleName'
              type='text'
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              className='w-full p-2.5 text-xs bg-gray-200 border-none rounded'
            />
          </div>

          <div>
            <Label
              htmlFor='email'
              className='text-white text-xs font-medium mb-2 block'
            >
              Email Address *
            </Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className='w-full p-2.5 text-xs bg-gray-200 border-none rounded'
              required
            />
          </div>

          <div>
            <Label
              htmlFor='phoneNumber'
              className='text-white text-xs font-medium mb-2 block'
            >
              Phone Number
            </Label>
            <Input
              id='phoneNumber'
              type='tel'
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className='w-full p-2.5 text-xs bg-gray-200 border-none rounded'
              placeholder='e.g., +1234567890'
            />
          </div>

          <div>
            <Label
              htmlFor='password'
              className='text-white text-xs font-medium mb-2 block'
            >
              Password *
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className='w-full p-2.5 text-xs bg-gray-200 border-none rounded pr-10'
                required
                minLength={6}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-2 py-1 hover:bg-transparent'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4 text-gray-600' />
                ) : (
                  <Eye className='h-4 w-4 text-gray-600' />
                )}
              </Button>
            </div>
            <p className='text-xs text-gray-400 mt-2'>
              Password must be at least 12 characters and include uppercase,
              lowercase, number, and special character.
            </p>
          </div>

          <div>
            <Label
              htmlFor='confirmPassword'
              className='text-white text-xs font-medium mb-2 block'
            >
              Confirm Password *
            </Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                className='w-full p-2.5 text-xs bg-gray-200 border-none rounded pr-10'
                required
                minLength={6}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-2 py-1 hover:bg-transparent'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4 text-gray-600' />
                ) : (
                  <Eye className='h-4 w-4 text-gray-600' />
                )}
              </Button>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className='flex items-start space-x-3 pt-4'>
            <Checkbox
              id='agreement'
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
              className='mt-1 border-white data-[state=checked]:bg-[#2A3A7C] data-[state=checked]:border-[#2A3A7C]'
            />
            <Label
              htmlFor='agreement'
              className='text-white/90 text-xs leading-relaxed cursor-pointer'
            >
              I agree to the{' '}
              <button
                type='button'
                onClick={() => setShowTermsOfService(true)}
                className='underline font-semibold hover:text-white'
              >
                Terms of Service
              </button>
              ,{' '}
              <button
                type='button'
                onClick={() => setShowDataPolicy(true)}
                className='underline font-semibold hover:text-white'
              >
                Privacy Policy
              </button>{' '}
              and Cookie Policy. *
            </Label>
          </div>

          <Button
            type='submit'
            disabled={isLoading || !agreedToTerms}
            className='w-full bg-[#2A3A7C] hover:bg-[#1F2A5C] text-white text-sm py-2.5 rounded disabled:opacity-50 disabled:cursor-not-allowed mt-6'
          >
            {isLoading ? 'Creating Account...' : 'REGISTER'}
          </Button>
        </form>

        <div className='text-center mt-6 space-y-4'>
          <div className='border-t border-white/30 pt-4'>
            <p className='text-white text-sm'>
              Already Have An Account?{' '}
              <Link href='/login' className='underline font-semibold'>
                Login
              </Link>{' '}
              Here.
            </p>
          </div>
        </div>

        <div className='text-center mt-6 space-y-2'>
          <p className='text-white/60 text-xs'>
            <Link href='/about' className='hover:text-white'>
              About Us
            </Link>
          </p>
          <p className='text-white/60 text-xs'>
            © 2025 SpaceSure. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
