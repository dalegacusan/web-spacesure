import { UserRole } from './enums/roles.enum';

// Test login credentials for all three roles
export const TEST_CREDENTIALS = {
  driver: {
    email: 'driver@test.com',
    password: 'driver123',
    userData: {
      User_ID: 1,
      First_Name: 'John',
      Middle_Name: 'Michael',
      Last_Name: 'Driver',
      Email: 'driver@test.com',
      Role: UserRole.ADMIN,
      Phone_Number: '09123456789',
      Created_At: '2024-01-01T00:00:00Z',
      Updated_At: '2024-01-01T00:00:00Z',
    },
  },
  establishment: {
    email: 'establishment@test.com',
    password: 'establishment123',
    userData: {
      User_ID: 2,
      First_Name: 'Jane',
      Middle_Name: 'Marie',
      Last_Name: 'Manager',
      Email: 'establishment@test.com',
      Role: UserRole.ADMIN,
      Phone_Number: '09987654321',
      Created_At: '2024-01-01T00:00:00Z',
      Updated_At: '2024-01-01T00:00:00Z',
    },
  },
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    userData: {
      User_ID: 3,
      First_Name: 'Admin',
      Middle_Name: 'Super',
      Last_Name: 'User',
      Email: 'admin@test.com',
      Role: UserRole.ADMIN,
      Phone_Number: '09555666777',
      Created_At: '2024-01-01T00:00:00Z',
      Updated_At: '2024-01-01T00:00:00Z',
    },
  },
};

// Test parking spaces data
export const TEST_PARKING_SPACES = [
  {
    Parking_Space_ID: 1,
    City: 'Makati City',
    Establishment_Name: 'Park Square',
    Address: 'Ayala Avenue, Makati City',
    Total_Spaces: 100,
    Available_Spaces: 75,
    Hourly_Rate: 50.0,
    Whole_Day_Rate: 500.0,
    Availability_Status: 'Available',
    Created_At: '2024-01-01T00:00:00Z',
    Updated_At: '2024-01-01T00:00:00Z',
    IsDeleted: false,
  },
  {
    Parking_Space_ID: 2,
    City: 'Makati City',
    Establishment_Name: 'Best & Safe Central Parking',
    Address: 'Dela Rosa Street, Makati City',
    Total_Spaces: 80,
    Available_Spaces: 20,
    Hourly_Rate: 60.0,
    Whole_Day_Rate: 600.0,
    Availability_Status: 'Limited',
    Created_At: '2024-01-01T00:00:00Z',
    Updated_At: '2024-01-01T00:00:00Z',
    IsDeleted: false,
  },
  {
    Parking_Space_ID: 3,
    City: 'Makati City',
    Establishment_Name: 'Salcedo Covered Car Park',
    Address: 'Salcedo Village, Makati City',
    Total_Spaces: 120,
    Available_Spaces: 0,
    Hourly_Rate: 60.0,
    Whole_Day_Rate: 650.0,
    Availability_Status: 'Full',
    Created_At: '2024-01-01T00:00:00Z',
    Updated_At: '2024-01-01T00:00:00Z',
    IsDeleted: false,
  },
];

// Test vehicles data
export const TEST_VEHICLES = [
  {
    Vehicle_ID: 1,
    User_ID: 1,
    Vehicle_Type: 'Sedan',
    Year_Make_Model: '2020 Toyota Camry',
    Color: 'White',
    Plate_Number: 'ABC 123',
    Created_At: '2024-01-01T00:00:00Z',
    Updated_At: '2024-01-01T00:00:00Z',
  },
  {
    Vehicle_ID: 2,
    User_ID: 1,
    Vehicle_Type: 'SUV',
    Year_Make_Model: '2019 Honda CR-V',
    Color: 'Black',
    Plate_Number: 'XYZ 789',
    Created_At: '2024-01-01T00:00:00Z',
    Updated_At: '2024-01-01T00:00:00Z',
  },
];

// Test reservations data
export const TEST_RESERVATIONS = [
  {
    Reservation_ID: 1,
    User_ID: 1,
    Parking_Space_ID: 1,
    Vehicle_ID: 1,
    Start_Time: '2024-06-18T16:00:00Z',
    End_Time: '2024-06-18T20:00:00Z',
    Reservation_Type: 'hourly',
    Hourly_Rate: 50.0,
    Whole_Day_Rate: 500.0,
    Discount: 0.0,
    Tax: 20.0,
    Total_Price: 220.0,
    Status: 'Confirmed',
    Created_At: '2024-06-18T10:00:00Z',
    Updated_At: '2024-06-18T10:00:00Z',
  },
];
