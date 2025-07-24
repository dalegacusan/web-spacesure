'use client';

import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/enums/roles.enum';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  MapPin,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/auth.context';

export default function AboutPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [showDataPolicy, setShowDataPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const teamMembers = [
    { name: 'Karl Ayn Escalona', role: 'Backend Developer' },
    { name: 'Dale Patrick Gacusan', role: 'Lead Developer' },
    { name: 'Bryle B2 Reyes', role: 'Frontend Developer' },
    { name: 'Jeremiah Eli Lucas', role: 'System Analyst' },
  ];

  const handleBackToHome = () => {
    if (user && token) {
      switch (user.role) {
        case UserRole.DRIVER:
          router.push('/home');
          break;
        case UserRole.ADMIN:
          router.push('/establishment/dashboard');
          break;
        case UserRole.SUPER_ADMIN:
          router.push('/admin/dashboard');
          break;
        default:
          router.push('/home');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className='min-h-screen bg-[#3B4A9C]'>
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
                  Parking Reservation Policy
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

      <main className='max-w-4xl mx-auto px-6 py-12'>
        {/* Back to Home Button - Improved UI */}
        <div className='mb-8'>
          <Button
            onClick={handleBackToHome}
            className='bg-white text-[#3B4A9C] hover:bg-gray-100 border-2 border-white shadow-lg flex items-center space-x-2 px-6 py-3 font-semibold'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>{user && token ? 'Back to Dashboard' : 'Back to Login'}</span>
          </Button>
        </div>

        {/* Header Section */}
        <div className='text-center mb-12'>
          <div className='bg-white rounded-3xl shadow-2xl p-8'>
            <div className='mb-6'>
              <Image
                src='/SPACESURE_WHITE.png'
                height={120}
                width={120}
                alt='SpaceSure Logo'
                className='mx-auto mb-4 bg-[#3B4A9C] p-4 rounded-full'
              />
            </div>
            <h1 className='text-4xl font-bold text-[#3B4A9C] mb-4'>
              About SPACESURE
            </h1>
            <p className='text-xl text-[#2A3A7C] font-semibold'>
              Park with Confidence, Reserve with Ease
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className='bg-white rounded-3xl shadow-2xl mb-8'>
          <div className='p-8'>
            {/* Project Overview */}
            <div className='mb-8'>
              <div className='flex items-center mb-4'>
                <Target className='w-6 h-6 mr-3 text-[#3B4A9C]' />
                <h2 className='text-2xl font-bold text-[#3B4A9C]'>
                  Our Mission
                </h2>
              </div>
              <p className='text-gray-700 leading-relaxed'>
                SPACESURE is an innovative reserved parking management system
                developed as a Capstone Project by Karl Ayn Escalona, Dale
                Patrick Gacusan, Bryle B2 Reyes, and Jeremiah Eli Lucas. The
                project was created in 2025 as part of their academic journey at
                De La Salle–College of Saint Benilde. Born from a shared vision
                to solve the growing challenges of urban parking, SPACESURE is
                designed to streamline the reservation and management of parking
                spaces—making the experience more efficient, reliable, and
                stress-free for both providers and users.
              </p>
            </div>

            {/* Academic Information */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
              <div className='bg-blue-50 rounded-xl p-4 border border-blue-200'>
                <div className='flex items-center mb-2'>
                  <Calendar className='w-5 h-5 mr-2 text-[#3B4A9C]' />
                  <span className='font-semibold text-[#3B4A9C]'>Year</span>
                </div>
                <p className='text-gray-600'>2025</p>
              </div>
              <div className='bg-blue-50 rounded-xl p-4 border border-blue-200'>
                <div className='flex items-center mb-2'>
                  <GraduationCap className='w-5 h-5 mr-2 text-[#3B4A9C]' />
                  <span className='font-semibold text-[#3B4A9C]'>
                    Institution
                  </span>
                </div>
                <p className='text-gray-600'>
                  De La Salle–College of Saint Benilde
                </p>
              </div>
              <div className='bg-blue-50 rounded-xl p-4 border border-blue-200'>
                <div className='flex items-center mb-2'>
                  <Target className='w-5 h-5 mr-2 text-[#3B4A9C]' />
                  <span className='font-semibold text-[#3B4A9C]'>
                    Project Type
                  </span>
                </div>
                <p className='text-gray-600'>Capstone Project</p>
              </div>
            </div>

            {/* Team Section */}
            <div className='mb-8'>
              <div className='flex items-center mb-6'>
                <Users className='w-6 h-6 mr-3 text-[#3B4A9C]' />
                <h2 className='text-2xl font-bold text-[#3B4A9C]'>
                  Development Team
                </h2>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className='text-center p-4 bg-blue-50 rounded-xl border border-blue-200'
                  >
                    <div className='w-16 h-16 bg-[#3B4A9C] rounded-full flex items-center justify-center mx-auto mb-3'>
                      <Users className='w-8 h-8 text-white' />
                    </div>
                    <h3 className='font-semibold text-[#3B4A9C] mb-1'>
                      {member.name}
                    </h3>
                    <p className='text-sm text-[#2A3A7C] font-medium'>
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features and Benefits */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
              <div>
                <div className='flex items-center mb-4'>
                  <MapPin className='w-6 h-6 mr-3 text-[#3B4A9C]' />
                  <h3 className='text-xl font-bold text-[#3B4A9C]'>
                    Key Features
                  </h3>
                </div>
                <ul className='space-y-2 text-gray-700'>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Real-time parking space availability</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Easy online reservation system</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Secure payment processing</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>User-friendly mobile interface</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Comprehensive admin dashboard</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className='flex items-center mb-4'>
                  <Clock className='w-6 h-6 mr-3 text-[#3B4A9C]' />
                  <h3 className='text-xl font-bold text-[#3B4A9C]'>Benefits</h3>
                </div>
                <ul className='space-y-2 text-gray-700'>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Reduces time spent searching for parking</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Guarantees parking space availability</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Streamlines parking management</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Improves urban mobility efficiency</span>
                  </li>
                  <li className='flex items-start'>
                    <div className='w-2 h-2 bg-[#3B4A9C] rounded-full mt-2 mr-3 flex-shrink-0'></div>
                    <span>Enhances user experience</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Vision Section */}
            <div className='bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8'>
              <div className='flex items-center mb-4'>
                <Target className='w-6 h-6 mr-3 text-[#3B4A9C]' />
                <h3 className='text-xl font-bold text-[#3B4A9C]'>Our Vision</h3>
              </div>
              <p className='text-gray-700 leading-relaxed text-center'>
                We envision a future where finding and reserving parking spaces
                is no longer a source of stress or frustration. Through
                SPACESURE, we aim to create a seamless digital ecosystem that
                connects parking space providers with users, optimizing urban
                mobility and contributing to smarter, more efficient cities.
              </p>
            </div>

            {/* Policy Buttons */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
              <Button
                onClick={() => setShowDataPolicy(true)}
                variant='outline'
                className='border-[#3B4A9C] text-[#3B4A9C] hover:bg-blue-50 p-4 h-auto flex items-center justify-center space-x-2'
              >
                <Shield className='w-5 h-5' />
                <span>Data Privacy Policy</span>
              </Button>
              <Button
                onClick={() => setShowTermsOfService(true)}
                variant='outline'
                className='border-[#3B4A9C] text-[#3B4A9C] hover:bg-blue-50 p-4 h-auto flex items-center justify-center space-x-2'
              >
                <FileText className='w-5 h-5' />
                <span>Terms of Service</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className='text-center bg-white rounded-3xl shadow-2xl p-6'>
          <p className='text-gray-600 mb-2'>
            This project represents our commitment to innovation, technology,
            and solving real-world problems through creative solutions.
          </p>
          <p className='text-sm text-gray-500'>
            © 2025 SPACESURE Development Team. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
