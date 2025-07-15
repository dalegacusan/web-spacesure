import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, GraduationCap, Target, Users } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  const teamMembers = [
    { name: 'Karl Ayn Escalona', role: 'Lead Developer' },
    { name: 'Dale Patrick Gacusan', role: 'Backend Developer' },
    { name: 'Bryle B2 Reyes', role: 'Frontend Developer' },
    { name: 'Jeremiah Eli Lucas', role: 'System Analyst' },
  ];

  return (
    <div className='min-h-screen bg-slate-100'>
      <main className='max-w-6xl mx-auto px-6 py-8'>
        {/* Header Section */}
        <Image src='SPACESURE.png' height={200} width={200} alt='logo' />

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
          {/* Project Overview */}
          <Card className='bg-white shadow-lg'>
            <CardHeader className='bg-blue-600 text-white'>
              <CardTitle className='flex items-center text-xl'>
                <Target className='w-6 h-6 mr-3' />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <p className='text-gray-700 leading-relaxed'>
                SPACESURE is an innovative reserved parking management system
                developed as a Capstone Project by a dedicated team of students.
                Born from a shared vision to solve the growing challenges of
                urban parking, SPACESURE is designed to streamline the
                reservation and management of parking spaces—making the
                experience more efficient, reliable, and stress-free for both
                providers and users.
              </p>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className='bg-white shadow-lg'>
            <CardHeader className='bg-green-600 text-white'>
              <CardTitle className='flex items-center text-xl'>
                <GraduationCap className='w-6 h-6 mr-3' />
                Academic Project
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <div className='flex items-center'>
                  <Calendar className='w-5 h-5 mr-3 text-green-600' />
                  <div>
                    <p className='font-semibold text-gray-800'>Year</p>
                    <p className='text-gray-600'>2025</p>
                  </div>
                </div>
                <div className='flex items-center'>
                  <GraduationCap className='w-5 h-5 mr-3 text-green-600' />
                  <div>
                    <p className='font-semibold text-gray-800'>Institution</p>
                    <p className='text-gray-600'>
                      De La Salle–College of Saint Benilde
                    </p>
                  </div>
                </div>
                <div className='flex items-center'>
                  <Target className='w-5 h-5 mr-3 text-green-600' />
                  <div>
                    <p className='font-semibold text-gray-800'>Project Type</p>
                    <p className='text-gray-600'>Capstone Project</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <Card className='bg-white shadow-lg mb-12'>
          <CardHeader className='bg-purple-600 text-white'>
            <CardTitle className='flex items-center text-xl'>
              <Users className='w-6 h-6 mr-3' />
              Development Team
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className='text-center p-4 bg-gray-50 rounded-lg'
                >
                  <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                    <Users className='w-8 h-8 text-purple-600' />
                  </div>
                  <h3 className='font-semibold text-gray-800 mb-1'>
                    {member.name}
                  </h3>
                  <p className='text-sm text-gray-600'>{member.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <Card className='bg-white shadow-lg'>
          <CardHeader className='bg-orange-600 text-white'>
            <CardTitle className='flex items-center text-xl'>
              <Target className='w-6 h-6 mr-3' />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            <p className='text-gray-700 leading-relaxed text-center'>
              We envision a future where finding and reserving parking spaces is
              no longer a source of stress or frustration. Through SPACESURE, we
              aim to create a seamless digital ecosystem that connects parking
              space providers with users, optimizing urban mobility and
              contributing to smarter, more efficient cities.
            </p>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className='text-center mt-12 p-6 bg-white rounded-lg shadow-lg'>
          <p className='text-gray-600'>
            This project represents our commitment to innovation, technology,
            and solving real-world problems through creative solutions.
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            © 2025 SPACESURE Development Team. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
