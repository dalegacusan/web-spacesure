import Navbar from '@/components/navbar';
import VehicleTable from '@/components/vehicle-table';

const VehiclesPage = () => {
  return (
    <div className='min-h-screen bg-slate-200'>
      <Navbar />

      <main
        className='mx-auto px-4 sm:px-6 py-6 sm:py-8'
        style={{ width: '80%' }}
      >
        <h1 className='text-2xl font-semibold mb-4'>Vehicles</h1>
        <VehicleTable />
      </main>
    </div>
  );
};

export default VehiclesPage;
