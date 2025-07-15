import Navbar from '@/components/navbar';
import ParkingManagement from '@/components/parking-management';

export default function ParkingManagementPage() {
  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />
      <main
        className='mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{ width: '80%' }}
      >
        <ParkingManagement />
      </main>
    </div>
  );
}
